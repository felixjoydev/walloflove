"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ModalPunchHoles, getModalPunchHoleMask } from "@/components/ui/modal-punch-holes";
import {
  SettingsTextField,
  SettingsTextareaField,
  SettingsUploadField,
} from "@/components/ui/settings-field";
import {
  updateSlugAction,
  checkSlugAvailableAction,
  saveSettingsAction,
} from "@/app/(dashboard)/guestbooks/[id]/settings/actions";
import {
  uploadOgImageAction,
  uploadFaviconAction,
} from "@/app/(dashboard)/guestbooks/[id]/theme/actions";
import { ConnectDomainModal } from "@/components/domain/connect-domain-modal";
import type { GuestbookSettings } from "@shared/types";

const SLUG_REGEX = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;

export function PublishSettingsModal({
  guestbookId,
  guestbookName,
  currentSlug,
  settings,
  customDomain,
  domainVerified,
  onClose,
}: {
  guestbookId: string;
  guestbookName: string;
  currentSlug: string;
  settings: Required<GuestbookSettings>;
  customDomain: string | null;
  domainVerified: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const backdropRef = useRef<HTMLDivElement>(null);

  // Slug state
  const [slug, setSlug] = useState(currentSlug);
  const [checking, setChecking] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [formatError, setFormatError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // SEO state
  const [seoTitle, setSeoTitle] = useState(settings.seo_title || `${guestbookName} | Guestbook`);
  const [seoDescription, setSeoDescription] = useState(settings.seo_description);
  const [ogImageUrl, setOgImageUrl] = useState<string | null>(settings.og_image_url);
  const [faviconUrl, setFaviconUrl] = useState<string | null>(settings.favicon_url);

  const [saving, setSaving] = useState(false);
  const [showDomainModal, setShowDomainModal] = useState(false);

  const slugUnchanged = slug === currentSlug;

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  function handleSlugChange(value: string) {
    const formatted = value
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-{2,}/g, "-");
    setSlug(formatted);
    setAvailable(null);

    if (formatted.length > 0 && formatted.length < 3) {
      setFormatError("Must be at least 3 characters");
      return;
    }
    if (formatted.length > 64) {
      setFormatError("Must be 64 characters or less");
      return;
    }
    if (formatted.length >= 3 && !SLUG_REGEX.test(formatted)) {
      setFormatError("Must start and end with a letter or number");
      return;
    }
    setFormatError(null);

    if (formatted === currentSlug || formatted.length < 3) return;
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setChecking(true);
      const result = await checkSlugAvailableAction(formatted, guestbookId);
      setAvailable(result.available);
      setChecking(false);
    }, 400);
  }

  const initialSeoTitle = settings.seo_title || `${guestbookName} | Guestbook`;
  const seoChanged =
    seoTitle !== initialSeoTitle ||
    seoDescription !== settings.seo_description ||
    ogImageUrl !== settings.og_image_url ||
    faviconUrl !== settings.favicon_url;

  const canSave =
    (!slugUnchanged && !formatError && available !== false && slug.length >= 3 && !checking) ||
    seoChanged;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    // Save slug if changed
    if (!slugUnchanged && !formatError && available !== false && slug.length >= 3) {
      const slugResult = await updateSlugAction(guestbookId, slug);
      if (slugResult.error) {
        toast.error(slugResult.error);
        setSaving(false);
        return;
      }
    }

    // Save SEO settings if changed
    if (seoChanged) {
      const seoResult = await saveSettingsAction(guestbookId, {
        seo_title: seoTitle,
        seo_description: seoDescription,
        og_image_url: ogImageUrl,
        favicon_url: faviconUrl,
      });
      if (seoResult.error) {
        toast.error(seoResult.error);
        setSaving(false);
        return;
      }
    }

    toast.success("Settings saved");
    onClose();
    router.refresh();
  }

  // Slug availability badge
  const slugBadge = (() => {
    if (formatError) return <span className="text-[11px] font-medium text-reject">{formatError}</span>;
    if (checking) return <span className="text-[11px] font-medium text-text-placeholder">Checking...</span>;
    if (available === true && !slugUnchanged) return <span className="text-[11px] font-medium text-approve">Available</span>;
    if (available === false) return <span className="text-[11px] font-medium text-reject">Taken</span>;
    return null;
  })();

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-bg-page/70 backdrop-blur-sm"
      onMouseDown={(e) => { if (e.target === backdropRef.current) onClose(); }}
    >
      <div className="relative w-full max-w-[480px] rounded-card shadow-card">
        <Card className="max-h-[90vh] overflow-hidden flex flex-col" style={getModalPunchHoleMask()}>
          <div className="h-[48px] shrink-0" />
          <form
            onSubmit={handleSave}
            className="flex flex-col flex-1 overflow-y-auto"
            style={{ scrollbarWidth: "none" }}
          >
            {/* Content */}
            <div className="px-[24px] pb-[24px] flex flex-col gap-[16px]">
            {/* Header */}
            <div className="flex flex-col gap-[4px]">
              <h2 className="text-subheading font-semibold text-text-primary">
                Publish Settings
              </h2>
              <p className="text-body-sm text-text-secondary">
                Configure your wall URL, domain, and SEO.
              </p>
            </div>

            {/* Section 1 — URL Slug (custom layout for inline badge) */}
            <div className="w-full rounded-input border border-border bg-bg-page shadow-card">
              <div className="flex items-center justify-between px-[12px] pt-[10px] pb-[8px]">
                <span className="text-body font-medium text-text-primary">
                  URL Slug
                </span>
                {slugBadge}
              </div>
              <div className="rounded-t-input rounded-b-input border-t border-border bg-bg-card h-[44px] flex items-center px-[10px]">
                <span className="text-body font-medium text-text-placeholder shrink-0 select-none">
                  guestbook.sh/
                </span>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  placeholder="your-slug"
                  className="w-full bg-transparent text-body font-medium text-text-primary placeholder:text-text-placeholder outline-none"
                />
              </div>
            </div>

            {/* Section 2 — Custom Domain */}
            <div className="w-full rounded-input border border-border bg-bg-page shadow-card">
              <span className="text-body font-medium text-text-primary block px-[12px] pt-[10px] pb-[8px]">
                Custom Domain
              </span>
              <span className="text-body-sm text-text-secondary block px-[12px] pb-[8px] -mt-[4px]">
                Serve your wall from your own domain
              </span>
              <div className="rounded-t-input rounded-b-input border-t border-border bg-bg-card px-[12px] py-[16px] flex items-center justify-between">
                {customDomain ? (
                  <>
                    <span className="flex items-center gap-[6px]">
                      <span
                        className={`w-[8px] h-[8px] rounded-full ${
                          domainVerified ? "bg-approve" : "bg-[#EAB308]"
                        }`}
                      />
                      <span className="text-body font-medium text-text-primary">
                        {customDomain}
                      </span>
                      <span className="text-body-sm text-text-placeholder">
                        {domainVerified ? "Connected" : "DNS Pending"}
                      </span>
                    </span>
                    <a
                      href={`/guestbooks/${guestbookId}/settings?tab=domain`}
                      className="text-body-sm font-medium text-accent hover:text-accent-hover transition-colors"
                    >
                      Manage
                    </a>
                  </>
                ) : (
                  <>
                    <span className="text-body text-text-placeholder">
                      love.yourdomain.com
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowDomainModal(true)}
                      className="text-body-sm font-medium text-accent hover:text-accent-hover transition-colors cursor-pointer"
                    >
                      Set up
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Section 3 — SEO */}
            <div className="flex flex-col gap-[16px] mt-[8px]">
              <div className="px-[2px]">
                <span className="text-body font-semibold text-text-primary block">
                  SEO
                </span>
                <span className="text-body-sm text-text-secondary block mt-[2px]">
                  Control how your wall appears in search engines and social shares.
                </span>
              </div>
              <SettingsTextField
                label="SEO Title"
                value={seoTitle}
                onChange={setSeoTitle}
                placeholder="SEO title"
              />
              <SettingsTextareaField
                label="SEO Description"
                value={seoDescription}
                onChange={setSeoDescription}
                rows={2}
                placeholder="See what people are saying about us"
              />
              <SettingsUploadField
                label="Favicon"
                value={faviconUrl}
                onChange={async (file) => {
                  const blobUrl = URL.createObjectURL(file);
                  setFaviconUrl(blobUrl);
                  const fd = new FormData();
                  fd.append("file", file);
                  const result = await uploadFaviconAction(guestbookId, fd);
                  if (result.error) {
                    toast.error(result.error);
                    setFaviconUrl(settings.favicon_url);
                  } else if (result.url) {
                    setFaviconUrl(result.url);
                  }
                  URL.revokeObjectURL(blobUrl);
                }}
                onRemove={() => setFaviconUrl(null)}
              />
              <SettingsUploadField
                label="OG Image"
                hint="1200 x 630px"
                value={ogImageUrl}
                onChange={async (file) => {
                  const blobUrl = URL.createObjectURL(file);
                  setOgImageUrl(blobUrl);
                  const fd = new FormData();
                  fd.append("file", file);
                  const result = await uploadOgImageAction(guestbookId, fd);
                  if (result.error) {
                    toast.error(result.error);
                    setOgImageUrl(settings.og_image_url);
                  } else if (result.url) {
                    setOgImageUrl(result.url);
                  }
                  URL.revokeObjectURL(blobUrl);
                }}
                onRemove={() => setOgImageUrl(null)}
              />
            </div>
          </div>

          {/* Sticky save bar — inside scroll container so gradient overlays content */}
          <div className="sticky bottom-0 z-10">
            <div
              className="h-[24px]"
              style={{ background: "linear-gradient(to top, var(--color-bg-card) 0%, transparent 100%)" }}
            />
            <div className="bg-bg-card px-[24px] pb-[24px] pt-[8px] flex gap-[12px]">
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
                type="submit"
                size="small"
                className="flex-1"
                disabled={saving || !canSave}
              >
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
          </form>
        </Card>
        <ModalPunchHoles />
      </div>

      {showDomainModal && (
        <ConnectDomainModal
          guestbookId={guestbookId}
          onClose={() => {
            setShowDomainModal(false);
          }}
          onConnected={() => {
            setShowDomainModal(false);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
