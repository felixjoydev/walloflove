interface StatsCardsProps {
  pageViews: number;
  submissions: number;
  uniqueVisitors: number;
}

export function StatsCards({ pageViews, submissions, uniqueVisitors }: StatsCardsProps) {
  const conversionRate =
    pageViews > 0
      ? ((submissions / pageViews) * 100).toFixed(1)
      : "0.0";

  const cards = [
    { label: "Page Views", value: pageViews.toLocaleString(), hint: undefined as string | undefined },
    { label: "Submissions", value: submissions.toLocaleString(), hint: undefined },
    { label: "Visitors", value: `~${uniqueVisitors.toLocaleString()}`, hint: "avg. per day" },
    { label: "Conversion Rate", value: `${conversionRate}%`, hint: undefined },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-xl border border-neutral-200 bg-white p-4"
        >
          <p className="text-sm text-neutral-500">{card.label}</p>
          <p className="mt-1 text-2xl font-bold">{card.value}</p>
          {card.hint && (
            <p className="mt-0.5 text-xs text-neutral-400">{card.hint}</p>
          )}
        </div>
      ))}
    </div>
  );
}
