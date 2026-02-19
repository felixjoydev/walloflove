"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createGuestbookAction } from "@/app/(dashboard)/guestbooks/new/actions";

export function CreateFirstGuestbook() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    const result = await createGuestbookAction(name.trim());

    if (result.error) {
      toast.error(result.error);
      setLoading(false);
      return;
    }

    toast.success("Guestbook created!");
    router.push(`/guestbooks/${result.id}/inbox`);
  }

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center">
      <h1 className="text-2xl font-bold">Create your first guestbook</h1>
      <p className="mt-2 text-sm text-neutral-500">
        Get started by giving your guestbook a name.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 w-full max-w-sm space-y-4">
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500"
          placeholder="My Portfolio Guestbook"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create guestbook"}
        </button>
      </form>
    </div>
  );
}
