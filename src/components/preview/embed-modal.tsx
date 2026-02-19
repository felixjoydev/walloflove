"use client";

import { useState } from "react";
import { toast } from "sonner";

export function EmbedModal({
  guestbookId,
  onClose,
}: {
  guestbookId: string;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const widgetUrl =
    process.env.NEXT_PUBLIC_WIDGET_URL ?? "https://widget.signboard.app";
  const apiUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "https://app.signboard.app";

  const snippet = `<div data-sb-id="${guestbookId}"></div>
<link rel="preconnect" href="${apiUrl}" />
<script async src="${widgetUrl}/widget.js"></script>`;

  async function handleCopy() {
    await navigator.clipboard.writeText(snippet);
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Embed Widget</h2>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p className="mt-2 text-sm text-neutral-500">
          Copy this snippet and paste it into your website.
        </p>

        <div className="relative mt-4">
          <pre className="overflow-x-auto rounded-lg bg-neutral-900 p-4 text-sm text-neutral-100">
            <code>{snippet}</code>
          </pre>
          <button
            onClick={handleCopy}
            className="absolute right-3 top-3 rounded-md bg-neutral-700 px-3 py-1 text-xs font-medium text-white hover:bg-neutral-600"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>

        <button
          onClick={onClose}
          className="mt-4 w-full rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-neutral-50"
        >
          Done
        </button>
      </div>
    </div>
  );
}
