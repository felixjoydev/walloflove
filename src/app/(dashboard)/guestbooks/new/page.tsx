"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createGuestbookAction } from "./actions";

export default function NewGuestbookPage() {
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
    router.push(`/guestbooks/${result.id}`);
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-2xl font-bold">Create a guestbook</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Give your guestbook a name. You can change it later.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium">
            Name
          </label>
          <input
            id="name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500"
            placeholder="My Portfolio Guestbook"
          />
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-neutral-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create guestbook"}
          </button>
        </div>
      </form>
    </div>
  );
}
