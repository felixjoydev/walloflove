import Link from "next/link";

interface GuestbookCardProps {
  id: string;
  name: string;
  entryCount: number;
  createdAt: string;
}

export function GuestbookCard({
  id,
  name,
  entryCount,
  createdAt,
}: GuestbookCardProps) {
  return (
    <Link
      href={`/guestbooks/${id}`}
      className="block rounded-xl border border-neutral-200 p-5 transition-colors hover:border-neutral-300 hover:bg-neutral-50"
    >
      <h3 className="font-semibold">{name}</h3>
      <div className="mt-3 flex items-center gap-4 text-sm text-neutral-500">
        <span>
          {entryCount} {entryCount === 1 ? "entry" : "entries"}
        </span>
        <span>
          Created{" "}
          {new Date(createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </span>
      </div>
    </Link>
  );
}
