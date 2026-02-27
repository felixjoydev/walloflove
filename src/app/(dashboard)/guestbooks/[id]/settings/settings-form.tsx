"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useGuestbookContext } from "@/components/providers/guestbook-provider";
import type { GuestbookSettings } from "@shared/types";
import { saveSettingsAction, renameGuestbookAction } from "./actions";
import { getDomainStatusAction } from "./domain-actions";
import { deleteGuestbookAction } from "@/components/guestbook/delete-guestbook-action";
import { SettingsTextField, SettingsRadioField } from "@/components/ui/settings-field";
import { Button } from "@/components/ui/button";
import { BillingCard } from "@/components/billing/billing-card";
import { ConnectDomainModal } from "@/components/domain/connect-domain-modal";
import { DomainStatusCard } from "@/components/domain/domain-status-card";
import type { DnsRecord } from "@shared/types";

type SettingsTab = "general" | "domain" | "billing";

export function SettingsForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const guestbook = useGuestbookContext();

  const initialTab = searchParams.get("tab");
  const [tab, setTab] = useState<SettingsTab>(
    initialTab === "domain" || initialTab === "billing" ? initialTab : "general"
  );
  const [name, setName] = useState(guestbook.name);
  const [settings, setSettings] = useState<Required<GuestbookSettings>>(guestbook.settings);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDomainModal, setShowDomainModal] = useState(false);
  const [domainDnsRecords, setDomainDnsRecords] = useState<DnsRecord[]>([]);

  const savedName = useRef(guestbook.name);
  const savedSettings = useRef(guestbook.settings);

  // Load DNS records when domain tab is active and a domain is connected
  useEffect(() => {
    if (tab === "domain" && guestbook.customDomain) {
      getDomainStatusAction(guestbook.id).then((result) => {
        if (!result.error && result.dnsRecords) {
          setDomainDnsRecords(result.dnsRecords);
        }
      });
    }
  }, [tab, guestbook.customDomain, guestbook.id]);

  const hasChanges =
    name !== savedName.current ||
    JSON.stringify(settings) !== JSON.stringify(savedSettings.current);

  function update<K extends keyof GuestbookSettings>(key: K, value: GuestbookSettings[K]) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);

    if (name.trim() && name.trim() !== savedName.current) {
      const nameResult = await renameGuestbookAction(guestbook.id, name.trim());
      if (nameResult.error) {
        toast.error(nameResult.error);
        setSaving(false);
        return;
      }
      savedName.current = name.trim();
    }

    const result = await saveSettingsAction(guestbook.id, {
      moderation_mode: settings.moderation_mode,
    });

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Settings saved");
      savedSettings.current = { ...settings };
    }

    setSaving(false);
    router.refresh();
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this guestbook? This action cannot be undone.")) return;
    setDeleting(true);
    const result = await deleteGuestbookAction(guestbook.id);
    if (result.error) {
      toast.error(result.error);
      setDeleting(false);
      return;
    }
    toast.success("Guestbook deleted");
    window.location.href = result.redirectTo ?? "/guestbooks";
  }

  const tabs: { label: string; value: SettingsTab }[] = [
    { label: "General", value: "general" },
    { label: "Domain", value: "domain" },
    { label: "Billing", value: "billing" },
  ];

  return (
    <div className={`flex-1 flex flex-col ${hasChanges ? "-mb-8" : ""}`}>
      {/* Tabs */}
      <div className="flex gap-[4px] border-b border-border">
        {tabs.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`border-b-2 px-[16px] py-[10px] text-body font-medium transition-colors cursor-pointer ${
              tab === t.value
                ? "border-text-primary text-text-primary"
                : "border-transparent text-text-placeholder hover:text-text-secondary"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="mt-[24px] space-y-[16px]">
        {tab === "general" && (
          <>
            <SettingsTextField
              label="Guestbook name"
              value={name}
              onChange={setName}
            />

            <SettingsRadioField
              label="Moderation mode"
              description="Choose how new entries appear on your wall. Manual requires your approval before entries go live. Auto Approve publishes them instantly."
              value={settings.moderation_mode}
              onChange={(v) => update("moderation_mode", v as "auto_approve" | "manual_approve")}
              options={[
                { label: "Manual", value: "manual_approve" },
                { label: "Auto Approve", value: "auto_approve" },
              ]}
            />

            {/* Delete Guestbook */}
            <div className="w-full rounded-input border border-border bg-bg-page shadow-card">
              <div className="px-[12px] pt-[10px] pb-[8px]">
                <span className="text-body font-medium text-text-primary block">
                  Delete Guestbook
                </span>
                <span className="text-body-sm text-text-secondary block mt-[2px]">
                  Permanently delete this guestbook and all its entries.
                </span>
              </div>
              <div className="rounded-t-input rounded-b-input border-t border-border bg-bg-card px-[10px] py-[10px]">
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex items-center justify-center h-[36px] px-[16px] text-body-sm font-semibold rounded-icon bg-reject text-white hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
                >
                  {deleting ? "Deleting..." : "Delete guestbook"}
                </button>
              </div>
            </div>
          </>
        )}

        {tab === "domain" && (
          <>
            {guestbook.customDomain ? (
              <DomainStatusCard
                guestbookId={guestbook.id}
                domain={guestbook.customDomain}
                verified={guestbook.domainVerified}
                dnsRecords={domainDnsRecords}
              />
            ) : (
              <div className="w-full rounded-input border border-border bg-bg-page shadow-card">
                <div className="px-[12px] pt-[10px] pb-[8px]">
                  <span className="text-body font-medium text-text-primary block">
                    Custom Domain
                  </span>
                  <span className="text-body-sm text-text-secondary block mt-[2px]">
                    Serve your wall of love from your own domain.
                  </span>
                </div>
                <div className="rounded-t-input rounded-b-input border-t border-border bg-bg-card px-[10px] py-[16px] flex flex-col gap-[12px]">
                  <div className="flex flex-col gap-[4px] px-[4px]">
                    <span className="text-body-sm text-text-secondary">Example:</span>
                    <span className="text-body-sm font-medium text-text-primary">love.yourdomain.com</span>
                  </div>
                  <Button size="small" variant="primary" onClick={() => setShowDomainModal(true)}>
                    Set up your custom domain
                  </Button>
                </div>
              </div>
            )}

            {showDomainModal && (
              <ConnectDomainModal
                guestbookId={guestbook.id}
                onClose={() => setShowDomainModal(false)}
                onConnected={() => {
                  setShowDomainModal(false);
                  router.refresh();
                }}
              />
            )}
          </>
        )}

        {/* Plan selection UI removed for free launch period.
            When ready to introduce paid plans, restore from git history
            or reference src/lib/stripe/config.ts and billing-actions.tsx. */}
        {tab === "billing" && (
          <div className="flex justify-center">
            <div className="w-full max-w-[620px]">
              <BillingCard />
            </div>
          </div>
        )}
      </div>

      {/* Spacer pushes save bar to bottom */}
      <div className="flex-1" />

      {/* Sticky save bar */}
      {hasChanges && (
        <div className="sticky bottom-0 z-50">
          <div
            className="h-[24px]"
            style={{ background: "linear-gradient(to top, var(--color-bg-page) 0%, transparent 100%)" }}
          />
          <div className="bg-bg-page pb-[16px] pt-[8px] flex justify-start">
            <Button size="small" onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
