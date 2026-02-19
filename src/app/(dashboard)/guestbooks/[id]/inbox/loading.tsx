export default function InboxLoading() {
  return (
    <div className="animate-pulse">
      <div className="h-8 w-32 rounded bg-neutral-200" />
      <div className="mt-4 h-10 w-full rounded bg-neutral-100" />
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-48 rounded-xl bg-neutral-100" />
        ))}
      </div>
    </div>
  );
}
