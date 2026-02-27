export default function AnalyticsLoading() {
  return (
    <div className="animate-pulse">
      <div className="h-8 w-32 rounded bg-neutral-200" />
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-20 rounded-xl bg-neutral-100" />
        ))}
      </div>
      <div className="mt-6 h-48 rounded-xl bg-neutral-100" />
    </div>
  );
}
