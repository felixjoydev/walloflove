"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useGuestbookContext } from "@/components/providers/guestbook-provider";
import type { GuestbookSettings } from "@shared/types";
import { saveThemeAction } from "@/app/(dashboard)/guestbooks/[id]/theme/actions";
import { ColorField } from "@/components/ui/color-field";
import { EmbedModal } from "./embed-modal";

type PreviewTab = "wall" | "widget" | "collection";

type Font = NonNullable<GuestbookSettings["font"]>;

const FONTS: { label: string; value: Font }[] = [
  { label: "Handwriting", value: "handwriting" },
  { label: "Sans-serif", value: "sans" },
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
  const [tab, setTab] = useState<PreviewTab>("wall");
  const [saving, setSaving] = useState(false);
  const [showEmbed, setShowEmbed] = useState(false);
  const [urlCopied, setUrlCopied] = useState(false);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.signboard.app";
  const slug = guestbook.slug ?? guestbookId;
  const wallUrl = `${appUrl}/wall/${slug}`;
  const collectUrl = `${appUrl}/collect/${slug}`;

  function update<K extends keyof GuestbookSettings>(key: K, value: GuestbookSettings[K]) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    const result = await saveThemeAction(guestbookId, settings);
    if (result.error) toast.error(result.error);
    else toast.success("Saved");
    setSaving(false);
    router.refresh();
  }

  async function copyUrl(url: string) {
    await navigator.clipboard.writeText(url);
    setUrlCopied(true);
    toast.success("URL copied!");
    setTimeout(() => setUrlCopied(false), 2000);
  }

  const fontFamily =
    settings.font === "handwriting"
      ? '"Caveat", cursive'
      : settings.font === "mono"
        ? "monospace"
        : "system-ui, sans-serif";

  const tabs: { label: string; value: PreviewTab }[] = [
    { label: "Wall of Love", value: "wall" },
    { label: "Widget", value: "widget" },
    { label: "Collection Link", value: "collection" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold">Preview & Publish</h1>

      <div className="mt-6 flex gap-6 lg:flex-row flex-col">
        {/* Left panel — controls */}
        <div className="w-full lg:w-80 shrink-0 space-y-5">
          <ColorField
            label="Brand color"
            value={settings.brand_color}
            onChange={(c) => update("brand_color", c)}
          />
          <ColorField
            label="Background"
            value={settings.background_color}
            onChange={(c) => update("background_color", c)}
          />
          <ColorField
            label="Text color"
            value={settings.text_color}
            onChange={(c) => update("text_color", c)}
          />
          <ColorField
            label="Card background"
            value={settings.card_background_color}
            onChange={(c) => update("card_background_color", c)}
          />

          <div className="space-y-1.5">
            <label className="block text-sm font-medium">Font</label>
            <select
              value={settings.font}
              onChange={(e) => update("font", e.target.value as Font)}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
            >
              {FONTS.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium">Title</label>
            <input
              type="text"
              value={tab === "wall" ? settings.wall_title : tab === "collection" ? settings.collection_title : settings.widget_title}
              onChange={(e) => {
                if (tab === "wall") update("wall_title", e.target.value);
                else if (tab === "collection") update("collection_title", e.target.value);
                else update("widget_title", e.target.value);
              }}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium">Description</label>
            <textarea
              rows={2}
              value={tab === "wall" ? settings.wall_description : tab === "collection" ? settings.collection_description : settings.widget_description}
              onChange={(e) => {
                if (tab === "wall") update("wall_description", e.target.value);
                else if (tab === "collection") update("collection_description", e.target.value);
                else update("widget_description", e.target.value);
              }}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
            />
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>

        {/* Right panel — preview */}
        <div className="flex-1 min-w-0">
          {/* Tabs */}
          <div className="flex gap-1 border-b border-neutral-200">
            {tabs.map((t) => (
              <button
                key={t.value}
                onClick={() => setTab(t.value)}
                className={`border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                  tab === t.value
                    ? "border-neutral-900 text-neutral-900"
                    : "border-transparent text-neutral-500 hover:text-neutral-700"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Action bar */}
          <div className="mt-4 flex items-center gap-3">
            {tab === "wall" && (
              <button
                onClick={() => copyUrl(wallUrl)}
                className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
              >
                {urlCopied ? "Copied!" : "Copy Wall URL"}
              </button>
            )}
            {tab === "widget" && (
              <button
                onClick={() => setShowEmbed(true)}
                className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
              >
                Get Embed Code
              </button>
            )}
            {tab === "collection" && (
              <button
                onClick={() => copyUrl(collectUrl)}
                className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
              >
                {urlCopied ? "Copied!" : "Copy Collection URL"}
              </button>
            )}
          </div>

          {/* Preview area */}
          <div
            className="mt-4 rounded-xl border border-neutral-200 p-6 min-h-[400px]"
            style={{ backgroundColor: settings.background_color, fontFamily }}
          >
            {tab === "wall" && (
              <WallPreview settings={settings} entries={entries} fontFamily={fontFamily} />
            )}
            {tab === "widget" && (
              <WidgetPreview settings={settings} entries={entries} fontFamily={fontFamily} />
            )}
            {tab === "collection" && (
              <CollectionPreview settings={settings} fontFamily={fontFamily} />
            )}
          </div>
        </div>
      </div>

      {showEmbed && (
        <EmbedModal guestbookId={guestbookId} onClose={() => setShowEmbed(false)} />
      )}
    </div>
  );
}

function WallPreview({
  settings,
  entries,
  fontFamily,
}: {
  settings: Required<GuestbookSettings>;
  entries: Entry[];
  fontFamily: string;
}) {
  return (
    <div>
      <h2 style={{ color: settings.text_color, fontSize: "24px", fontWeight: 700 }}>
        {settings.wall_title}
      </h2>
      <p style={{ color: settings.text_color, opacity: 0.7, fontSize: "14px", marginTop: "4px" }}>
        {settings.wall_description}
      </p>
      <div className="mt-4 columns-2 gap-4">
        {(entries.length > 0 ? entries.slice(0, 6) : [
          { id: "sample", name: "Jane Doe", message: "Great work!", created_at: new Date().toISOString() },
        ]).map((entry) => (
          <div
            key={entry.id}
            className="mb-4 break-inside-avoid"
            style={{
              backgroundColor: settings.card_background_color,
              borderRadius: `${settings.card_border_radius}px`,
              padding: "12px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
            }}
          >
            <div
              style={{ backgroundColor: settings.canvas_background_color, borderRadius: "6px", height: "60px" }}
            />
            <p style={{ color: settings.text_color, fontSize: "14px", fontWeight: 600, marginTop: "8px" }}>
              {entry.name}
            </p>
            {entry.message && (
              <p style={{ color: settings.text_color, fontSize: "12px", opacity: 0.7, marginTop: "4px" }}>
                {entry.message}
              </p>
            )}
          </div>
        ))}
      </div>
      <div className="mt-4 text-center">
        <span
          style={{
            display: "inline-block",
            padding: "10px 24px",
            backgroundColor: settings.brand_color,
            color: "#fff",
            borderRadius: "9999px",
            fontSize: "14px",
            fontWeight: 600,
            fontFamily,
          }}
        >
          {settings.cta_text}
        </span>
      </div>
    </div>
  );
}

function WidgetPreview({
  settings,
  entries,
  fontFamily,
}: {
  settings: Required<GuestbookSettings>;
  entries: Entry[];
  fontFamily: string;
}) {
  return (
    <div className="mx-auto max-w-md">
      <h3 style={{ color: settings.text_color, fontSize: "18px", fontWeight: 600, textAlign: "center" }}>
        {settings.widget_title}
      </h3>
      <div className="mt-3 space-y-3">
        {(entries.length > 0 ? entries.slice(0, 3) : [
          { id: "s1", name: "Jane", message: "Amazing!", created_at: new Date().toISOString() },
        ]).map((entry) => (
          <div
            key={entry.id}
            style={{
              backgroundColor: settings.card_background_color,
              borderRadius: `${settings.card_border_radius}px`,
              padding: "10px",
              boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
            }}
          >
            <div style={{ backgroundColor: settings.canvas_background_color, borderRadius: "4px", height: "48px" }} />
            <p style={{ color: settings.text_color, fontSize: "13px", fontWeight: 600, marginTop: "6px" }}>
              {entry.name}
            </p>
          </div>
        ))}
      </div>
      <div className="mt-3 text-center">
        <span
          style={{
            display: "inline-block",
            padding: "8px 20px",
            backgroundColor: settings.brand_color,
            color: "#fff",
            borderRadius: "9999px",
            fontSize: "13px",
            fontWeight: 600,
            fontFamily,
          }}
        >
          {settings.cta_text}
        </span>
      </div>
    </div>
  );
}

function CollectionPreview({
  settings,
  fontFamily,
}: {
  settings: Required<GuestbookSettings>;
  fontFamily: string;
}) {
  return (
    <div className="mx-auto max-w-md">
      <h2 style={{ color: settings.text_color, fontSize: "22px", fontWeight: 700, textAlign: "center" }}>
        {settings.collection_title}
      </h2>
      <p style={{ color: settings.text_color, opacity: 0.7, fontSize: "14px", textAlign: "center", marginTop: "4px" }}>
        {settings.collection_description}
      </p>
      <div className="mt-4 space-y-3">
        {/* Drawing canvas placeholder */}
        <div
          className="flex items-center justify-center"
          style={{
            backgroundColor: settings.canvas_background_color,
            borderRadius: "12px",
            height: "120px",
            border: "2px dashed",
            borderColor: settings.text_color,
            opacity: 0.3,
          }}
        >
          <span style={{ color: settings.text_color, fontSize: "14px" }}>Draw your signature</span>
        </div>
        {/* Form fields */}
        <input
          readOnly
          placeholder="Your name"
          className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          style={{ fontFamily }}
        />
        {settings.show_message_field && (
          <textarea
            readOnly
            placeholder="Your message"
            rows={2}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            style={{ fontFamily }}
          />
        )}
        <div className="text-center">
          <span
            style={{
              display: "inline-block",
              padding: "10px 24px",
              backgroundColor: settings.brand_color,
              color: "#fff",
              borderRadius: "9999px",
              fontSize: "14px",
              fontWeight: 600,
              fontFamily,
            }}
          >
            {settings.cta_text}
          </span>
        </div>
      </div>
    </div>
  );
}
