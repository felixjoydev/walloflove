"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { useGuestbookContext } from "@/components/providers/guestbook-provider";
import type { GuestbookSettings } from "@shared/types";
import { saveSettingsAction, renameGuestbookAction, updateSlugAction } from "./actions";
import { deleteGuestbookAction } from "@/components/guestbook/delete-guestbook-action";

type ModerationMode = NonNullable<GuestbookSettings["moderation_mode"]>;

export function SettingsForm() {
  const router = useRouter();
  const guestbook = useGuestbookContext();

  const [name, setName] = useState(guestbook.name);
  const [slug, setSlug] = useState(guestbook.slug ?? "");
  const [settings, setSettings] = useState<Required<GuestbookSettings>>(guestbook.settings);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  function update<K extends keyof GuestbookSettings>(key: K, value: GuestbookSettings[K]) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);

    if (name.trim() && name.trim() !== guestbook.name) {
      const nameResult = await renameGuestbookAction(guestbook.id, name.trim());
      if (nameResult.error) {
        toast.error(nameResult.error);
        setSaving(false);
        return;
      }
    }

    if (slug && slug !== guestbook.slug) {
      const slugResult = await updateSlugAction(guestbook.id, slug);
      if (slugResult.error) {
        toast.error(slugResult.error);
        setSaving(false);
        return;
      }
    }

    const result = await saveSettingsAction(guestbook.id, {
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
    router.push("/guestbooks");
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

      {/* Slug / URL */}
      <div className="space-y-1.5">
        <label className="block text-sm font-medium">Public URL slug</label>
        <div className="flex items-center gap-1 text-sm text-neutral-500">
          <span>/wall/</span>
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
            className="flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500"
            placeholder="my-guestbook"
          />
        </div>
        <p className="text-xs text-neutral-400">
          Used for public wall and collection URLs.
        </p>
      </div>

      {/* CTA text */}
      <div className="space-y-1.5">
        <label className="block text-sm font-medium">Button text (CTA)</label>
        <input
          type="text"
          value={settings.cta_text}
          onChange={(e) => update("cta_text", e.target.value)}
          maxLength={50}
          className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500"
        />
      </div>

      {/* Moderation mode */}
      <div className="space-y-1.5">
        <label className="block text-sm font-medium">Moderation mode</label>
        <div className="flex gap-4">
          {(
            [
              { label: "Auto-approve", value: "auto_approve" },
              { label: "Manual review", value: "manual_approve" },
            ] as const
          ).map((opt) => (
            <label key={opt.value} className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="radio"
                name="moderation"
                checked={settings.moderation_mode === opt.value}
                onChange={() => update("moderation_mode", opt.value as ModerationMode)}
                className="accent-neutral-900"
              />
              {opt.label}
            </label>
          ))}
        </div>
      </div>

      {/* Max entries */}
      <div className="space-y-1.5">
        <label className="block text-sm font-medium">Max entries displayed</label>
        <select
          value={settings.max_entries_displayed}
          onChange={(e) => update("max_entries_displayed", Number(e.target.value))}
          className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
        >
          <option value={25}>25</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
      </div>

      {/* Toggle: show message field */}
      <ToggleSetting
        label="Show message field"
        description="Let visitors add a short message with their drawing."
        checked={settings.show_message_field}
        onChange={() => update("show_message_field", !settings.show_message_field)}
      />

      {/* Toggle: show link field */}
      <ToggleSetting
        label="Show link field"
        description="Let visitors include a link (HTTPS only)."
        checked={settings.show_link_field}
        onChange={() => update("show_link_field", !settings.show_link_field)}
      />

      {/* Save */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save settings"}
      </button>

      {/* Billing section */}
      <div className="border-t border-neutral-200 pt-6">
        <h2 className="text-lg font-semibold">Billing</h2>
        <p className="mt-1 text-sm text-neutral-500">Manage your subscription and plan.</p>
        <Link
          href="/billing"
          className="mt-3 inline-block rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-neutral-50"
        >
          Manage billing
        </Link>
      </div>

      {/* Danger zone */}
      <div className="border-t border-red-200 pt-6">
        <h2 className="text-lg font-semibold text-red-600">Danger zone</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Permanently delete this guestbook and all its entries.
        </p>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="mt-3 rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
        >
          {deleting ? "Deleting..." : "Delete guestbook"}
        </button>
      </div>
    </div>
  );
}

function ToggleSetting({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-neutral-400">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={onChange}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          checked ? "bg-neutral-900" : "bg-neutral-300"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
            checked ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}
