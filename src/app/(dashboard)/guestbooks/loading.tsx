export default function GuestbooksLoading() {
  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 w-40 animate-pulse rounded bg-neutral-200" />
          <div className="mt-2 h-4 w-64 animate-pulse rounded bg-neutral-100" />
        </div>
        <div className="h-10 w-32 animate-pulse rounded-lg bg-neutral-200" />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-neutral-200 p-5"
          >
            <div className="h-5 w-32 animate-pulse rounded bg-neutral-200" />
            <div className="mt-3 flex gap-4">
              <div className="h-4 w-16 animate-pulse rounded bg-neutral-100" />
              <div className="h-4 w-24 animate-pulse rounded bg-neutral-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
