"use client";

import { useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type FilterStatus = "pending" | "approved" | "rejected";

const copy: Record<FilterStatus, { title: string; subtitle: string }> = {
  pending: {
    title: "No pending requests",
    subtitle: "Share your guestbook link to start collecting entries.",
  },
  approved: {
    title: "No approved entries",
    subtitle: "Approve pending entries to display them on your wall.",
  },
  rejected: {
    title: "No rejected entries",
    subtitle: "Rejected entries will appear here.",
  },
};

export function InboxEmptyState({
  filter,
  slug,
  guestbookId,
}: {
  filter: FilterStatus;
  slug: string | null;
  guestbookId: string;
}) {
  const { title, subtitle } = copy[filter];
  const isPublished = !!slug;

  return (
    <div className="flex flex-1 flex-col items-center justify-center text-center">
      <img
        src="/inbox-empty-state.svg"
        alt=""
        className="w-[200px] h-auto"
      />

      <h2 className="mt-[24px] text-subheading font-semibold text-text-primary">
        {title}
      </h2>
      <p className="mt-[8px] text-body-sm text-text-secondary max-w-[300px]">
        {isPublished && filter === "pending"
          ? "Share your wall link to collect more entries."
          : subtitle}
      </p>

      <div className="mt-[24px]">
        {isPublished ? (
          <CopyLinkButton slug={slug} />
        ) : (
          <Link
            href={`/guestbooks/${guestbookId}/preview`}
            className="flex items-center justify-center h-[36px] px-4 text-body-sm font-semibold rounded-sm bg-accent text-white hover:bg-accent-hover active:bg-accent-active transition-colors"
          >
            Go to Preview
          </Link>
        )}
      </div>
    </div>
  );
}

function CopyLinkButton({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);
  const wallUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/wall/${slug}`;

  async function handleCopy() {
    await navigator.clipboard.writeText(wallUrl);
    toast.success("Wall link copied!");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Button size="small" onClick={handleCopy}>
      {copied ? "Copied!" : "Copy Wall Link"}
    </Button>
  );
}
