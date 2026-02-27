import "server-only";
import { getDomainConfig, verifyDomainOnVercel } from "@/lib/vercel/domains";
import type { DnsRecord, DomainVerificationData } from "@shared/types";

export interface DnsCheckResult {
  configured: boolean;
  verified: boolean;
  errors: string[];
}

/**
 * Check DNS configuration for a domain via Vercel's API.
 */
export async function checkDns(domain: string): Promise<DnsCheckResult> {
  try {
    const config = await getDomainConfig(domain);

    if (config.misconfigured) {
      return {
        configured: false,
        verified: false,
        errors: ["DNS records are misconfigured"],
      };
    }

    const verifyResult = await verifyDomainOnVercel(domain);

    if (verifyResult.verified) {
      return { configured: true, verified: true, errors: [] };
    }

    const errors: string[] = [];
    if (verifyResult.error) {
      errors.push(verifyResult.error.message ?? "Verification failed");
    }

    return { configured: false, verified: false, errors };
  } catch (err) {
    return {
      configured: false,
      verified: false,
      errors: [err instanceof Error ? err.message : "DNS check failed"],
    };
  }
}

/**
 * Build the DNS records the user needs to configure.
 */
export function buildDnsInstructions(
  domain: string,
  isApex: boolean,
  verificationData?: DomainVerificationData | null
): DnsRecord[] {
  const records: DnsRecord[] = [];

  // TXT verification record (if Vercel returned one)
  if (verificationData?.verification) {
    for (const v of verificationData.verification) {
      if (v.type === "TXT") {
        records.push({
          type: "TXT",
          name: v.domain,
          value: v.value,
        });
      }
    }
  }

  if (isApex) {
    records.push({
      type: "A",
      name: "@",
      value: "76.76.21.21",
    });
    records.push({
      type: "CNAME",
      name: "www",
      value: "cname.vercel-dns.com",
    });
  } else {
    // Subdomain: CNAME record
    const subdomain = domain.split(".")[0];
    records.push({
      type: "CNAME",
      name: subdomain,
      value: "cname.vercel-dns.com",
    });
  }

  return records;
}
