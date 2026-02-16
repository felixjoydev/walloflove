"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { GuestbookSettings } from "@shared/types";
import { saveSettingsAction, renameGuestbookAction } from "./actions";

type ModerationMode = NonNullable<GuestbookSettings["moderation_mode"]>;

export function SettingsForm({
  guestbookId,
  guestbookName,
  initialSettings,
}: {
  guestbookId: string;
  guestbookName: string;
  initialSettings: Required<GuestbookSettings>;
}) {
  const router = useRouter();
  const [name, setName] = useState(guestbookName);
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

    // Save name if changed
    if (name.trim() && name.trim() !== guestbookName) {
      const nameResult = await renameGuestbookAction(
        guestbookId,
        name.trim()
      );
      if (nameResult.error) {
        toast.error(nameResult.error);
        setSaving(false);
        return;
      }
    }

    // Save settings
    const result = await saveSettingsAction(guestbookId, {
      moderation_mode: settings.moderation_mode,
      cta_text: settings.cta_text,
      max_entries_displayed: settings.max_entries_displayed,
      show_link_field: settings.show_link_field,
      show_message_field: settings.show_message_field,
    });

    if (result.error) toast.error(result.error);
    else toast.success("Settings saved");
    setSaving(false);
    router.refresh();
  }

  return (
    <div className="mt-6 max-w-lg space-y-8">
      {/* Guestbook name */}
      <div className="space-y-1.5">
        <label className="block text-sm font-medium">Guestbook name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500"
        />
      </div>

      {/* CTA text */}
      <div className="space-y-1.5">
        <label className="block text-sm font-medium">
          Button text (CTA)
        </label>
        <input
          type="text"
          value={settings.cta_text}
          onChange={(e) => update("cta_text", e.target.value)}
          maxLength={50}
          className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500"
        />
        <p className="text-xs text-neutral-400">
          Text shown on the &quot;Sign the Guestbook&quot; button.
        </p>
      </div>

      {/* Moderation mode */}
      <div className="space-y-1.5">
        <label className="block text-sm font-medium">
          Moderation mode
        </label>
        <div className="flex gap-4">
          {(
            [
              { label: "Auto-approve", value: "auto_approve" },
              { label: "Manual review", value: "manual_approve" },
            ] as const
          ).map((opt) => (
            <label
              key={opt.value}
              className="flex cursor-pointer items-center gap-2 text-sm"
            >
              <input
                type="radio"
                name="moderation"
                checked={settings.moderation_mode === opt.value}
                onChange={() =>
                  update("moderation_mode", opt.value as ModerationMode)
                }
                className="accent-neutral-900"
              />
              {opt.label}
            </label>
          ))}
        </div>
        <p className="text-xs text-neutral-400">
          Auto-approve shows entries immediately. Manual requires your
          approval first.
        </p>
      </div>

      {/* Max entries displayed */}
      <div className="space-y-1.5">
        <label className="block text-sm font-medium">
          Max entries displayed
        </label>
        <select
          value={settings.max_entries_displayed}
          onChange={(e) =>
            update("max_entries_displayed", Number(e.target.value))
          }
          className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
        >
          <option value={25}>25</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
      </div>

      {/* Toggle: show message field */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Show message field</p>
          <p className="text-xs text-neutral-400">
            Let visitors add a short message with their drawing.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={settings.show_message_field}
          onClick={() =>
            update("show_message_field", !settings.show_message_field)
          }
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            settings.show_message_field ? "bg-neutral-900" : "bg-neutral-300"
          }`}
        >
          <span
            className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
              settings.show_message_field
                ? "translate-x-6"
                : "translate-x-1"
            }`}
          />
        </button>
      </div>

      {/* Toggle: show link field */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Show link field</p>
          <p className="text-xs text-neutral-400">
            Let visitors include a link (HTTPS only).
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={settings.show_link_field}
          onClick={() =>
            update("show_link_field", !settings.show_link_field)
          }
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            settings.show_link_field ? "bg-neutral-900" : "bg-neutral-300"
          }`}
        >
          <span
            className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
              settings.show_link_field ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </div>

      {/* Save */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save settings"}
      </button>
    </div>
  );
}
