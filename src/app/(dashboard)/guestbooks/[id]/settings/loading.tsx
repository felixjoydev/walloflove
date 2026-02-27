export default function SettingsLoading() {
  return (
    <div>
      <div className="h-8 w-24 animate-pulse rounded bg-neutral-200" />
      <div className="mt-2 h-4 w-48 animate-pulse rounded bg-neutral-100" />

      <div className="mt-6 max-w-lg space-y-8">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 w-28 animate-pulse rounded bg-neutral-200" />
            <div className="h-10 w-full animate-pulse rounded-lg bg-neutral-100" />
          </div>
        ))}
        <div className="h-10 w-28 animate-pulse rounded-lg bg-neutral-200" />
      </div>
    </div>
  );
}
