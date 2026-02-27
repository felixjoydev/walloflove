"use client";

import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import {
  updateEntryStatusAction,
  bulkUpdateAction,
  deleteEntryAction,
} from "@/app/(dashboard)/guestbooks/[id]/entries/actions";
import { useGuestbookContext } from "@/components/providers/guestbook-provider";
import { InboxGrid } from "./inbox-grid";
import { InboxEmptyState } from "./inbox-empty-state";
import { Checkbox } from "@/components/ui/checkbox";

interface Entry {
  id: string;
  name: string;
  message: string | null;
  link: string | null;
  stroke_data: unknown;
  status: string;
  created_at: string;
}

type FilterStatus = "pending" | "approved" | "rejected";

export function InboxView({
  guestbookId,
  entries,
}: {
  guestbookId: string;
  entries: Entry[];
}) {
  const guestbook = useGuestbookContext();
  const [localEntries, setLocalEntries] = useState<Entry[]>(entries);
  const [filter, setFilter] = useState<FilterStatus>("pending");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [acting, setActing] = useState(false);

  // Re-sync from server props on navigation
  useEffect(() => {
    setLocalEntries(entries);
  }, [entries]);

  // Supabase Realtime + polling fallback for live updates
  useEffect(() => {
    const supabase = createClient();

    // Realtime subscription — delivers instant updates when connected
    const channel = supabase
      .channel(`inbox:${guestbookId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "entries",
          filter: `guestbook_id=eq.${guestbookId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const raw = payload.new as Record<string, unknown>;
            // Realtime may deliver jsonb as a string — parse it
            if (typeof raw.stroke_data === "string") {
              try { raw.stroke_data = JSON.parse(raw.stroke_data); } catch { /* keep as-is */ }
            }
            const newEntry = raw as unknown as Entry;
            setLocalEntries((prev) =>
              prev.some((e) => e.id === newEntry.id)
                ? prev
                : [newEntry, ...prev]
            );
          } else if (payload.eventType === "UPDATE") {
            // Only merge status — don't replace stroke_data which may
            // arrive in a different serialization from Realtime
            const updated = payload.new as Record<string, unknown>;
            const id = updated.id as string;
            const status = updated.status as string;
            setLocalEntries((prev) =>
              prev.map((e) => (e.id === id ? { ...e, status } : e))
            );
          } else if (payload.eventType === "DELETE") {
            const deletedId = (payload.old as { id: string }).id;
            setLocalEntries((prev) =>
              prev.filter((e) => e.id !== deletedId)
            );
          }
        }
      )
      .subscribe();

    // Polling fallback — catches changes if Realtime connection isn't active
    const poll = async () => {
      const { data } = await supabase
        .from("entries")
        .select("id, name, message, link, stroke_data, status, created_at")
        .eq("guestbook_id", guestbookId)
        .order("created_at", { ascending: false });
      if (data) setLocalEntries(data as Entry[]);
    };
    const interval = setInterval(poll, 5000);
    poll(); // Run immediately on mount — don't wait 5s for the first fetch

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [guestbookId]);

  const counts = useMemo(
    () => ({
      pending: localEntries.filter((e) => e.status === "pending").length,
      approved: localEntries.filter((e) => e.status === "approved").length,
      rejected: localEntries.filter((e) => e.status === "rejected").length,
    }),
    [localEntries]
  );

  const filtered = useMemo(
    () => localEntries.filter((e) => e.status === filter),
    [localEntries, filter]
  );

  async function handleStatus(entryId: string, status: "approved" | "rejected") {
    setActing(true);
    const result = await updateEntryStatusAction(guestbookId, entryId, status);
    if (result.error) {
      toast.error(result.error);
    } else {
      setLocalEntries((prev) =>
        prev.map((e) => (e.id === entryId ? { ...e, status } : e))
      );
      toast.success(`Entry ${status}`);
    }
    setActing(false);
  }

  async function handleBulk(status: "approved" | "rejected") {
    if (selected.size === 0) return;
    setActing(true);
    const ids = Array.from(selected);
    const result = await bulkUpdateAction(guestbookId, ids, status);
    if (result.error) {
      toast.error(result.error);
    } else {
      const idSet = new Set(ids);
      setLocalEntries((prev) =>
        prev.map((e) => (idSet.has(e.id) ? { ...e, status } : e))
      );
      toast.success(`${selected.size} entries ${status}`);
    }
    setSelected(new Set());
    setActing(false);
  }

  async function handleDelete(entryId: string) {
    if (!confirm("Delete this entry? This cannot be undone.")) return;
    setActing(true);
    const result = await deleteEntryAction(guestbookId, entryId);
    if (result.error) {
      toast.error(result.error);
    } else {
      setLocalEntries((prev) => prev.filter((e) => e.id !== entryId));
      toast.success("Entry deleted");
    }
    setActing(false);
  }

  const tabs: { label: string; value: FilterStatus }[] = [
    { label: "Pending", value: "pending" },
    { label: "Approved", value: "approved" },
    { label: "Rejected", value: "rejected" },
  ];

  return (
    <div className="-mb-8 flex-1 flex flex-col">
      <h1 className="text-2xl font-bold">Inbox</h1>

      {/* Tabs */}
      <div className="mt-4 flex gap-1 border-b border-neutral-200">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => { setFilter(tab.value); setSelected(new Set()); }}
            className={`border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              filter === tab.value
                ? "border-neutral-900 text-neutral-900"
                : "border-transparent text-neutral-500 hover:text-neutral-700"
            }`}
          >
            {tab.label}
            <span className="ml-1.5 text-xs text-neutral-400">{counts[tab.value]}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      {filtered.length === 0 ? (
        <InboxEmptyState filter={filter} slug={guestbook.slug} guestbookId={guestbook.id} />
      ) : (
        <InboxGrid
          entries={filtered}
          selected={selected}
          onToggle={(id) => {
            const next = new Set(selected);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            setSelected(next);
          }}
          onStatus={handleStatus}
          onDelete={handleDelete}
          acting={acting}
        />
      )}

      {/* Spacer pushes sticky bar to bottom */}
      <div className="flex-1" />

      {/* Sticky bottom bar — Select All + bulk actions */}
      {filtered.length > 0 && (
        <div className="sticky bottom-0 z-50">
          <div
            className="h-[24px]"
            style={{ background: "linear-gradient(to top, var(--color-bg-page) 0%, transparent 100%)" }}
          />
          <div className="bg-bg-page pb-[16px] pt-[8px] flex items-center gap-[12px] min-h-[36px]">
            <div
              onClick={() => {
                if (filtered.every((e) => selected.has(e.id))) setSelected(new Set());
                else setSelected(new Set(filtered.map((e) => e.id)));
              }}
              className="flex items-center gap-[8px] cursor-pointer"
            >
              <Checkbox
                variant="white"
                checked={filtered.length > 0 && filtered.every((e) => selected.has(e.id))}
                onChange={() => {
                  if (filtered.every((e) => selected.has(e.id))) setSelected(new Set());
                  else setSelected(new Set(filtered.map((e) => e.id)));
                }}
              />
              <span className="text-body-sm text-text-secondary">Select all</span>
            </div>
            <span className={`flex-1 flex items-center gap-[12px] ${selected.size > 0 ? "opacity-100 transition-opacity duration-150" : "opacity-0 pointer-events-none"}`}>
              <span className="text-body-sm text-text-primary font-medium">{selected.size} selected</span>
              {filter !== "approved" && (
                <button
                  onClick={() => handleBulk("approved")}
                  disabled={acting}
                  className="rounded-icon bg-approve px-[10px] py-[4px] text-[12px] font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
                >
                  Approve
                </button>
              )}
              {filter !== "rejected" && (
                <button
                  onClick={() => handleBulk("rejected")}
                  disabled={acting}
                  className="rounded-icon bg-reject px-[10px] py-[4px] text-[12px] font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
                >
                  Reject
                </button>
              )}
              <button
                onClick={() => setSelected(new Set())}
                className="ml-auto text-[12px] text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
              >
                Clear
              </button>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
