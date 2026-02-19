"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  updateEntryStatusAction,
  bulkUpdateAction,
  deleteEntryAction,
} from "@/app/(dashboard)/guestbooks/[id]/entries/actions";
import { InboxGrid } from "./inbox-grid";

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
type ViewMode = "grid" | "table";

export function InboxView({
  guestbookId,
  entries,
}: {
  guestbookId: string;
  entries: Entry[];
}) {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterStatus>("pending");
  const [view, setView] = useState<ViewMode>("grid");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [acting, setActing] = useState(false);

  const counts = useMemo(
    () => ({
      pending: entries.filter((e) => e.status === "pending").length,
      approved: entries.filter((e) => e.status === "approved").length,
      rejected: entries.filter((e) => e.status === "rejected").length,
    }),
    [entries]
  );

  const filtered = useMemo(
    () => entries.filter((e) => e.status === filter),
    [entries, filter]
  );

  async function handleStatus(entryId: string, status: "approved" | "rejected") {
    setActing(true);
    const result = await updateEntryStatusAction(guestbookId, entryId, status);
    if (result.error) toast.error(result.error);
    else toast.success(`Entry ${status}`);
    setActing(false);
    router.refresh();
  }

  async function handleBulk(status: "approved" | "rejected") {
    if (selected.size === 0) return;
    setActing(true);
    const result = await bulkUpdateAction(guestbookId, Array.from(selected), status);
    if (result.error) toast.error(result.error);
    else toast.success(`${selected.size} entries ${status}`);
    setSelected(new Set());
    setActing(false);
    router.refresh();
  }

  async function handleDelete(entryId: string) {
    if (!confirm("Delete this entry? This cannot be undone.")) return;
    setActing(true);
    const result = await deleteEntryAction(guestbookId, entryId);
    if (result.error) toast.error(result.error);
    else toast.success("Entry deleted");
    setActing(false);
    router.refresh();
  }

  const tabs: { label: string; value: FilterStatus }[] = [
    { label: "Pending", value: "pending" },
    { label: "Approved", value: "approved" },
    { label: "Rejected", value: "rejected" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Inbox</h1>
        <div className="flex gap-1 rounded-lg border border-neutral-200 p-0.5">
          <button
            onClick={() => setView("grid")}
            className={`rounded-md px-2.5 py-1 text-xs font-medium ${
              view === "grid" ? "bg-neutral-900 text-white" : "text-neutral-500 hover:text-neutral-700"
            }`}
          >
            Grid
          </button>
          <button
            onClick={() => setView("table")}
            className={`rounded-md px-2.5 py-1 text-xs font-medium ${
              view === "table" ? "bg-neutral-900 text-white" : "text-neutral-500 hover:text-neutral-700"
            }`}
          >
            Table
          </button>
        </div>
      </div>

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

      {/* Bulk actions */}
      {selected.size > 0 && (
        <div className="mt-4 flex items-center gap-3 rounded-lg bg-neutral-50 px-4 py-2.5">
          <span className="text-sm text-neutral-600">{selected.size} selected</span>
          <button
            onClick={() => handleBulk("approved")}
            disabled={acting}
            className="rounded-md bg-green-600 px-3 py-1 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            Approve
          </button>
          <button
            onClick={() => handleBulk("rejected")}
            disabled={acting}
            className="rounded-md bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            Reject
          </button>
          <button
            onClick={() => setSelected(new Set())}
            className="ml-auto text-xs text-neutral-500 hover:text-neutral-700"
          >
            Clear
          </button>
        </div>
      )}

      {/* Content */}
      {filtered.length === 0 ? (
        <div className="mt-16 text-center">
          <p className="text-sm text-neutral-500">
            {filter === "pending"
              ? "No pending entries. Publish or share your wall to get testimonials."
              : `No ${filter} entries.`}
          </p>
        </div>
      ) : view === "grid" ? (
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
      ) : (
        <InboxTable
          entries={filtered}
          selected={selected}
          onToggleAll={() => {
            if (filtered.every((e) => selected.has(e.id))) setSelected(new Set());
            else setSelected(new Set(filtered.map((e) => e.id)));
          }}
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
    </div>
  );
}

function InboxTable({
  entries,
  selected,
  onToggleAll,
  onToggle,
  onStatus,
  onDelete,
  acting,
}: {
  entries: Entry[];
  selected: Set<string>;
  onToggleAll: () => void;
  onToggle: (id: string) => void;
  onStatus: (id: string, status: "approved" | "rejected") => void;
  onDelete: (id: string) => void;
  acting: boolean;
}) {
  const allSelected = entries.length > 0 && entries.every((e) => selected.has(e.id));

  return (
    <table className="mt-4 w-full text-sm">
      <thead>
        <tr className="border-b border-neutral-200 text-left text-neutral-500">
          <th className="pb-2 pr-3">
            <input type="checkbox" checked={allSelected} onChange={onToggleAll} className="rounded border-neutral-300" />
          </th>
          <th className="pb-2 pr-3 font-medium">Name</th>
          <th className="pb-2 pr-3 font-medium">Message</th>
          <th className="pb-2 pr-3 font-medium">Date</th>
          <th className="pb-2 font-medium">Actions</th>
        </tr>
      </thead>
      <tbody>
        {entries.map((entry) => (
          <tr key={entry.id} className="border-b border-neutral-100 last:border-0">
            <td className="py-3 pr-3">
              <input type="checkbox" checked={selected.has(entry.id)} onChange={() => onToggle(entry.id)} className="rounded border-neutral-300" />
            </td>
            <td className="py-3 pr-3 font-medium">{entry.name}</td>
            <td className="py-3 pr-3 max-w-[200px] truncate text-neutral-600">{entry.message || "\u2014"}</td>
            <td className="py-3 pr-3 text-neutral-500">
              {new Date(entry.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </td>
            <td className="py-3">
              <div className="flex items-center gap-1">
                {entry.status !== "approved" && (
                  <button onClick={() => onStatus(entry.id, "approved")} disabled={acting} className="rounded px-2 py-1 text-xs text-green-700 hover:bg-green-50 disabled:opacity-50">
                    Approve
                  </button>
                )}
                {entry.status !== "rejected" && (
                  <button onClick={() => onStatus(entry.id, "rejected")} disabled={acting} className="rounded px-2 py-1 text-xs text-red-700 hover:bg-red-50 disabled:opacity-50">
                    Reject
                  </button>
                )}
                <button onClick={() => onDelete(entry.id)} disabled={acting} className="rounded px-2 py-1 text-xs text-neutral-500 hover:bg-neutral-50 disabled:opacity-50">
                  Delete
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
