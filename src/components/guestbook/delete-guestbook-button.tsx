"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { deleteGuestbookAction } from "./delete-guestbook-action";

export function DeleteGuestbookButton({
  guestbookId,
}: {
  guestbookId: string;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    const result = await deleteGuestbookAction(guestbookId);

    if (result?.error) {
      toast.error("Failed to delete guestbook.");
      setLoading(false);
      return;
    }

    toast.success("Guestbook deleted.");
    window.location.href = result.redirectTo ?? "/guestbooks";
  }

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
      >
        Delete
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-neutral-500">Are you sure?</span>
      <button
        onClick={handleDelete}
        disabled={loading}
        className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
      >
        {loading ? "Deleting..." : "Yes, delete"}
      </button>
      <button
        onClick={() => setConfirming(false)}
        className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-50"
      >
        Cancel
      </button>
    </div>
  );
}
