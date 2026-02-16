export default function GuestbookDetailLoading() {
  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 w-48 animate-pulse rounded bg-neutral-200" />
          <div className="mt-2 h-4 w-20 animate-pulse rounded bg-neutral-100" />
        </div>
        <div className="h-8 w-16 animate-pulse rounded-lg bg-neutral-200" />
      </div>

      <div className="mt-6 flex gap-1 border-b border-neutral-200">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-10 w-20 animate-pulse rounded-t bg-neutral-100"
          />
        ))}
      </div>

      <div className="mt-8 space-y-4">
        <div className="h-5 w-32 animate-pulse rounded bg-neutral-200" />
        <div className="h-24 w-full animate-pulse rounded-lg bg-neutral-100" />
      </div>
    </div>
  );
}
