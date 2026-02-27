"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useGuestbookContext } from "@/components/providers/guestbook-provider";
import type { GuestbookSettings } from "@shared/types";
import { saveThemeAction, publishAction, uploadLogoAction } from "@/app/(dashboard)/guestbooks/[id]/theme/actions";
import {
  SettingsTextField,
  SettingsColorField,
  SettingsSelectField,
  SettingsTextareaField,
  SettingsUploadField,
  SettingsSliderField,
} from "@/components/ui/settings-field";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DrawingCanvas } from "@/components/canvas/drawing-canvas";
import { getDotColor } from "@/lib/utils/color";
import { EmbedModal } from "./embed-modal";
import { PublishSettingsModal } from "./publish-settings-modal";

function toSlug(name: string): string {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

type PreviewTab = "wall" | "widget" | "collection";

type Font = NonNullable<GuestbookSettings["font"]>;

const FONT_OPTIONS: { label: string; value: string }[] = [
  { label: "System", value: "sans" },
  { label: "Handwriting", value: "handwriting" },
  { label: "Monospace", value: "mono" },
];

interface Entry {
  id: string;
  name: string;
  message: string | null;
  link: string | null;
  stroke_data: unknown;
  created_at: string;
}

interface PreviewEntry extends Entry {
  signatureImg: string;
}

const PREVIEW_ENTRIES: PreviewEntry[] = [
  { id: "s1", name: "Ronald", message: "You guys are awesome", link: null, stroke_data: null, created_at: "2026-02-16T00:00:00Z", signatureImg: "/signature-1.svg" },
  { id: "s2", name: "Sarah", message: "Love this product!", link: null, stroke_data: { note_color: "#D4C6FF" }, created_at: "2026-02-15T00:00:00Z", signatureImg: "/signature-2.svg" },
  { id: "s3", name: "Alex", message: "Super cool", link: null, stroke_data: { note_color: "#C6F0FF" }, created_at: "2026-02-14T00:00:00Z", signatureImg: "/signature-3.svg" },
  { id: "s4", name: "Jordan", message: "Really impressive", link: null, stroke_data: null, created_at: "2026-02-13T00:00:00Z", signatureImg: "/signature-4.svg" },
];

export function PreviewEditor({
  guestbookId,
  entries,
}: {
  guestbookId: string;
  entries: Entry[];
}) {
  const router = useRouter();
  const guestbook = useGuestbookContext();
  const [settings, setSettings] = useState<Required<GuestbookSettings>>(guestbook.settings);
  const lastSavedRef = useRef<Required<GuestbookSettings>>(guestbook.settings);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [tab, setTab] = useState<PreviewTab>("wall");
  const [showEmbed, setShowEmbed] = useState(false);
  const [showPublishSettings, setShowPublishSettings] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [hoveredField, setHoveredField] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.signboard.app";
  const isPublished = !!guestbook.slug;
  const previewSlug = guestbook.slug ?? (toSlug(guestbook.name) || "your-guestbook");
  const wallUrl = `${appUrl}/wall/${previewSlug}`;
  const collectUrl = `${appUrl}/collect/${previewSlug}`;

  const currentUrl = tab === "collection" ? collectUrl : wallUrl;

  const hasUnpublishedChanges = JSON.stringify(settings) !== JSON.stringify(guestbook.publishedSettings);

  function update<K extends keyof GuestbookSettings>(key: K, value: GuestbookSettings[K]) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  // Auto-save: debounce 800ms after every settings change
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      if (JSON.stringify(settings) === JSON.stringify(lastSavedRef.current)) return;
      try {
        const result = await saveThemeAction(guestbookId, settings);
        if (result.error) {
          toast.error(result.error);
        } else {
          lastSavedRef.current = settings;
          guestbook.updateSettings(settings);
        }
      } catch {
        toast.error("Failed to save");
      }
    }, 800);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [settings, guestbookId]);

  async function handlePublish() {
    if (isPublished && !hasUnpublishedChanges) return;
    setPublishing(true);

    // Cancel pending debounce and flush-save if needed
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    if (JSON.stringify(settings) !== JSON.stringify(lastSavedRef.current)) {
      const saveResult = await saveThemeAction(guestbookId, settings);
      if (saveResult.error) {
        toast.error(saveResult.error);
        setPublishing(false);
        return;
      }
      lastSavedRef.current = settings;
      guestbook.updateSettings(settings);
    }

    const result = await publishAction(guestbookId);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Published!");
      guestbook.markPublished();
      if (!isPublished) {
        router.refresh();
      }
    }
    setPublishing(false);
  }

  async function copyUrl() {
    await navigator.clipboard.writeText(currentUrl);
    toast.success("URL copied!");
  }

  function openExternal() {
    window.open(currentUrl, "_blank", "noopener,noreferrer");
  }

  const fontFamily =
    settings.font === "handwriting"
      ? '"Caveat", cursive'
      : settings.font === "mono"
        ? "monospace"
        : "system-ui, sans-serif";

  const tabs: { label: string; value: PreviewTab; disabled?: boolean }[] = [
    { label: "Wall of love", value: "wall" },
    { label: "Collection Link", value: "collection" },
    { label: "Widget", value: "widget", disabled: true },
  ];

  /* ─── Hover-highlight mapping: editor field → preview zones ─── */
  const FIELD_ZONES: Record<string, string[]> = {
    style: [],
    logo: ["logo", "link-card"],
    font: [],
    "website-text": ["website-text", "link-card"],
    "website-link": ["logo", "website-text", "link-icon", "link-card"],
    title: ["title"],
    description: ["description"],
    "button-text": ["cta", "cta-text"],
    "button-radius": ["cta"],
    "button-color": ["cta", "cta-frame"],
    "button-text-color": ["cta", "cta-text"],
    background: ["bg"],
    "title-color": ["title", "description"],
    "card-bg": ["cards", "card-frame"],
    "card-text": ["cards", "card-text-only"],
    "card-border": ["cards", "card-border"],
  };

  const activeZones = hoveredField && hoveredField !== editingField ? (FIELD_ZONES[hoveredField] ?? null) : null;
  // null or [] means no dimming
  const hasActiveHighlight = activeZones !== null && activeZones.length > 0;

  function hlWrap(field: string, hoverOnly = false) {
    const base = {
      onMouseEnter: () => setHoveredField(field),
      onMouseLeave: () => setHoveredField(null),
    };
    if (hoverOnly) return base;
    return {
      ...base,
      onFocusCapture: () => setEditingField(field),
      onBlurCapture: () => setEditingField(null),
    };
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Tabs */}
      <div className="flex gap-[4px] border-b border-border">
        {tabs.map((t) => (
          <button
            key={t.value}
            onClick={() => !t.disabled && setTab(t.value)}
            disabled={t.disabled}
            className={`border-b-2 px-[16px] py-[10px] text-body font-medium transition-colors flex items-center gap-[6px] ${
              t.disabled
                ? "border-transparent text-text-placeholder cursor-default opacity-50"
                : tab === t.value
                  ? "border-text-primary text-text-primary cursor-pointer"
                  : "border-transparent text-text-placeholder hover:text-text-secondary cursor-pointer"
            }`}
          >
            {t.label}
            {t.disabled && (
              <span className="text-[10px] font-medium bg-bg-subtle text-text-placeholder rounded-full px-[6px] py-[1px]">
                Soon
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Header bar — URL + Publish (sticky so it stays visible when scrolling) */}
      <div className="mt-[16px] flex items-center justify-between sticky top-0 z-40 bg-bg-page py-[8px]">
          <div className="flex items-center gap-[24px] min-w-0">
            <div className="flex items-center gap-[8px] min-w-0">
              <GlobeIcon />
              <span
                className={`text-body font-medium truncate ${isPublished ? "text-text-primary" : "text-text-placeholder"}`}
                title={currentUrl}
              >
                {currentUrl.length > 40 ? currentUrl.slice(0, 40) + "..." : currentUrl}
              </span>
            </div>
            <div className="flex items-center gap-[12px] shrink-0">
              <button
                onClick={() => setShowPublishSettings(true)}
                className="flex h-[24px] w-[24px] items-center justify-center text-icon-inactive hover:text-icon-active transition-colors cursor-pointer"
                title="Publish settings"
              >
                <SettingsIcon />
              </button>
              <button
                onClick={copyUrl}
                disabled={!isPublished}
                className="flex h-[24px] w-[24px] items-center justify-center text-icon-inactive hover:text-icon-active transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-default"
                title={isPublished ? "Copy URL" : "Publish first to copy URL"}
              >
                <CopyIcon />
              </button>
              <button
                onClick={openExternal}
                disabled={!isPublished}
                className="flex h-[24px] w-[24px] items-center justify-center text-icon-inactive hover:text-icon-active transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-default"
                title={isPublished ? "Open in new tab" : "Publish first to open"}
              >
                <ExternalLinkIcon />
              </button>
            </div>
          </div>
          <Button
            size="small"
            onClick={handlePublish}
            disabled={publishing || (isPublished && !hasUnpublishedChanges)}
            className="shrink-0"
          >
            {publishing
              ? "Publishing..."
              : !isPublished
                ? "Publish"
                : hasUnpublishedChanges
                  ? "Publish"
                  : "Published"}
          </Button>
      </div>

      {/* Controls + Preview */}
      <div className="mt-[24px] flex gap-[16px] lg:flex-row flex-col">
        {/* Left panel — controls (40%) */}
        <div className="w-full lg:w-[40%] shrink-0">
          {/* Style — notebook vs sticky notes */}
          <div {...hlWrap("style")} className="mb-[16px]">
            <label className="block text-body-sm font-medium text-text-secondary mb-[8px]">Style</label>
            <div className="flex gap-[10px]">
              {/* Notebook option */}
              <button
                type="button"
                onClick={() => update("wall_style", "notebook")}
                className="flex-1 flex flex-col items-center gap-[8px] rounded-card p-[12px] border cursor-pointer transition-all"
                style={{
                  borderColor: settings.wall_style === "notebook" ? "var(--color-accent)" : "var(--color-border)",
                  boxShadow: settings.wall_style === "notebook" ? "0 0 0 1px var(--color-accent)" : "none",
                  backgroundColor: "var(--color-bg-card)",
                }}
              >
                {/* Mini notebook card */}
                <div
                  className="w-[40px] h-[40px] relative overflow-hidden"
                  style={{
                    borderRadius: "6px",
                    backgroundColor: "#ffffff",
                    border: "1px solid var(--color-border)",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                  }}
                >
                  <div className="absolute left-[3px] top-[4px] bottom-[4px] flex flex-col items-center justify-between pointer-events-none">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div
                        key={i}
                        className="w-[4px] h-[4px] rounded-full"
                        style={{
                          backgroundColor: "#EAEAEA",
                          boxShadow: "0 0.5px 1px 0 rgba(0,0,0,0.1) inset",
                        }}
                      />
                    ))}
                  </div>
                  {/* Mini signature */}
                  <div className="absolute left-[10px] right-[4px] top-[6px] bottom-[6px] flex items-center justify-center">
                    <svg className="w-full h-full" viewBox="0 0 42 63" fill="none">
                      <path d="M1 31.3618C2.76123 28.6672 5.38716 20.4247 4.94959 8.6698C4.80134 4.68741 3.90876 2.17915 3.4144 1.65592C-1.72304 -3.78153 6.0098 25.5164 7.15353 55.1465C7.35921 60.4748 6.83547 61.6437 6.20364 61.9306C5.57181 62.2174 4.60156 61.5907 3.80265 60.5009C2.04412 58.1019 1.9624 54.5844 2.6827 50.9848C4.28251 42.9898 9.48864 39.4278 13.4417 36.9359C17.3352 34.4814 23.0119 35.1459 28.0535 34.1892C32.5082 33.3438 34.7166 27.955 38.3961 24.5107C39.2415 23.4891 39.8855 22.1986 40.2917 22.2232C40.6978 22.2478 40.8467 23.6266 41 25.0471" stroke="#E0E0E0" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </div>
                </div>
                <span className="text-[11px] font-medium text-text-secondary">Notebook</span>
              </button>

              {/* Sticky Notes option */}
              <button
                type="button"
                onClick={() => update("wall_style", "sticky")}
                className="flex-1 flex flex-col items-center gap-[8px] rounded-card p-[12px] border cursor-pointer transition-all"
                style={{
                  borderColor: settings.wall_style === "sticky" ? "var(--color-accent)" : "var(--color-border)",
                  boxShadow: settings.wall_style === "sticky" ? "0 0 0 1px var(--color-accent)" : "none",
                  backgroundColor: "var(--color-bg-card)",
                }}
              >
                {/* Mini sticky note */}
                <div
                  className="w-[40px] h-[40px] relative overflow-hidden"
                  style={{
                    borderRadius: "4px 4px 10px 4px",
                    backgroundColor: "#FFF9C6",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
                  }}
                >
                  {/* Mini signature */}
                  <div className="absolute left-[6px] right-[6px] top-[6px] bottom-[6px] flex items-center justify-center">
                    <svg className="w-full h-full" viewBox="0 0 42 63" fill="none">
                      <path d="M1 31.3618C2.76123 28.6672 5.38716 20.4247 4.94959 8.6698C4.80134 4.68741 3.90876 2.17915 3.4144 1.65592C-1.72304 -3.78153 6.0098 25.5164 7.15353 55.1465C7.35921 60.4748 6.83547 61.6437 6.20364 61.9306C5.57181 62.2174 4.60156 61.5907 3.80265 60.5009C2.04412 58.1019 1.9624 54.5844 2.6827 50.9848C4.28251 42.9898 9.48864 39.4278 13.4417 36.9359C17.3352 34.4814 23.0119 35.1459 28.0535 34.1892C32.5082 33.3438 34.7166 27.955 38.3961 24.5107C39.2415 23.4891 39.8855 22.1986 40.2917 22.2232C40.6978 22.2478 40.8467 23.6266 41 25.0471" stroke="#E6DBA0" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </div>
                  {/* Mini fold */}
                  <div
                    className="absolute bottom-0 right-0 pointer-events-none"
                    style={{
                      width: "9px",
                      height: "9px",
                      borderTopLeftRadius: "4px",
                      border: "0.5px solid transparent",
                      backgroundImage: "linear-gradient(132deg, #F5EFB0 79.5%, #E0D88A 85.97%), linear-gradient(135deg, transparent 0%, #E8E0A0 100%)",
                      backgroundOrigin: "padding-box, border-box",
                      backgroundClip: "padding-box, border-box",
                    }}
                  />
                </div>
                <span className="text-[11px] font-medium text-text-secondary">Sticky Notes</span>
              </button>
            </div>
          </div>

          {/* Font — common to all tabs, sits above sections */}
          <div {...hlWrap("font")} className="mb-[16px]">
            <SettingsSelectField
              label="Font"
              value={settings.font}
              onChange={(v) => update("font", v as Font)}
              options={FONT_OPTIONS}
            />
          </div>

          {/* ── Header section (wall + collection have logo) ── */}
          {tab !== "widget" && (
            <SectionHeader label="Header" first />
          )}
          <div className="space-y-[16px]">
            {tab !== "widget" && (
              <div {...hlWrap("logo", true)}>
                <SettingsUploadField
                  label="Logo"
                  onChange={async (file) => {
                    const blobUrl = URL.createObjectURL(file);
                    update("logo_url", blobUrl);

                    const fd = new FormData();
                    fd.append("file", file);
                    const result = await uploadLogoAction(guestbookId, fd);
                    if (result.error) {
                      toast.error(result.error);
                      update("logo_url", null);
                    } else if (result.url) {
                      update("logo_url", result.url);
                    }
                    URL.revokeObjectURL(blobUrl);
                  }}
                  onRemove={() => update("logo_url", null)}
                  value={settings.logo_url ?? undefined}
                />
              </div>
            )}
            {tab === "wall" && (
              <>
                <div {...hlWrap("website-text")}>
                  <SettingsTextField
                    label="Website Text"
                    value={settings.website_text}
                    onChange={(v) => update("website_text", v)}
                  />
                </div>
                <div {...hlWrap("website-link")}>
                  <SettingsTextField
                    label="Website Link"
                    value={settings.website_link}
                    onChange={(v) => update("website_link", v)}
                    placeholder="https://yourdomain.com"
                  />
                </div>
              </>
            )}
          </div>

          {/* ── Content section ── */}
          <SectionHeader label="Content" first={tab === "widget"} />
          <div className="space-y-[16px]">
            <div {...hlWrap("title")}>
              <SettingsTextField
                label="Title"
                value={tab === "wall" ? settings.wall_title : tab === "collection" ? settings.collection_title : settings.widget_title}
                onChange={(v) => {
                  if (tab === "wall") update("wall_title", v);
                  else if (tab === "collection") update("collection_title", v);
                  else update("widget_title", v);
                }}
              />
            </div>
            <div {...hlWrap("description")}>
              <SettingsTextareaField
                label="Description"
                value={tab === "wall" ? settings.wall_description : tab === "collection" ? settings.collection_description : settings.widget_description}
                onChange={(v) => {
                  if (tab === "wall") update("wall_description", v);
                  else if (tab === "collection") update("collection_description", v);
                  else update("widget_description", v);
                }}
                rows={2}
              />
            </div>
          </div>

          {/* ── Button section ── */}
          <SectionHeader label="Button" />
          <div className="space-y-[16px]">
            <div {...hlWrap("button-text")}>
              <SettingsTextField
                label="Button Text"
                value={settings.cta_text}
                onChange={(v) => update("cta_text", v)}
              />
            </div>
            <div {...hlWrap("button-radius")}>
              <SettingsSliderField
                label="Button radius"
                value={settings.button_border_radius}
                onChange={(v) => update("button_border_radius", v)}
                steps={[0, 4, 8, 12, 16, 24, 9999]}
              />
            </div>
            <div {...hlWrap("button-color")}>
              <SettingsColorField
                label="Button color"
                value={settings.brand_color}
                onChange={(c) => update("brand_color", c)}
              />
            </div>
            <div {...hlWrap("button-text-color")}>
              <SettingsColorField
                label="Button Text Color"
                value={settings.button_text_color}
                onChange={(c) => update("button_text_color", c)}
              />
            </div>
          </div>

          {/* ── Theme section (hidden for now — re-enable later) ──
          <SectionHeader label="Theme" />
          <div className="space-y-[16px]">
            <div {...hlWrap("background")}>
              <SettingsColorField
                label="Background color"
                value={settings.background_color}
                onChange={(c) => {
                  update("background_color", c);
                  if (tab === "widget" && settings.widget_transparent_bg) {
                    update("widget_transparent_bg", false);
                  }
                }}
                showStrike={tab === "widget" && settings.widget_transparent_bg}
                trailing={tab === "widget" ? (
                  <button
                    type="button"
                    onClick={() => update("widget_transparent_bg", !settings.widget_transparent_bg)}
                    className={`flex items-center gap-[6px] px-[8px] py-[4px] rounded-icon text-[11px] font-medium cursor-pointer transition-colors ${
                      settings.widget_transparent_bg
                        ? "bg-approve text-white"
                        : "bg-bg-subtle text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    Transparent
                  </button>
                ) : undefined}
              />
            </div>
            <div {...hlWrap("title-color")}>
              <SettingsColorField
                label="Title Color"
                value={settings.text_color}
                onChange={(c) => update("text_color", c)}
              />
            </div>
            {tab !== "collection" && (
              <>
                <div {...hlWrap("card-bg")}>
                  <SettingsColorField
                    label="Card background"
                    value={settings.card_background_color}
                    onChange={(c) => update("card_background_color", c)}
                    pickerPosition="top"
                  />
                </div>
                <div {...hlWrap("card-text")}>
                  <SettingsColorField
                    label="Card Text Color"
                    value={settings.card_text_color}
                    onChange={(c) => update("card_text_color", c)}
                    pickerPosition="top"
                  />
                </div>
                <div {...hlWrap("card-border")}>
                  <SettingsColorField
                    label="Card Border Color"
                    value={settings.card_border_color}
                    onChange={(c) => update("card_border_color", c)}
                    pickerPosition="top"
                  />
                </div>
              </>
            )}
          </div>
          */}
        </div>

        {/* Right panel — preview (60%), sticky so it follows scroll */}
        <div className="w-full lg:w-[60%] self-start sticky top-[64px]">
          <div
            className="rounded-card border border-border bg-bg-card shadow-card p-[20px] relative overflow-hidden min-h-[480px]"
            style={{
              backgroundColor: tab === "collection" ? "#FBFBFB" : settings.background_color,
              fontFamily,
            }}
          >
            {tab === "wall" && (
              <WallPreview settings={settings} entries={entries} fontFamily={fontFamily} wallUrl={wallUrl} highlightZones={hasActiveHighlight ? activeZones : null} />
            )}
            {/* Widget preview (commented out — widget tab disabled)
            {tab === "widget" && (
              <WidgetPreview settings={settings} entries={entries} fontFamily={fontFamily} highlightZones={hasActiveHighlight ? activeZones : null} />
            )} */}
            {tab === "collection" && (
              <CollectionPreview settings={settings} fontFamily={fontFamily} highlightZones={hasActiveHighlight ? activeZones : null} />
            )}
          </div>
        </div>
      </div>

      {showEmbed && (
        <EmbedModal
          guestbookId={guestbookId}
          onClose={() => setShowEmbed(false)}
          settings={settings}
          entries={entries}
          fontFamily={fontFamily}
        />
      )}

      {showPublishSettings && (
        <PublishSettingsModal
          guestbookId={guestbookId}
          guestbookName={guestbook.name}
          currentSlug={guestbook.slug ?? ""}
          settings={settings}
          customDomain={guestbook.customDomain}
          domainVerified={guestbook.domainVerified}
          onClose={() => setShowPublishSettings(false)}
        />
      )}

    </div>
  );
}

