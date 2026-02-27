"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DnsTable } from "./connect-domain-modal";
import {
  verifyDomainAction,
  removeDomainAction,
} from "@/app/(dashboard)/guestbooks/[id]/settings/domain-actions";
import type { DnsRecord } from "@shared/types";

export function DomainStatusCard({
  guestbookId,
  domain,
  verified,
  dnsRecords,
}: {
  guestbookId: string;
  domain: string;
  verified: boolean;
  dnsRecords: DnsRecord[];
}) {
  const router = useRouter();
  const [checking, setChecking] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [isVerified, setIsVerified] = useState(verified);

  async function handleCheckDns() {
    setChecking(true);
    const result = await verifyDomainAction(guestbookId);
    setChecking(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    if (result.verified) {
      setIsVerified(true);
      toast.success("Domain verified! Your custom domain is now connected.");
      router.refresh();
    } else {
      const errorMsg = result.errors?.length
        ? result.errors[0]
        : "DNS records not yet configured. Please check your DNS settings.";
      toast.error(errorMsg);
    }
  }

  async function handleDisconnect() {
    if (!confirm("Are you sure you want to disconnect this domain?")) return;

    setDisconnecting(true);
    const result = await removeDomainAction(guestbookId);
    setDisconnecting(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Domain disconnected");
    router.refresh();
  }

  async function copyToClipboard(text: string) {
    await navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  }

  return (
    <div className="w-full rounded-input border border-border bg-bg-page shadow-card">
      <div className="px-[12px] pt-[10px] pb-[8px]">
        <span className="text-body font-medium text-text-primary block">
          Custom Domain
        </span>
        <span className="text-body-sm text-text-secondary block mt-[2px]">
          Connect your own domain to your wall of love.
        </span>
      </div>
      <div className="rounded-t-input rounded-b-input border-t border-border bg-bg-card px-[12px] py-[12px] flex flex-col gap-[12px]">
        {/* Domain + status */}
        <div className="flex items-center gap-[8px]">
          <span className="flex items-center gap-[6px]">
            <span
              className={`w-[8px] h-[8px] rounded-full ${
                isVerified ? "bg-approve" : "bg-[#EAB308]"
              }`}
            />
            <span className="text-body font-semibold text-text-primary">
              {domain}
            </span>
          </span>
          <span className="text-body-sm text-text-placeholder">
            {isVerified ? "Connected" : "DNS Pending"}
          </span>
        </div>

        {/* Separator */}
        <div className="border-t border-border" />

        {/* Instructions */}
        {!isVerified && (
          <p className="text-body-sm text-text-secondary">
            Add the following DNS record at your domain provider (Namecheap, GoDaddy, Cloudflare, etc.).
          </p>
        )}

        {/* DNS Records */}
        <DnsTable records={dnsRecords} onCopy={copyToClipboard} />

        {/* Actions */}
        <div className="flex items-center gap-[8px]">
          {!isVerified && (
            <Button
              size="small"
              onClick={handleCheckDns}
              disabled={checking}
            >
              {checking ? "Checking..." : "Check DNS"}
            </Button>
          )}
          <Button
            size="small"
            variant="secondary"
            onClick={handleDisconnect}
            disabled={disconnecting}
          >
            {disconnecting ? "Disconnecting..." : "Disconnect"}
          </Button>
        </div>
      </div>
    </div>
  );
}
