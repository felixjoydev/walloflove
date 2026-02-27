"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ModalPunchHoles, getModalPunchHoleMask } from "@/components/ui/modal-punch-holes";
import { addDomainAction } from "@/app/(dashboard)/guestbooks/[id]/settings/domain-actions";
import { validateDomain } from "@/lib/domain/validate";
import type { DnsRecord } from "@shared/types";

export function ConnectDomainModal({
  guestbookId,
  onClose,
  onConnected,
}: {
  guestbookId: string;
  onClose: () => void;
  onConnected: () => void;
}) {
  const backdropRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState<1 | 2>(1);
  const [domain, setDomain] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [dnsRecords, setDnsRecords] = useState<DnsRecord[]>([]);
  const [connectedDomain, setConnectedDomain] = useState("");

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  function handleDomainChange(value: string) {
    const formatted = value.trim().toLowerCase();
    setDomain(formatted);
    if (!formatted) {
      setValidationError(null);
      return;
    }
    const result = validateDomain(formatted);
    setValidationError(result.valid ? null : (result.error ?? null));
  }

  async function handleNext() {
    const result = validateDomain(domain);
    if (!result.valid) {
      setValidationError(result.error ?? "Invalid domain");
      return;
    }

    setAdding(true);
    const response = await addDomainAction(guestbookId, domain);
    setAdding(false);

    if (response.error) {
      toast.error(response.error);
      return;
    }

    setConnectedDomain(result.hostname!);
    setDnsRecords(response.dnsRecords ?? []);
    setStep(2);
  }

  function handleOk() {
    onConnected();
    onClose();
  }

  async function copyToClipboard(text: string) {
    await navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  }

  const canProceed = domain.length > 0 && !validationError;

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-bg-page/70 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === backdropRef.current) onClose();
      }}
    >
      <div className="relative w-full max-w-[480px] rounded-card shadow-card">
        <Card style={getModalPunchHoleMask()}>
          <div className="h-[48px]" />
          {step === 1 ? (
          <>
            <div className="p-[24px] flex flex-col gap-[16px]">
              <div className="flex flex-col gap-[4px]">
                <h2 className="text-subheading font-semibold text-text-primary">
                  Connect Domain
                </h2>
                <p className="text-body-sm text-text-secondary">
                  Enter the domain you&apos;d like to connect to your wall of love.
                </p>
              </div>

              {/* Domain input */}
              <div className="w-full rounded-input border border-border bg-bg-page shadow-card">
                <div className="flex items-center justify-between px-[12px] pt-[10px] pb-[8px]">
                  <span className="text-body font-medium text-text-primary">
                    Domain
                  </span>
                  {validationError && domain.length > 0 && (
                    <span className="text-[11px] font-medium text-reject">
                      {validationError}
                    </span>
                  )}
                </div>
                <div className="rounded-t-input rounded-b-input border-t border-border bg-bg-card h-[44px] flex items-center px-[10px]">
                  <input
                    type="text"
                    value={domain}
                    onChange={(e) => handleDomainChange(e.target.value)}
                    placeholder="love.yourdomain.com"
                    className="w-full bg-transparent text-body font-medium text-text-primary placeholder:text-text-placeholder outline-none"
                    autoFocus
                  />
                </div>
              </div>

              <p className="text-[11px] text-text-placeholder leading-relaxed px-[2px]">
                Use a subdomain like love.yourdomain.com or an apex domain like yourdomain.com. For path-based routing (e.g. yourdomain.com/love), set up a reverse proxy on your hosting provider pointing to your wall URL.
              </p>
            </div>

            <div className="px-[24px] pb-[24px] flex gap-[12px]">
              <Button
                type="button"
                variant="secondary"
                size="small"
                className="flex-1"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="small"
                className="flex-1"
                onClick={handleNext}
                disabled={!canProceed || adding}
              >
                {adding ? "Adding..." : "Next"}
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="p-[24px] flex flex-col gap-[16px]">
              <div className="flex flex-col gap-[4px]">
                <h2 className="text-subheading font-semibold text-text-primary">
                  Configure DNS
                </h2>
                <p className="text-body-sm text-text-secondary">
                  Go to your domain provider (Namecheap, GoDaddy, Cloudflare, etc.) and add the following DNS records for{" "}
                  <strong className="text-text-primary">{connectedDomain}</strong>.
                </p>
              </div>

              {/* DNS Records Table */}
              <DnsTable records={dnsRecords} onCopy={copyToClipboard} />

              <p className="text-[11px] text-text-placeholder leading-relaxed px-[2px]">
                DNS changes can take anywhere from a few minutes to 48 hours. You can check the status anytime from your settings.
              </p>
            </div>

            <div className="px-[24px] pb-[24px] flex justify-end">
              <Button type="button" size="small" onClick={handleOk}>
                OK
              </Button>
            </div>
          </>
          )}
        </Card>
        <ModalPunchHoles />
      </div>
    </div>
  );
}

export function DnsTable({
  records,
  onCopy,
}: {
  records: DnsRecord[];
  onCopy: (text: string) => void;
}) {
  return (
    <div className="w-full rounded-input border border-border bg-bg-page shadow-card overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-[64px_1fr_1fr_32px] gap-[8px] px-[12px] py-[8px] border-b border-border">
        <span className="text-[11px] font-medium text-text-placeholder">Type</span>
        <span className="text-[11px] font-medium text-text-placeholder">Name</span>
        <span className="text-[11px] font-medium text-text-placeholder">Value</span>
        <span />
      </div>
      {/* Rows */}
      {records.map((record, i) => (
        <div
          key={i}
          className={`grid grid-cols-[64px_1fr_1fr_32px] gap-[8px] items-center px-[12px] py-[10px] bg-bg-card ${
            i < records.length - 1 ? "border-b border-border" : ""
          }`}
        >
          <span className="text-body-sm font-medium text-text-primary">
            {record.type}
          </span>
          <span className="text-body-sm text-text-primary truncate flex items-center gap-[4px]">
            {record.name}
            <CopyButton onClick={() => onCopy(record.name)} />
          </span>
          <span className="text-body-sm text-text-primary truncate flex items-center gap-[4px]">
            <span className="truncate">{record.value}</span>
            <CopyButton onClick={() => onCopy(record.value)} />
          </span>
          <span />
        </div>
      ))}
    </div>
  );
}

function CopyButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="shrink-0 w-[20px] h-[20px] flex items-center justify-center text-text-placeholder hover:text-text-primary transition-colors cursor-pointer"
      title="Copy"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
      </svg>
    </button>
  );
}