/* ─── Preview sub-components ─── */

function WallPreview({
  settings,
  entries,
  fontFamily,
  wallUrl,
  highlightZones,
}: {
  settings: Required<GuestbookSettings>;
  entries: Entry[];
  fontFamily: string;
  wallUrl: string;
  highlightZones: string[] | null;
}) {
  const [viewMode, setViewMode] = useState<"grid" | "canvas">("grid");
  const logoUrl = settings.logo_url ?? undefined;

  function zoneStyle(zone: string): React.CSSProperties {
    if (!highlightZones) return { transition: "opacity 0.2s ease" };
    const dimOpacity = highlightZones.includes("bg") ? 0 : 0.3;
    return {
      opacity: highlightZones.includes(zone) ? 1 : dimOpacity,
      transition: "opacity 0.2s ease",
    };
  }

  // Inner card zones only activate when the cards grid itself is highlighted,
  // otherwise the parent "cards" zone already handles dimming.
  function cardInnerStyle(zone: string): React.CSSProperties {
    if (!highlightZones || !highlightZones.includes("cards")) {
      return { transition: "opacity 0.2s ease" };
    }
    return zoneStyle(zone);
  }

  // CTA inner zone highlighting:
  // - Text highlighted (button-text / button-text-color): scale+pulse text, frame stays normal
  // - Frame highlighted (button-color): dim text, frame stays normal
  // - Neither inner zone active (button-radius): everything stays normal
  function ctaInnerStyle(zone: string): React.CSSProperties {
    if (!highlightZones || !highlightZones.includes("cta")) {
      return { transition: "opacity 0.2s ease, transform 0.2s ease" };
    }
    const highlighted = highlightZones.includes(zone);
    // Text zone highlighted → scale up + pulse
    if (highlighted && zone === "cta-text") {
      return {
        transform: "scale(1.08)",
        animation: "hl-pulse 1.2s ease-in-out infinite",
        transition: "transform 0.2s ease",
      };
    }
    // Non-highlighted zone when frame is active → dim (text dims for button-color)
    if (!highlighted && highlightZones.includes("cta-frame")) {
      return {
        opacity: 0.3,
        transition: "opacity 0.2s ease",
      };
    }
    return {
      transition: "opacity 0.2s ease, transform 0.2s ease",
    };
  }

  const sampleEntries = PREVIEW_ENTRIES;

  /* ── Canvas view state ── */
  const CELL_W = 100;
  const CELL_H = 70;
  const CELL_GAP = 12;
  const JITTER = 6;
  const canvasCols = 3;

  function simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }

  const canvasPositions = useMemo(() => {
    return sampleEntries.map((entry, index) => {
      const col = index % canvasCols;
      const row = Math.floor(index / canvasCols);
      const hash = simpleHash(entry.id);
      const jx = (hash % (JITTER * 2 + 1)) - JITTER;
      const jy = ((hash >> 8) % (JITTER * 2 + 1)) - JITTER;
      return {
        x: col * (CELL_W + CELL_GAP) + CELL_GAP + jx,
        y: row * (CELL_H + CELL_GAP) + CELL_GAP + jy,
      };
    });
  }, [sampleEntries]);

  const canvasW = canvasCols * (CELL_W + CELL_GAP) + CELL_GAP;
  const canvasRows = Math.ceil(sampleEntries.length / canvasCols);
  const canvasH = canvasRows * (CELL_H + CELL_GAP) + CELL_GAP;

  const [cvZoom, setCvZoom] = useState(1);
  const [cvOffset, setCvOffset] = useState({ x: 0, y: 0 });
  const [cvDragging, setCvDragging] = useState(false);
  const cvPanRef = useRef<{ active: boolean; sx: number; sy: number; ox: number; oy: number; moved: boolean } | null>(null);
  const cvContainerRef = useRef<HTMLDivElement>(null);
  const cvCenteredRef = useRef(false);

  // Center the canvas content when first switching to canvas view
  useEffect(() => {
    if (viewMode === "canvas" && !cvCenteredRef.current && cvContainerRef.current) {
      const rect = cvContainerRef.current.getBoundingClientRect();
      setCvOffset({
        x: (rect.width - canvasW) / 2,
        y: (rect.height - canvasH) / 2,
      });
      cvCenteredRef.current = true;
    }
  }, [viewMode, canvasW, canvasH]);

  // Reset centering flag when switching back to grid
  useEffect(() => {
    if (viewMode === "grid") cvCenteredRef.current = false;
  }, [viewMode]);

  const handleCvPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if ((e.target as HTMLElement).closest("[data-no-pan]")) return;
      cvPanRef.current = { active: true, sx: e.clientX, sy: e.clientY, ox: cvOffset.x, oy: cvOffset.y, moved: false };
      setCvDragging(false);
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    },
    [cvOffset.x, cvOffset.y]
  );

  const handleCvPointerMove = useCallback((e: React.PointerEvent) => {
    const p = cvPanRef.current;
    if (!p?.active) return;
    const dx = e.clientX - p.sx;
    const dy = e.clientY - p.sy;
    if (!p.moved && Math.abs(dx) + Math.abs(dy) > 4) {
      p.moved = true;
      setCvDragging(true);
    }
    if (p.moved) setCvOffset({ x: p.ox + dx, y: p.oy + dy });
  }, []);

  const handleCvPointerUp = useCallback(() => {
    cvPanRef.current = null;
    setCvDragging(false);
  }, []);

  const handleCvWheel = useCallback((e: React.WheelEvent) => {
    e.stopPropagation();
    setCvZoom((z) => Math.min(2, Math.max(0.4, +(z - e.deltaY * 0.002).toFixed(2))));
  }, []);

  const handleCvReset = useCallback(() => {
    setCvZoom(1);
    if (cvContainerRef.current) {
      const rect = cvContainerRef.current.getBoundingClientRect();
      setCvOffset({ x: (rect.width - canvasW) / 2, y: (rect.height - canvasH) / 2 });
    }
  }, [canvasW, canvasH]);

  return (
    <>
      {/* Top bar: Logo + link | View switcher */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-[8px]" style={zoneStyle("link-card")}>
          {/* Standalone logo */}
          <div className="shrink-0" style={zoneStyle("logo")}>
            <img
              src={logoUrl || "/logo.svg"}
              alt="Logo"
              className="object-contain"
              style={{ height: "38px", maxWidth: "80px", width: "auto" }}
            />
          </div>
          {/* Website link pill */}
          <div className="flex items-center gap-[6px] rounded-icon border border-border bg-bg-card shadow-card-sm px-[8px] py-[6px]">
            <span className="text-[14px] font-medium text-text-primary whitespace-nowrap" style={zoneStyle("website-text")}>
              {settings.website_text || "Visit our website"}
            </span>
            <span style={zoneStyle("link-icon")}><ExternalLink2Icon /></span>
          </div>
        </div>
        <div className="flex gap-[2px] rounded-icon border border-border bg-bg-card shadow-card-sm p-[2px] shrink-0" style={zoneStyle("grid-switcher")}>
          <button
            onClick={() => setViewMode("grid")}
            className={`flex items-center justify-center rounded-[6px] p-[6px] cursor-pointer transition-colors ${
              viewMode === "grid" ? "bg-bg-subtle text-icon-active" : "text-icon-inactive hover:text-icon-active"
            }`}
          >
            <GridPreviewIcon />
          </button>
          <button
            onClick={() => setViewMode("canvas")}
            className={`flex items-center justify-center rounded-[6px] p-[6px] cursor-pointer transition-colors ${
              viewMode === "canvas" ? "bg-bg-subtle text-icon-active" : "text-icon-inactive hover:text-icon-active"
            }`}
          >
            <CanvasPreviewIcon />
          </button>
        </div>
      </div>

      {viewMode === "grid" ? (
        <>
          {/* Title */}
          <div className="mt-[16px] text-center" style={zoneStyle("title")}>
            <h2
              className="text-[18px] font-bold"
              style={{ color: settings.text_color, fontFamily }}
            >
              {settings.wall_title}
            </h2>
          </div>
          {/* Description */}
          <div className="text-center" style={zoneStyle("description")}>
            <p
              className="text-[12px] mt-[4px]"
              style={{ color: settings.text_color, opacity: 0.7, fontFamily }}
            >
              {settings.wall_description}
            </p>
          </div>

          {/* Signature cards — 2-column grid */}
          <div className="mt-[16px] grid grid-cols-2 gap-[12px]" style={zoneStyle("cards")}>
            {sampleEntries.map((entry) =>
              settings.wall_style === "sticky" ? (
                <StickyPreviewCard key={entry.id} entry={entry} fontFamily={fontFamily} zoneStyle={zoneStyle} />
              ) : (
              <div
                key={entry.id}
                className="flex flex-col relative overflow-hidden"
                style={{ borderRadius: `${settings.card_border_radius}px`, paddingTop: "10px", paddingRight: "10px", paddingBottom: "10px", paddingLeft: "28px" }}
              >
                {/* Background layer — dims independently */}
                <div
                  className="absolute inset-0 shadow-card"
                  style={{ backgroundColor: settings.card_background_color, borderRadius: `${settings.card_border_radius}px`, ...cardInnerStyle("card-frame") }}
                />
                {/* Border layer — dims independently */}
                <div
                  className="absolute inset-0 border"
                  style={{ borderColor: settings.card_border_color, borderRadius: `${settings.card_border_radius}px`, ...cardInnerStyle("card-border") }}
                />
                {/* Notebook punch holes */}
                <div className="absolute left-[6px] top-[8px] bottom-[8px] flex flex-col items-center justify-between pointer-events-none">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="w-[10px] h-[10px] rounded-full"
                      style={{
                        backgroundColor: settings.background_color,
                        boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.15) inset",
                      }}
                    />
                  ))}
                </div>
                {/* Content layer — on top */}
                <div className="relative flex flex-col flex-1">
                  {/* Doodle area with dots — dims for both card-bg and card-text highlights */}
                  <div
                    className="w-full h-[60px] flex items-center justify-center"
                    style={{
                      backgroundColor: settings.canvas_background_color,
                      backgroundImage: `radial-gradient(circle, ${getDotColor(settings.background_color)} 1px, transparent 1px)`,
                      backgroundSize: "14px 14px",
                      borderRadius: "6px",
                      ...cardInnerStyle("card-doodle"),
                    }}
                  >
                    <img src={entry.signatureImg} alt="" className="h-[48px] w-auto object-contain" />
                  </div>
                  {/* Text — dims for card-text highlight */}
                  <div className="flex flex-col flex-1" style={cardInnerStyle("card-text-only")}>
                    {/* Message */}
                    {entry.message && (
                      <p
                        className="text-[10px] mt-[8px]"
                        style={{ color: settings.card_text_color, opacity: 0.7, fontFamily }}
                      >
                        {entry.message}
                      </p>
                    )}
                    {/* Name + date */}
                    <div className="flex items-end justify-between mt-auto pt-[8px]">
                      <div className="flex flex-col gap-[2px]">
                        <span
                          className="text-[10px] font-medium"
                          style={{ color: settings.card_text_color, fontFamily }}
                        >
                          {entry.name}
                        </span>
                        <span
                          className="text-[8px]"
                          style={{ color: settings.card_text_color, opacity: 0.5 }}
                        >
                          {new Date(entry.created_at).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              )
            )}
          </div>
        </>
      ) : (
        /* ── Canvas view ── */
        <div
          ref={cvContainerRef}
          className="mt-[16px] relative rounded-input overflow-hidden"
          style={{ height: "380px" }}
        >
          {/* Pan/zoom viewport */}
          <div
            className="w-full h-full"
            style={{
              cursor: cvDragging ? "grabbing" : "grab",
              backgroundImage: `radial-gradient(circle, ${getDotColor(settings.background_color)} 1px, transparent 1px)`,
              backgroundSize: "14px 14px",
              backgroundPosition: `${(cvOffset.x % 14) + 7}px ${(cvOffset.y % 14) + 7}px`,
            }}
            onPointerDown={handleCvPointerDown}
            onPointerMove={handleCvPointerMove}
            onPointerUp={handleCvPointerUp}
            onWheel={handleCvWheel}
          >
            <div
              style={{
                transform: `translate(${cvOffset.x}px, ${cvOffset.y}px) scale(${cvZoom})`,
                transformOrigin: "0 0",
                width: canvasW,
                height: canvasH,
                position: "relative",
              }}
            >
              {sampleEntries.map((entry, i) => (
                <div
                  key={entry.id}
                  className="absolute"
                  style={{
                    left: canvasPositions[i].x,
                    top: canvasPositions[i].y,
                    width: CELL_W,
                    height: CELL_H,
                  }}
                >
                  <div className="w-full h-full flex items-center justify-center">
                    <img src={entry.signatureImg} alt="" className="h-[48px] w-auto object-contain" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Zoom controls */}
          <div className="absolute right-[8px] top-1/2 -translate-y-1/2 z-10 flex flex-col gap-[4px]" data-no-pan>
            <div className="flex flex-col gap-[2px]">
              <button
                onClick={() => setCvZoom((z) => Math.min(2, +(z + 0.15).toFixed(2)))}
                className="w-[24px] h-[24px] flex items-center justify-center rounded-t-[6px] border border-border bg-bg-card shadow-card-sm cursor-pointer hover:bg-bg-subtle transition-colors text-[12px] font-medium text-text-primary"
              >
                +
              </button>
              <button
                onClick={() => setCvZoom((z) => Math.max(0.4, +(z - 0.15).toFixed(2)))}
                className="w-[24px] h-[24px] flex items-center justify-center rounded-b-[6px] border border-border bg-bg-card shadow-card-sm cursor-pointer hover:bg-bg-subtle transition-colors text-[12px] font-medium text-text-primary"
              >
                &minus;
              </button>
            </div>
            <button
              onClick={handleCvReset}
              title="Reset view"
              className="w-[24px] h-[24px] flex items-center justify-center rounded-[6px] border border-border bg-bg-card shadow-card-sm cursor-pointer hover:bg-bg-subtle transition-colors text-icon-inactive hover:text-icon-active"
            >
              <svg className="w-[12px] h-[12px]" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <circle cx="8" cy="8" r="2" />
                <line x1="8" y1="1" x2="8" y2="5" />
                <line x1="8" y1="11" x2="8" y2="15" />
                <line x1="1" y1="8" x2="5" y2="8" />
                <line x1="11" y1="8" x2="15" y2="8" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Floating CTA button */}
      <div
        className="absolute bottom-0 left-0 right-0 z-20 flex justify-center pb-[16px] pt-[40px]"
        style={{
          background: `linear-gradient(to top, ${settings.background_color} 40%, transparent)`,
          ...zoneStyle("cta"),
        }}
      >
        <span
          className="relative inline-flex items-center justify-center px-[20px] py-[10px] cursor-pointer overflow-hidden"
          style={{ borderRadius: `${settings.button_border_radius}px` }}
        >
          {/* Button background layer */}
          <span
            className="absolute inset-0 shadow-card"
            style={{
              backgroundColor: settings.brand_color,
              borderRadius: `${settings.button_border_radius}px`,
              ...ctaInnerStyle("cta-frame"),
            }}
          />
          {/* Button text layer */}
          <span
            className="relative text-[12px] font-semibold"
            style={{ color: settings.button_text_color, fontFamily, ...ctaInnerStyle("cta-text") }}
          >
            {settings.cta_text || "Sign the Guestbook"}
          </span>
        </span>
      </div>
    </>
  );
}

