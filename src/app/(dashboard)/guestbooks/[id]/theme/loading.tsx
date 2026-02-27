export default function ThemeLoading() {
  return (
    <div>
      <div className="h-8 w-24 animate-pulse rounded bg-neutral-200" />
      <div className="mt-2 h-4 w-56 animate-pulse rounded bg-neutral-100" />

      <div className="mt-6 grid gap-8 lg:grid-cols-2">
        <div className="space-y-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-24 animate-pulse rounded bg-neutral-200" />
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 animate-pulse rounded-md bg-neutral-200" />
                <div className="h-8 w-24 animate-pulse rounded-md bg-neutral-100" />
              </div>
            </div>
          ))}
        </div>
        <div>
          <div className="h-4 w-16 animate-pulse rounded bg-neutral-200" />
          <div className="mt-3 h-48 animate-pulse rounded-xl border border-neutral-200 bg-neutral-50" />
        </div>
      </div>
    </div>
  );
}
