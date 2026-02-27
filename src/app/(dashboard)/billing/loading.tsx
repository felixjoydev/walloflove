export default function BillingLoading() {
  return (
    <div>
      <div className="h-8 w-24 animate-pulse rounded bg-neutral-200" />
      <div className="mt-2 h-4 w-40 animate-pulse rounded bg-neutral-100" />

      <div className="mt-8 grid gap-6 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-neutral-200 p-6"
          >
            <div className="h-5 w-16 animate-pulse rounded bg-neutral-200" />
            <div className="mt-3 h-8 w-20 animate-pulse rounded bg-neutral-200" />
            <div className="mt-4 space-y-2">
              {Array.from({ length: 4 }).map((_, j) => (
                <div
                  key={j}
                  className="h-3 w-full animate-pulse rounded bg-neutral-100"
                />
              ))}
            </div>
            <div className="mt-6 h-10 w-full animate-pulse rounded-lg bg-neutral-200" />
          </div>
        ))}
      </div>
    </div>
  );
}