/* ─── Punch-hole CSS mask (used when widget background is transparent) ─── */
const punchHoleMask: React.CSSProperties = (() => {
  const g = (y: string) =>
    `radial-gradient(circle 5px at 11px ${y}, transparent 5px, black 5px)`;
  const img = [
    g("13px"),
    g("calc(13px + (100% - 26px) * 0.2)"),
    g("calc(13px + (100% - 26px) * 0.4)"),
    g("calc(13px + (100% - 26px) * 0.6)"),
    g("calc(13px + (100% - 26px) * 0.8)"),
    g("calc(100% - 13px)"),
  ].join(", ");
  const comp = Array(5).fill("intersect").join(", ");
  const wComp = Array(5).fill("destination-in").join(", ");
  return {
    maskImage: img,
    WebkitMaskImage: img,
    maskComposite: comp,
    WebkitMaskComposite: wComp,
  } as React.CSSProperties;
})();

function WidgetPreview({
  settings,
  entries,
  fontFamily,
  highlightZones,
}: {
  settings: Required<GuestbookSettings>;
  entries: Entry[];
  fontFamily: string;
  highlightZones: string[] | null;
}) {
  function zoneStyle(zone: string): React.CSSProperties {
    if (!highlightZones) return { transition: "opacity 0.2s ease" };
    const dimOpacity = highlightZones.includes("bg") ? 0 : 0.3;
    return {
      opacity: highlightZones.includes(zone) ? 1 : dimOpacity,
      transition: "opacity 0.2s ease",
    };
  }

  function cardInnerStyle(zone: string): React.CSSProperties {
    if (!highlightZones || !highlightZones.includes("cards")) {
      return { transition: "opacity 0.2s ease" };
    }
    return zoneStyle(zone);
  }

  function ctaInnerStyle(zone: string): React.CSSProperties {
    if (!highlightZones || !highlightZones.includes("cta")) {
      return { transition: "opacity 0.2s ease, transform 0.2s ease" };
    }
    const highlighted = highlightZones.includes(zone);
    if (highlighted && zone === "cta-text") {
      return {
        transform: "scale(1.08)",
        animation: "hl-pulse 1.2s ease-in-out infinite",
        transition: "transform 0.2s ease",
      };
    }
    if (!highlighted && highlightZones.includes("cta-frame")) {
      return {
        opacity: 0.3,
        transition: "opacity 0.2s ease",
      };
    }
    return {
      transition: "opacity 0.2s ease, transform 0.2s ease",
    };
  }

  const sampleEntries = PREVIEW_ENTRIES;

  return (
    <>
      {/* Title */}
      <div style={zoneStyle("title")}>
        <h2
          className="text-[18px] font-bold text-center"
          style={{ color: settings.text_color, fontFamily }}
        >
          {settings.widget_title}
        </h2>
      </div>
      {/* Description */}
      <div style={zoneStyle("description")}>
        <p
          className="text-[12px] mt-[4px] text-center"
          style={{ color: settings.text_color, opacity: 0.7, fontFamily }}
        >
          {settings.widget_description}
        </p>
      </div>

      {/* Signature cards — 2x2 grid (Wall of Love card design) */}
      <div className="mt-[24px] grid grid-cols-2 gap-[12px]" style={zoneStyle("cards")}>
        {sampleEntries.map((entry) => (
          <div
            key={entry.id}
            className="relative overflow-hidden"
            style={{ borderRadius: `${settings.card_border_radius}px` }}
          >
            <div
              className="flex flex-col relative"
              style={{
                paddingTop: "10px", paddingRight: "10px", paddingBottom: "10px", paddingLeft: "28px",
                ...(settings.widget_transparent_bg ? punchHoleMask : {}),
              }}
            >
              {/* Background layer */}
              <div
                className="absolute inset-0 shadow-card"
                style={{ backgroundColor: settings.card_background_color, borderRadius: `${settings.card_border_radius}px`, ...cardInnerStyle("card-frame") }}
              />
              {/* Border layer */}
              <div
                className="absolute inset-0 border"
                style={{ borderColor: settings.card_border_color, borderRadius: `${settings.card_border_radius}px`, ...cardInnerStyle("card-border") }}
              />
              {/* Notebook punch holes (solid color — only when not transparent) */}
              {!settings.widget_transparent_bg && (
                <div className="absolute left-[6px] top-[8px] bottom-[8px] flex flex-col items-center justify-between pointer-events-none">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="w-[10px] h-[10px] rounded-full"
                      style={{
                        backgroundColor: settings.background_color,
                        boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.15) inset",
                      }}
                    />
                  ))}
                </div>
              )}
              {/* Content layer */}
              <div className="relative flex flex-col flex-1">
                {/* Doodle area with dots */}
                <div
                  className="w-full h-[60px] flex items-center justify-center"
                  style={{
                    backgroundColor: settings.canvas_background_color,
                    backgroundImage: `radial-gradient(circle, ${getDotColor(settings.background_color)} 1px, transparent 1px)`,
                    backgroundSize: "14px 14px",
                    borderRadius: "6px",
                    ...cardInnerStyle("card-doodle"),
                  }}
                >
                  <img src={entry.signatureImg} alt="" className="h-[48px] w-auto object-contain" />
                </div>
                {/* Text content */}
                <div className="flex flex-col flex-1" style={cardInnerStyle("card-text-only")}>
                  {entry.message && (
                    <p
                      className="text-[10px] mt-[8px]"
                      style={{ color: settings.card_text_color, opacity: 0.7, fontFamily }}
                    >
                      {entry.message}
                    </p>
                  )}
                  <div className="flex items-end justify-between mt-auto pt-[8px]">
                    <div className="flex flex-col gap-[2px]">
                      <span
                        className="text-[10px] font-medium"
                        style={{ color: settings.card_text_color, fontFamily }}
                      >
                        {entry.name}
                      </span>
                      <span
                        className="text-[8px]"
                        style={{ color: settings.card_text_color, opacity: 0.5 }}
                      >
                        {new Date(entry.created_at).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Shadow overlay for punch holes (only when transparent — outside mask) */}
            {settings.widget_transparent_bg && (
              <div className="absolute left-[6px] top-[8px] bottom-[8px] flex flex-col items-center justify-between pointer-events-none">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-[10px] h-[10px] rounded-full"
                    style={{ boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.15) inset" }}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* CTA button — in flow, not floating */}
      <div className="mt-[24px] flex justify-center" style={zoneStyle("cta")}>
        <span
          className="relative inline-flex items-center justify-center px-[20px] py-[10px] overflow-hidden"
          style={{ borderRadius: `${settings.button_border_radius}px` }}
        >
          {/* Button background layer */}
          <span
            className="absolute inset-0 shadow-card"
            style={{
              backgroundColor: settings.brand_color,
              borderRadius: `${settings.button_border_radius}px`,
              ...ctaInnerStyle("cta-frame"),
            }}
          />
          {/* Button text layer */}
          <span
            className="relative text-[12px] font-semibold"
            style={{ color: settings.button_text_color, fontFamily, ...ctaInnerStyle("cta-text") }}
          >
            {settings.cta_text || "Sign the Guestbook"}
          </span>
        </span>
      </div>
    </>
  );
}

function CollectionPreview({
  settings,
  fontFamily,
  highlightZones,
}: {
  settings: Required<GuestbookSettings>;
  fontFamily: string;
  highlightZones: string[] | null;
}) {
  const [selectedStickyColor, setSelectedStickyColor] = useState(STICKY_NOTE_COLOR);

  function zoneStyle(zone: string): React.CSSProperties {
    if (!highlightZones) return { transition: "opacity 0.2s ease" };
    const dimOpacity = highlightZones.includes("bg") ? 0 : 0.3;
    return {
      opacity: highlightZones.includes(zone) ? 1 : dimOpacity,
      transition: "opacity 0.2s ease",
    };
  }

  function ctaInnerStyle(zone: string): React.CSSProperties {
    if (!highlightZones || !highlightZones.includes("cta")) {
      return { transition: "opacity 0.2s ease, transform 0.2s ease" };
    }
    const highlighted = highlightZones.includes(zone);
    if (highlighted && zone === "cta-text") {
      return {
        transform: "scale(1.08)",
        animation: "hl-pulse 1.2s ease-in-out infinite",
        transition: "transform 0.2s ease",
      };
    }
    // Don't dim text when frame is highlighted — button is a single visual unit
    return { transition: "opacity 0.2s ease, transform 0.2s ease" };
  }

  return (
    <div className="mx-auto max-w-sm flex flex-col gap-[16px]" style={{ fontFamily }}>
      {/* Logo + Heading + description — outside card */}
      <div className="text-center flex flex-col items-center gap-[4px]">
        <div style={zoneStyle("logo")}>
          <img
            src={settings.logo_url || "/logo.svg"}
            alt="Logo"
            className="object-contain"
            style={{ height: "42px", maxWidth: "120px", width: "auto" }}
          />
        </div>
        <h2
          className="text-body font-semibold"
          style={{ ...zoneStyle("title"), color: settings.text_color }}
        >
          {settings.collection_title}
        </h2>
        {settings.collection_description && (
          <p
            className="text-body-sm font-medium"
            style={{ ...zoneStyle("description"), color: settings.text_color, opacity: highlightZones ? zoneStyle("description").opacity : 0.7 }}
          >
            {settings.collection_description}
          </p>
        )}
      </div>

      {/* Card: canvas + form fields + button */}
      <div
        className="bg-bg-card rounded-card border border-border shadow-card"
        style={{ opacity: highlightZones?.includes("bg") ? 0 : 1, transition: "opacity 0.2s ease" }}
      >
        <div className="flex flex-col gap-[12px] p-[16px]">
          {/* Sticky color swatches (visual only in preview) */}
          {settings.wall_style === "sticky" && (
            <div className="flex items-center gap-[6px] justify-center" style={zoneStyle("canvas")}>
              {["#F5F5F5", "#FFD0C8", "#FFE5CB", "#FFF9C6", "#D1F6D7", "#CBE9FF", "#E5D7FF", "#FFCBE9"].map((color) => {
                const isSelected = color === selectedStickyColor;
                const fl = stickyDarken(color, 0.05);
                const fd = stickyDarken(color, 0.18);
                const fs = stickyDarken(color, 0.10);
                return (
                  <div
                    key={color}
                    className="relative shrink-0 overflow-hidden cursor-pointer"
                    onClick={() => setSelectedStickyColor(color)}
                    style={{
                      width: "20px",
                      height: "20px",
                      backgroundColor: color,
                      borderRadius: "3px 3px 8px 3px",
                      outline: isSelected ? `1.5px solid ${settings.brand_color}` : "none",
                      outlineOffset: "1.5px",
                      boxShadow: "0 0.5px 1px rgba(0,0,0,0.06)",
                    }}
                  >
                    <div
                      className="absolute bottom-0 right-0 pointer-events-none"
                      style={{
                        width: "6px",
                        height: "6px",
                        borderTopLeftRadius: "3px",
                        border: "0.5px solid transparent",
                        backgroundImage: `linear-gradient(132deg, ${fl} 79.5%, ${fd} 85.97%), linear-gradient(135deg, ${fs}00 0%, ${fs} 100%)`,
                        backgroundOrigin: "padding-box, border-box",
                        backgroundClip: "padding-box, border-box",
                      }}
                    />
                  </div>
                );
              })}
            </div>
          )}

          <div style={zoneStyle("canvas")}>
            <DrawingCanvas
              width={300}
              height={180}
              brandColor={settings.brand_color}
              {...(settings.wall_style === "sticky" ? {
                backgroundColor: selectedStickyColor,
                showDotGrid: false,
                showInsetShadow: false,
                drawerColor: stickyDarken(selectedStickyColor, 0.05),
              } : {})}
            />
          </div>

          <div style={zoneStyle("form")}>
            <div className="flex flex-col gap-[12px]">
              <Input
                type="text"
                readOnly
                placeholder="Your name"
              />

              {settings.show_message_field && (
                <textarea
                  readOnly
                  placeholder="Your message (optional)"
                  rows={2}
                  className="w-full rounded-input border border-border bg-bg-input px-[10px] py-[10px] text-body font-medium text-text-primary placeholder:text-text-placeholder focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors resize-none"
                />
              )}

              {settings.show_link_field && (
                <Input
                  type="url"
                  readOnly
                  placeholder="Your website (optional)"
                />
              )}
            </div>
          </div>

          <div style={zoneStyle("cta")}>
            <button
              type="button"
              className="flex items-center justify-center font-semibold h-[44px] w-full cursor-default"
              style={{
                backgroundColor: settings.brand_color,
                borderRadius: `${settings.button_border_radius}px`,
              }}
            >
              <span style={{ ...ctaInnerStyle("cta-text"), color: settings.button_text_color }}>
                {settings.cta_text}
              </span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

/* ─── Icons (from public/ SVGs, converted to currentColor) ─── */

function SectionHeader({ label, first }: { label: string; first?: boolean }) {
  return (
    <div className={`flex items-center gap-[8px] ${first ? "mb-[16px]" : "my-[16px]"}`}>
      <span
        className="text-[12px] font-semibold uppercase tracking-wide text-text-placeholder"
        style={{ fontFamily: "var(--font-geist-mono), monospace" }}
      >
        {label}
      </span>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}

function GlobeIcon() {
  return (
    <svg className="h-[16px] w-[16px] shrink-0 text-icon-inactive" viewBox="0 0 22 22" fill="currentColor">
      <path d="M8.30138 0.296313C3.81992 1.42068 0.425446 5.28099 3.69329e-05 9.99676H5.02019C5.26223 6.52346 6.3984 3.18396 8.30138 0.296313Z" />
      <path d="M0 12.0032C0.425259 16.7193 3.81996 20.5799 8.30171 21.7042C6.39853 18.8164 5.26224 15.4767 5.02019 12.0032H0Z" />
      <path d="M13.6983 21.7042C18.18 20.5799 21.5747 16.7193 22 12.0032H16.9798C16.7378 15.4767 15.6015 18.8164 13.6983 21.7042Z" />
      <path d="M22 9.99676C21.5746 5.28099 18.1801 1.42068 13.6986 0.296313C15.6016 3.18396 16.7378 6.52346 16.9798 9.99676H22Z" />
      <path d="M11 22C8.70015 19.1445 7.31683 15.6593 7.03377 12.0032H14.9662C14.6832 15.6593 13.2998 19.1445 11 22Z" />
      <path d="M11 0C8.70015 2.85547 7.31683 6.3407 7.03377 9.99676H14.9662C14.6832 6.3407 13.2998 2.85547 11 0Z" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg className="h-[16px] w-[16px]" viewBox="0 0 16 16" fill="currentColor">
      <path fillRule="evenodd" clipRule="evenodd" d="M7.12349 1.3335C6.70267 1.3335 6.33997 1.63146 6.25817 2.04436L5.95587 3.57053C5.62498 3.71624 5.31017 3.89355 5.01553 4.09879L3.55116 3.58504C3.15395 3.44575 2.71413 3.60714 2.50372 3.97166L1.62701 5.48916C1.41657 5.85376 1.49638 6.31437 1.81871 6.58743L3.01 7.59629C2.98107 7.86117 2.96591 8.12951 2.96591 8.40016C2.96591 8.67067 2.98104 8.93889 3.00994 9.20364L1.81906 10.2122C1.49667 10.4852 1.41678 10.9459 1.62723 11.3105L2.50393 12.828C2.71434 13.1926 3.15421 13.354 3.55146 13.2147L5.01512 12.7012C5.30994 12.9066 5.62495 13.084 5.95604 13.2298L6.25817 14.7558C6.33997 15.1687 6.70267 15.4668 7.12349 15.4668H8.87684C9.29766 15.4668 9.66036 15.1688 9.74216 14.7559L10.0443 13.2302C10.3756 13.0844 10.6907 12.9069 10.9856 12.7015L12.4499 13.2148C12.8471 13.3541 13.287 13.1927 13.4974 12.8281L14.3741 11.3106C14.5845 10.946 14.5047 10.4854 14.1824 10.2124L12.991 9.2037C13.0199 8.93894 13.035 8.6707 13.035 8.40016C13.035 8.12949 13.0199 7.86111 12.9909 7.59621L14.1821 6.58769C14.5045 6.31464 14.5843 5.854 14.3738 5.4894L13.4971 3.97189C13.2867 3.6073 12.8469 3.44589 12.4496 3.58518L10.9852 4.09903C10.6905 3.89368 10.3755 3.71629 10.0443 3.57052L9.74216 2.04428C9.66036 1.63142 9.29766 1.3335 8.87684 1.3335H7.12349ZM8.00016 10.4002C9.10473 10.4002 10.0002 9.50473 10.0002 8.40016C10.0002 7.29559 9.10473 6.40016 8.00016 6.40016C6.89559 6.40016 6.00016 7.29559 6.00016 8.40016C6.00016 9.50473 6.89559 10.4002 8.00016 10.4002Z" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg className="h-[16px] w-[16px]" viewBox="0 0 16 16" fill="currentColor">
      <path fillRule="evenodd" clipRule="evenodd" d="M1.33398 3.3335C1.33398 2.22893 2.22941 1.3335 3.33398 1.3335H10.6673C11.0355 1.3335 11.334 1.63197 11.334 2.00016C11.334 2.36835 11.0355 2.66683 10.6673 2.66683H3.33398C2.96579 2.66683 2.66732 2.96531 2.66732 3.3335V10.6668C2.66732 11.035 2.36884 11.3335 2.00065 11.3335C1.63246 11.3335 1.33398 11.035 1.33398 10.6668V3.3335Z" />
      <path fillRule="evenodd" clipRule="evenodd" d="M4.00065 6.00016C4.00065 4.89559 4.89608 4.00016 6.00065 4.00016H12.6673C13.7719 4.00016 14.6673 4.89559 14.6673 6.00016V12.6668C14.6673 13.7714 13.7719 14.6668 12.6673 14.6668H6.00065C4.89608 14.6668 4.00065 13.7714 4.00065 12.6668V6.00016Z" />
    </svg>
  );
}

function ExternalLinkIcon() {
  return (
    <svg className="h-[16px] w-[16px]" viewBox="0 0 16 16" fill="currentColor">
      <path fillRule="evenodd" clipRule="evenodd" d="M10 1.3335C9.63181 1.3335 9.33333 1.63197 9.33333 2.00016C9.33333 2.36835 9.63181 2.66683 10 2.66683H12.3905L11.012 4.04533C10.9019 4.01587 10.7861 4.00016 10.6667 4.00016H3.33333C2.97971 4.00016 2.64057 4.14064 2.39052 4.39069C2.14048 4.64074 2 4.97987 2 5.3335V12.6668C2 13.0205 2.14048 13.3596 2.39052 13.6096C2.64057 13.8597 2.97971 14.0002 3.33333 14.0002H10.6667C11.0203 14.0002 11.3594 13.8597 11.6095 13.6096C11.8595 13.3596 12 13.0205 12 12.6668V5.3335C12 5.21406 11.9843 5.09828 11.9548 4.98813L13.3333 3.60964V6.00016C13.3333 6.36835 13.6318 6.66683 14 6.66683C14.3682 6.66683 14.6667 6.36835 14.6667 6.00016V2.00016C14.6667 1.63197 14.3682 1.3335 14 1.3335H10ZM11.9548 4.98813C11.8321 4.52932 11.4708 4.16802 11.012 4.04533L6.19526 8.86209C5.93491 9.12244 5.93491 9.54455 6.19526 9.8049C6.45561 10.0653 6.87772 10.0653 7.13807 9.8049L11.9548 4.98813Z" />
    </svg>
  );
}

/* ─── Preview-specific icons ─── */

function ExternalLink2Icon() {
  return (
    <svg className="h-[14px] w-[14px] shrink-0 text-icon-active" viewBox="0 0 16 16" fill="currentColor">
      <path fillRule="evenodd" clipRule="evenodd" d="M4.66667 5.33333C4.29848 5.33333 4 5.03486 4 4.66667C4 4.29848 4.29848 4 4.66667 4H11.3333C11.7015 4 12 4.29848 12 4.66667V11.3333C12 11.7015 11.7015 12 11.3333 12C10.9651 12 10.6667 11.7015 10.6667 11.3333V6.27614L5.13807 11.8047C4.87772 12.0651 4.45561 12.0651 4.19526 11.8047C3.93491 11.5444 3.93491 11.1223 4.19526 10.8619L9.72386 5.33333H4.66667Z" />
    </svg>
  );
}

function GridPreviewIcon() {
  return (
    <svg className="h-[16px] w-[16px]" viewBox="0 0 16 16" fill="currentColor">
      <path d="M2.66732 1.3335C1.93094 1.3335 1.33398 1.93045 1.33398 2.66683V6.00016C1.33398 6.73654 1.93094 7.3335 2.66732 7.3335H6.00065C6.73703 7.3335 7.33398 6.73654 7.33398 6.00016V2.66683C7.33398 1.93045 6.73703 1.3335 6.00065 1.3335H2.66732Z" />
      <path d="M10.0007 1.3335C9.26427 1.3335 8.66732 1.93045 8.66732 2.66683V6.00016C8.66732 6.73654 9.26427 7.3335 10.0007 7.3335H13.334C14.0704 7.3335 14.6673 6.73654 14.6673 6.00016V2.66683C14.6673 1.93045 14.0704 1.3335 13.334 1.3335H10.0007Z" />
      <path d="M2.66732 8.66683C1.93094 8.66683 1.33398 9.26378 1.33398 10.0002V13.3335C1.33398 14.0699 1.93094 14.6668 2.66732 14.6668H6.00065C6.73703 14.6668 7.33398 14.0699 7.33398 13.3335V10.0002C7.33398 9.26378 6.73703 8.66683 6.00065 8.66683H2.66732Z" />
      <path d="M10.0007 8.66683C9.26427 8.66683 8.66732 9.26378 8.66732 10.0002V13.3335C8.66732 14.0699 9.26427 14.6668 10.0007 14.6668H13.334C14.0704 14.6668 14.6673 14.0699 14.6673 13.3335V10.0002C14.6673 9.26378 14.0704 8.66683 13.334 8.66683H10.0007Z" />
    </svg>
  );
}

function CanvasPreviewIcon() {
  return (
    <svg className="h-[16px] w-[16px]" viewBox="0 0 16 16" fill="currentColor">
      <path d="M5.00065 1.3335H3.33398C2.22941 1.3335 1.33398 2.22893 1.33398 3.3335V5.00016H5.00065V1.3335Z" />
      <path d="M1.33398 6.3335V9.66683L5.00065 9.66683V6.3335H1.33398Z" />
      <path d="M1.33398 11.0002V12.6668C1.33398 13.7714 2.22941 14.6668 3.33398 14.6668H5.00065V11.0002L1.33398 11.0002Z" />
      <path d="M6.33398 14.6668H9.66732V11.0002L6.33398 11.0002V14.6668Z" />
      <path d="M11.0007 14.6668H12.6673C13.7719 14.6668 14.6673 13.7714 14.6673 12.6668V11.0002H11.0007V14.6668Z" />
      <path d="M14.6673 9.66683V6.3335H11.0007V9.66683H14.6673Z" />
      <path d="M14.6673 5.00016V3.3335C14.6673 2.22893 13.7719 1.3335 12.6673 1.3335H11.0007V5.00016H14.6673Z" />
      <path d="M9.66732 1.3335H6.33398V5.00016L9.66732 5.00016V1.3335Z" />
      <path d="M6.33398 9.66683V6.3335L9.66732 6.3335V9.66683L6.33398 9.66683Z" />
    </svg>
  );
}

/* ─── Sticky note preview card (used in WallPreview when wall_style="sticky") ─── */

const STICKY_NOTE_COLOR = "#FFF9C6";
const STICKY_TEXT = "#5D4E37";
const STICKY_TEXT_SECONDARY = "#8B7355";

function stickyDarken(hex: string, amount: number): string {
  const clean = hex.replace("#", "");
  const r = Math.max(0, parseInt(clean.slice(0, 2), 16) - Math.round(255 * amount));
  const g = Math.max(0, parseInt(clean.slice(2, 4), 16) - Math.round(255 * amount));
  const b = Math.max(0, parseInt(clean.slice(4, 6), 16) - Math.round(255 * amount));
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

function StickyPreviewCard({
  entry,
  fontFamily,
  zoneStyle,
}: {
  entry: PreviewEntry;
  fontFamily: string;
  zoneStyle: (zone: string) => React.CSSProperties;
}) {
  const strokeObj = entry.stroke_data as Record<string, unknown> | null;
  const cardColor = typeof strokeObj?.note_color === "string" ? strokeObj.note_color : STICKY_NOTE_COLOR;
  const foldLight = stickyDarken(cardColor, 0.05);
  const foldDark = stickyDarken(cardColor, 0.18);
  const foldStroke = stickyDarken(cardColor, 0.10);

  return (
    <div
      className="relative flex flex-col overflow-hidden"
      style={{
        backgroundColor: cardColor,
        borderRadius: "8px 8px 20px 8px",
        padding: "10px",
        paddingBottom: "12px",
        minHeight: "120px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
        ...zoneStyle("cards"),
      }}
    >
      {/* Doodle area */}
      <div className="w-full h-[40px] flex items-center justify-center">
        <img src={entry.signatureImg} alt="" className="h-[36px] w-auto object-contain" />
      </div>

      {/* Message */}
      {entry.message && (
        <p
          className="text-[9px] mt-[6px] leading-[1.4]"
          style={{
            color: STICKY_TEXT,
            opacity: 0.8,
            fontFamily,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical" as const,
            overflow: "hidden",
          }}
        >
          {entry.message}
        </p>
      )}

      {/* Name + date */}
      <div className="mt-auto pt-[6px]">
        <span
          className="text-[9px] font-semibold"
          style={{ color: STICKY_TEXT, fontFamily }}
        >
          {entry.name}
        </span>
        <span
          className="text-[7px] block mt-[1px]"
          style={{ color: STICKY_TEXT_SECONDARY, opacity: 0.7 }}
        >
          {new Date(entry.created_at).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </span>
      </div>

      {/* Corner fold */}
      <div
        className="absolute bottom-0 right-0 pointer-events-none"
        style={{
          width: "14px",
          height: "14px",
          borderTopLeftRadius: "7px",
          border: "0.5px solid transparent",
          backgroundImage: `linear-gradient(132deg, ${foldLight} 79.5%, ${foldDark} 85.97%), linear-gradient(135deg, ${foldStroke}00 0%, ${foldStroke} 100%)`,
          backgroundOrigin: "padding-box, border-box",
          backgroundClip: "padding-box, border-box",
          boxShadow: "-0.5px -0.5px 1px rgba(0,0,0,0.03), 1px 1.5px 2px rgba(0,0,0,0.06)",
        }}
      />
    </div>
  );
}
