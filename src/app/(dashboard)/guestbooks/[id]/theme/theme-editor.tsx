"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { HexColorPicker, HexColorInput } from "react-colorful";
import { toast } from "sonner";
import { DEFAULT_SETTINGS } from "@shared/types/guestbook";
import type { GuestbookSettings } from "@shared/types";
import { saveThemeAction } from "./actions";

type Font = NonNullable<GuestbookSettings["font"]>;

const FONTS: { label: string; value: Font }[] = [
  { label: "Handwriting", value: "handwriting" },
  { label: "Sans-serif", value: "sans" },
  { label: "Monospace", value: "mono" },
];

interface ColorFieldProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
}

function ColorField({ label, value, onChange }: ColorFieldProps) {
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium">{label}</label>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="h-8 w-8 rounded-md border border-neutral-300"
          style={{ backgroundColor: value }}
          aria-label={`Pick ${label.toLowerCase()}`}
        />
        <HexColorInput
          color={value}
          onChange={onChange}
          prefixed
          className="w-24 rounded-md border border-neutral-300 px-2 py-1 text-sm"
        />
      </div>
      {open && (
        <div className="mt-1">
          <HexColorPicker color={value} onChange={onChange} />
        </div>
      )}
    </div>
  );
}

export function ThemeEditor({
  guestbookId,
  initialSettings,
}: {
  guestbookId: string;
  initialSettings: Required<GuestbookSettings>;
}) {
  const router = useRouter();
  const [settings, setSettings] =
    useState<Required<GuestbookSettings>>(initialSettings);
  const [saving, setSaving] = useState(false);

  function update<K extends keyof GuestbookSettings>(
    key: K,
    value: GuestbookSettings[K]
  ) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    const result = await saveThemeAction(guestbookId, {
      background_color: settings.background_color,
      card_background_color: settings.card_background_color,
      text_color: settings.text_color,
      accent_color: settings.accent_color,
      canvas_background_color: settings.canvas_background_color,
      font: settings.font,
      card_border_radius: settings.card_border_radius,
    });
    if (result.error) toast.error(result.error);
    else toast.success("Theme saved");
    setSaving(false);
    router.refresh();
  }

  function handleReset() {
    setSettings((prev) => ({
      ...prev,
      background_color: DEFAULT_SETTINGS.background_color,
      card_background_color: DEFAULT_SETTINGS.card_background_color,
      text_color: DEFAULT_SETTINGS.text_color,
      accent_color: DEFAULT_SETTINGS.accent_color,
      canvas_background_color: DEFAULT_SETTINGS.canvas_background_color,
      font: DEFAULT_SETTINGS.font,
      card_border_radius: DEFAULT_SETTINGS.card_border_radius,
    }));
  }

  const fontFamily =
    settings.font === "handwriting"
      ? '"Caveat", cursive'
      : settings.font === "mono"
        ? "monospace"
        : "system-ui, sans-serif";

  return (
    <div className="mt-6 grid gap-8 lg:grid-cols-2">
      {/* Controls */}
      <div className="space-y-6">
        <ColorField
          label="Background"
          value={settings.background_color}
          onChange={(c) => update("background_color", c)}
        />
        <ColorField
          label="Card background"
          value={settings.card_background_color}
          onChange={(c) => update("card_background_color", c)}
        />
        <ColorField
          label="Text color"
          value={settings.text_color}
          onChange={(c) => update("text_color", c)}
        />
        <ColorField
          label="Accent color"
          value={settings.accent_color}
          onChange={(c) => update("accent_color", c)}
        />
        <ColorField
          label="Canvas background"
          value={settings.canvas_background_color}
          onChange={(c) => update("canvas_background_color", c)}
        />

        {/* Font */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium">Font</label>
          <select
            value={settings.font}
            onChange={(e) => update("font", e.target.value as Font)}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          >
            {FONTS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>

        {/* Border radius */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium">
            Card border radius: {settings.card_border_radius}px
          </label>
          <input
            type="range"
            min={0}
            max={24}
            value={settings.card_border_radius}
            onChange={(e) =>
              update("card_border_radius", Number(e.target.value))
            }
            className="w-full"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save theme"}
          </button>
          <button
            onClick={handleReset}
            className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-neutral-50"
          >
            Reset to defaults
          </button>
        </div>
      </div>

      {/* Preview */}
      <div>
        <h3 className="mb-3 text-sm font-medium text-neutral-500">Preview</h3>
        <div
          className="rounded-xl border border-neutral-200 p-6"
          style={{
            backgroundColor: settings.background_color,
          }}
        >
          {/* Sample card */}
          <div
            style={{
              backgroundColor: settings.card_background_color,
              borderRadius: `${settings.card_border_radius}px`,
              padding: "12px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
              fontFamily,
            }}
          >
            {/* Placeholder drawing */}
            <div
              style={{
                backgroundColor: settings.canvas_background_color,
                borderRadius: "6px",
                height: "80px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: settings.text_color,
                opacity: 0.3,
                fontSize: "14px",
              }}
            >
              [drawing]
            </div>
            <p
              style={{
                color: settings.text_color,
                margin: "8px 0 0",
                fontSize: "14px",
                fontWeight: 600,
              }}
            >
              Jane Doe
            </p>
            <p
              style={{
                color: settings.text_color,
                margin: "4px 0 0",
                fontSize: "12px",
                opacity: 0.7,
              }}
            >
              Great work on the website!
            </p>
          </div>

          {/* Sample CTA */}
          <div className="mt-4 text-center">
            <span
              style={{
                display: "inline-block",
                padding: "10px 24px",
                backgroundColor: settings.accent_color,
                color: "#ffffff",
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
    </div>
  );
}
