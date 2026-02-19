"use client";

interface Entry {
  id: string;
  name: string;
  message: string | null;
  link: string | null;
  stroke_data: unknown;
  status: string;
  created_at: string;
}

export function InboxGrid({
  entries,
  selected,
  onToggle,
  onStatus,
  onDelete,
  acting,
}: {
  entries: Entry[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  onStatus: (id: string, status: "approved" | "rejected") => void;
  onDelete: (id: string) => void;
  acting: boolean;
}) {
  return (
    <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {entries.map((entry) => (
        <div
          key={entry.id}
          className={`relative rounded-xl border p-4 transition-colors ${
            selected.has(entry.id)
              ? "border-neutral-900 bg-neutral-50"
              : "border-neutral-200 bg-white hover:border-neutral-300"
          }`}
        >
          {/* Checkbox */}
          <input
            type="checkbox"
            checked={selected.has(entry.id)}
            onChange={() => onToggle(entry.id)}
            className="absolute right-3 top-3 rounded border-neutral-300"
          />

          {/* Signature thumbnail */}
          <div className="mb-3 h-20 rounded-lg bg-neutral-100" />

          {/* Name & date */}
          <p className="text-sm font-medium">{entry.name}</p>
          <p className="mt-0.5 text-xs text-neutral-400">
            {new Date(entry.created_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </p>

          {/* Message */}
          {entry.message && (
            <p className="mt-2 text-sm text-neutral-600 line-clamp-2">{entry.message}</p>
          )}

          {/* Link */}
          {entry.link && (
            <a
              href={entry.link}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 block text-xs text-indigo-600 hover:underline truncate"
            >
              {entry.link}
            </a>
          )}

          {/* Actions */}
          <div className="mt-3 flex items-center gap-1 border-t border-neutral-100 pt-3">
            {entry.status !== "approved" && (
              <button
                onClick={() => onStatus(entry.id, "approved")}
                disabled={acting}
                className="flex h-7 w-7 items-center justify-center rounded-md text-green-600 hover:bg-green-50 disabled:opacity-50"
                title="Approve"
              >
                <CheckIcon />
              </button>
            )}
            {entry.status !== "rejected" && (
              <button
                onClick={() => onStatus(entry.id, "rejected")}
                disabled={acting}
                className="flex h-7 w-7 items-center justify-center rounded-md text-red-600 hover:bg-red-50 disabled:opacity-50"
                title="Reject"
              >
                <XIcon />
              </button>
            )}
            <button
              onClick={() => onDelete(entry.id)}
              disabled={acting}
              className="ml-auto flex h-7 w-7 items-center justify-center rounded-md text-neutral-400 hover:bg-neutral-50 disabled:opacity-50"
              title="Delete"
            >
              <TrashIcon />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function CheckIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
    </svg>
  );
}
