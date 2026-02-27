"use client";

import { useState } from "react";
import { toast } from "sonner";

export function EmbedCode({ guestbookId }: { guestbookId: string }) {
  const [copied, setCopied] = useState(false);

  const widgetUrl =
    process.env.NEXT_PUBLIC_WIDGET_URL ?? "https://guestbook.cv";
  const apiUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "https://guestbook.cv";

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
    <div className="mt-3">
      <div className="relative">
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

      <details className="mt-4">
        <summary className="cursor-pointer text-sm font-medium text-neutral-600">
          Platform-specific instructions
        </summary>
        <div className="mt-2 space-y-3 text-sm text-neutral-500">
          <div>
            <p className="font-medium text-neutral-700">HTML</p>
            <p>
              Paste the snippet before the closing{" "}
              <code className="rounded bg-neutral-100 px-1">&lt;/body&gt;</code>{" "}
              tag.
            </p>
          </div>
          <div>
            <p className="font-medium text-neutral-700">WordPress</p>
            <p>Add a Custom HTML block and paste the snippet.</p>
          </div>
          <div>
            <p className="font-medium text-neutral-700">Webflow</p>
            <p>
              Use an Embed element in the Designer or add to page Custom Code
              settings.
            </p>
          </div>
          <div>
            <p className="font-medium text-neutral-700">Framer</p>
            <p>Use a Code component and paste the snippet.</p>
          </div>
        </div>
      </details>
    </div>
  );
}
