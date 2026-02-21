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
        <div className="flex gap-[2px] rounded-icon border border-border p-[2px]">
          <button
            onClick={() => setView("grid")}
            className={`flex items-center justify-center rounded-[6px] p-[6px] cursor-pointer transition-colors ${
              view === "grid" ? "bg-bg-subtle text-icon-active" : "text-icon-inactive hover:text-icon-active"
            }`}
            title="Grid view"
          >
            <GridIcon />
          </button>
          <button
            onClick={() => setView("table")}
            className={`flex items-center justify-center rounded-[6px] p-[6px] cursor-pointer transition-colors ${
              view === "table" ? "bg-bg-subtle text-icon-active" : "text-icon-inactive hover:text-icon-active"
            }`}
            title="Table view"
          >
            <TableRowsIcon />
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

function GridIcon() {
  return (
    <svg className="h-[16px] w-[16px]" viewBox="0 0 16 16" fill="currentColor">
      <path d="M2.66732 1.3335C1.93094 1.3335 1.33398 1.93045 1.33398 2.66683V6.00016C1.33398 6.73654 1.93094 7.3335 2.66732 7.3335H6.00065C6.73703 7.3335 7.33398 6.73654 7.33398 6.00016V2.66683C7.33398 1.93045 6.73703 1.3335 6.00065 1.3335H2.66732Z" />
      <path d="M10.0007 1.3335C9.26427 1.3335 8.66732 1.93045 8.66732 2.66683V6.00016C8.66732 6.73654 9.26427 7.3335 10.0007 7.3335H13.334C14.0704 7.3335 14.6673 6.73654 14.6673 6.00016V2.66683C14.6673 1.93045 14.0704 1.3335 13.334 1.3335H10.0007Z" />
      <path d="M2.66732 8.66683C1.93094 8.66683 1.33398 9.26378 1.33398 10.0002V13.3335C1.33398 14.0699 1.93094 14.6668 2.66732 14.6668H6.00065C6.73703 14.6668 7.33398 14.0699 7.33398 13.3335V10.0002C7.33398 9.26378 6.73703 8.66683 6.00065 8.66683H2.66732Z" />
      <path d="M10.0007 8.66683C9.26427 8.66683 8.66732 9.26378 8.66732 10.0002V13.3335C8.66732 14.0699 9.26427 14.6668 10.0007 14.6668H13.334C14.0704 14.6668 14.6673 14.0699 14.6673 13.3335V10.0002C14.6673 9.26378 14.0704 8.66683 13.334 8.66683H10.0007Z" />
    </svg>
  );
}

function TableRowsIcon() {
  return (
    <svg className="h-[16px] w-[16px]" viewBox="0 0 16 16" fill="currentColor">
      <path d="M3.33398 1.3335C2.22941 1.3335 1.33398 2.22893 1.33398 3.3335V5.00016L14.6673 5.00016V3.3335C14.6673 2.22893 13.7719 1.3335 12.6673 1.3335H3.33398Z" />
      <path d="M14.6673 6.3335L1.33398 6.3335V9.66683L14.6673 9.66683V6.3335Z" />
      <path d="M14.6673 11.0002L1.33398 11.0002V12.6668C1.33398 13.7714 2.22941 14.6668 3.33398 14.6668H12.6673C13.7719 14.6668 14.6673 13.7714 14.6673 12.6668V11.0002Z" />
    </svg>
  );
}
