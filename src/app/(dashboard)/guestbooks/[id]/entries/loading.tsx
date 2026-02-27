export default function EntriesLoading() {
  return (
    <div>
      <div className="h-8 w-24 animate-pulse rounded bg-neutral-200" />
      <div className="mt-2 h-4 w-48 animate-pulse rounded bg-neutral-100" />

      <div className="mt-6 flex gap-1 border-b border-neutral-200">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-10 w-20 animate-pulse rounded-t bg-neutral-100"
          />
        ))}
      </div>

      <div className="mt-4 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between rounded-lg border border-neutral-100 p-4"
          >
            <div className="flex items-center gap-3">
              <div className="h-4 w-4 animate-pulse rounded bg-neutral-200" />
              <div className="h-4 w-24 animate-pulse rounded bg-neutral-200" />
              <div className="h-4 w-32 animate-pulse rounded bg-neutral-100" />
            </div>
            <div className="h-5 w-16 animate-pulse rounded-full bg-neutral-100" />
          </div>
        ))}
      </div>
    </div>
  );
}
