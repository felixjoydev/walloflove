"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  updateEntryStatusAction,
  bulkUpdateAction,
  deleteEntryAction,
} from "./actions";

interface Entry {
  id: string;
  name: string;
  message: string | null;
  link: string | null;
  status: string;
  created_at: string;
}

type FilterStatus = "all" | "pending" | "approved" | "rejected";

const TABS: { label: string; value: FilterStatus }[] = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
];

export function EntriesTable({
  guestbookId,
  entries,
}: {
  guestbookId: string;
  entries: Entry[];
}) {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [acting, setActing] = useState(false);

  const filtered = useMemo(
    () =>
      filter === "all"
        ? entries
        : entries.filter((e) => e.status === filter),
    [entries, filter]
  );

  const allSelected =
    filtered.length > 0 && filtered.every((e) => selected.has(e.id));

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((e) => e.id)));
    }
  }

  function toggleOne(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  }

  async function handleStatus(
    entryId: string,
    status: "approved" | "rejected"
  ) {
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
    const result = await bulkUpdateAction(
      guestbookId,
      Array.from(selected),
      status
    );
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

  return (
    <div className="mt-6">
      {/* Tabs */}
      <div className="flex gap-1 border-b border-neutral-200">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => {
              setFilter(tab.value);
              setSelected(new Set());
            }}
            className={`border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              filter === tab.value
                ? "border-neutral-900 text-neutral-900"
                : "border-transparent text-neutral-500 hover:text-neutral-700"
            }`}
          >
            {tab.label}
            <span className="ml-1.5 text-xs text-neutral-400">
              {tab.value === "all"
                ? entries.length
                : entries.filter((e) => e.status === tab.value).length}
            </span>
          </button>
        ))}
      </div>

      {/* Bulk actions */}
      {selected.size > 0 && (
        <div className="mt-4 flex items-center gap-3 rounded-lg bg-neutral-50 px-4 py-2.5">
          <span className="text-sm text-neutral-600">
            {selected.size} selected
          </span>
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
            Clear selection
          </button>
        </div>
      )}

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="mt-12 text-center">
          <p className="text-sm text-neutral-500">
            No {filter === "all" ? "" : filter} entries.
          </p>
        </div>
      ) : (
        <table className="mt-4 w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-left text-neutral-500">
              <th className="pb-2 pr-3">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  className="rounded border-neutral-300"
                />
              </th>
              <th className="pb-2 pr-3 font-medium">Name</th>
              <th className="pb-2 pr-3 font-medium">Message</th>
              <th className="pb-2 pr-3 font-medium">Link</th>
              <th className="pb-2 pr-3 font-medium">Status</th>
              <th className="pb-2 pr-3 font-medium">Date</th>
              <th className="pb-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((entry) => (
              <tr
                key={entry.id}
                className="border-b border-neutral-100 last:border-0"
              >
                <td className="py-3 pr-3">
                  <input
                    type="checkbox"
                    checked={selected.has(entry.id)}
                    onChange={() => toggleOne(entry.id)}
                    className="rounded border-neutral-300"
                  />
                </td>
                <td className="py-3 pr-3 font-medium">{entry.name}</td>
                <td className="py-3 pr-3 max-w-[200px] truncate text-neutral-600">
                  {entry.message || "—"}
                </td>
                <td className="py-3 pr-3 max-w-[150px] truncate">
                  {entry.link ? (
                    <a
                      href={entry.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:underline"
                    >
                      {new URL(entry.link).hostname}
                    </a>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="py-3 pr-3">
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                      entry.status === "approved"
                        ? "bg-green-100 text-green-700"
                        : entry.status === "rejected"
                          ? "bg-red-100 text-red-700"
                          : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {entry.status}
                  </span>
                </td>
                <td className="py-3 pr-3 text-neutral-500">
                  {new Date(entry.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </td>
                <td className="py-3">
                  <div className="flex items-center gap-1">
                    {entry.status !== "approved" && (
                      <button
                        onClick={() => handleStatus(entry.id, "approved")}
                        disabled={acting}
                        className="rounded px-2 py-1 text-xs text-green-700 hover:bg-green-50 disabled:opacity-50"
                      >
                        Approve
                      </button>
                    )}
                    {entry.status !== "rejected" && (
                      <button
                        onClick={() => handleStatus(entry.id, "rejected")}
                        disabled={acting}
                        className="rounded px-2 py-1 text-xs text-red-700 hover:bg-red-50 disabled:opacity-50"
                      >
                        Reject
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(entry.id)}
                      disabled={acting}
                      className="rounded px-2 py-1 text-xs text-neutral-500 hover:bg-neutral-50 disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
