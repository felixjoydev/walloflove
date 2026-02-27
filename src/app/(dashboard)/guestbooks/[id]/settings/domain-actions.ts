"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getGuestbook,
  updateGuestbookDomain,
  isDomainTaken,
} from "@/lib/repositories/guestbook.repo";
import { validateDomain } from "@/lib/domain/validate";
import { addDomainToVercel, removeDomainFromVercel } from "@/lib/vercel/domains";
import { checkDns, buildDnsInstructions } from "@/lib/domain/dns-check";
import { invalidateDomainCache } from "@/lib/domain/cache";
import { getDomainOpLimiter } from "@/lib/utils/rate-limit";
import type { DnsRecord, DomainVerificationData } from "@shared/types";
import { parse as parseDomain } from "tldts";

async function authAndOwnership(guestbookId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const guestbook = await getGuestbook(supabase, guestbookId);
  if (!guestbook || guestbook.user_id !== user.id) {
    return { error: "Not found" as const };
  }

  return { supabase, user, guestbook };
}

export async function addDomainAction(
  guestbookId: string,
  domain: string
): Promise<{ error: string | null; dnsRecords?: DnsRecord[] }> {
  const auth = await authAndOwnership(guestbookId);
  if ("error" in auth) return { error: auth.error as string };
  const { supabase, user, guestbook } = auth;

  // Rate limit
  const limiter = getDomainOpLimiter();
  const { success } = await limiter.limit(user.id);
  if (!success) return { error: "Too many domain operations. Try again later." };

  // Validate domain format
  const validation = validateDomain(domain);
  if (!validation.valid) return { error: validation.error! };
  const hostname = validation.hostname!;
  const isApex = validation.isApex!;

  // Check not already taken
  const taken = await isDomainTaken(supabase, hostname, guestbookId);
  if (taken) return { error: "This domain is already connected to another guestbook" };

  // If guestbook already has a different domain, remove it first
  if (guestbook.custom_domain && guestbook.custom_domain !== hostname) {
    const existingParsed = parseDomain(guestbook.custom_domain);
    const existingIsApex =
      !!existingParsed.domain &&
      Boolean(existingParsed.isIcann) &&
      !existingParsed.subdomain;
    await removeDomainFromVercel(guestbook.custom_domain, existingIsApex);
    await invalidateDomainCache(guestbook.custom_domain);
  }

  // Add to Vercel
  const vercelResult = await addDomainToVercel(hostname, isApex);
  if (vercelResult.error) return { error: vercelResult.error };

  // Extract verification data from Vercel response
  const vercelData = vercelResult.verificationData as Record<string, unknown> | undefined;
  const verificationData: DomainVerificationData = {
    verification: (vercelData?.verification as DomainVerificationData["verification"]) ?? [],
    isApex,
  };

  // Save to DB
  try {
    await updateGuestbookDomain(supabase, guestbookId, {
      custom_domain: hostname,
      domain_verified: false,
      domain_vercel_status: "pending_dns",
      domain_verification_data: verificationData as unknown as Record<string, unknown>,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to save domain";
    if (msg.includes("unique") || msg.includes("duplicate")) {
      return { error: "This domain is already connected to another guestbook" };
    }
    return { error: msg };
  }

  await invalidateDomainCache(hostname);

  const dnsRecords = buildDnsInstructions(hostname, isApex, verificationData);
  return { error: null, dnsRecords };
}

export async function verifyDomainAction(
  guestbookId: string
): Promise<{ error: string | null; verified?: boolean; errors?: string[] }> {
  const auth = await authAndOwnership(guestbookId);
  if ("error" in auth) return { error: auth.error as string };
  const { supabase, user, guestbook } = auth;

  if (!guestbook.custom_domain) {
    return { error: "No domain connected" };
  }

  // Rate limit
  const limiter = getDomainOpLimiter();
  const { success } = await limiter.limit(user.id);
  if (!success) return { error: "Too many domain operations. Try again later." };

  const result = await checkDns(guestbook.custom_domain);

  if (result.verified) {
    await updateGuestbookDomain(supabase, guestbookId, {
      domain_verified: true,
      domain_vercel_status: "verified",
    });
    await invalidateDomainCache(guestbook.custom_domain);
    return { error: null, verified: true };
  }

  return { error: null, verified: false, errors: result.errors };
}

export async function removeDomainAction(
  guestbookId: string
): Promise<{ error: string | null }> {
  const auth = await authAndOwnership(guestbookId);
  if ("error" in auth) return { error: auth.error as string };
  const { supabase, user, guestbook } = auth;

  if (!guestbook.custom_domain) {
    return { error: "No domain connected" };
  }

  // Rate limit
  const limiter = getDomainOpLimiter();
  const { success } = await limiter.limit(user.id);
  if (!success) return { error: "Too many domain operations. Try again later." };

  const verificationData = guestbook.domain_verification_data as DomainVerificationData | null;
  const isApex = verificationData?.isApex ?? false;
  const oldDomain = guestbook.custom_domain;

  // Remove from Vercel (best effort — still clear DB even if Vercel fails)
  await removeDomainFromVercel(oldDomain, isApex).catch(() => {});

  // Clear DB
  await updateGuestbookDomain(supabase, guestbookId, {
    custom_domain: null,
    domain_verified: false,
    domain_vercel_status: "none",
    domain_verification_data: null,
  });

  await invalidateDomainCache(oldDomain);
  return { error: null };
}

export async function getDomainStatusAction(
  guestbookId: string
): Promise<{
  error: string | null;
  domain?: string | null;
  verified?: boolean;
  vercelStatus?: string;
  dnsRecords?: DnsRecord[];
}> {
  const auth = await authAndOwnership(guestbookId);
  if ("error" in auth) return { error: auth.error as string };
  const { guestbook } = auth;

  if (!guestbook.custom_domain) {
    return { error: null, domain: null };
  }

  const verificationData = guestbook.domain_verification_data as DomainVerificationData | null;
  const isApex = verificationData?.isApex ?? false;
  const dnsRecords = buildDnsInstructions(
    guestbook.custom_domain,
    isApex,
    verificationData
  );

  return {
    error: null,
    domain: guestbook.custom_domain,
    verified: guestbook.domain_verified,
    vercelStatus: guestbook.domain_vercel_status,
    dnsRecords,
  };
}
