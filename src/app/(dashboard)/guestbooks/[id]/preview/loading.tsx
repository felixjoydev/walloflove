export default function PreviewLoading() {
  return (
    <div className="animate-pulse">
      <div className="h-8 w-48 rounded bg-neutral-200" />
      <div className="mt-6 flex gap-6">
        <div className="w-80 space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 rounded bg-neutral-100" />
          ))}
        </div>
        <div className="flex-1 h-96 rounded-xl bg-neutral-100" />
      </div>
    </div>
  );
}
