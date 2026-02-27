import { Card } from "@/components/ui/card";

interface StatsCardsProps {
  pageViews: number;
  submissions: number;
  uniqueVisitors: number;
  tab: "wall" | "collection" | "widget";
}

export function StatsCards({ pageViews, submissions, uniqueVisitors, tab }: StatsCardsProps) {
  const cards =
    tab === "widget"
      ? [{ label: "Widget Views", value: pageViews.toLocaleString() }]
      : [
          { label: "Page Views", value: pageViews.toLocaleString() },
          { label: "Submissions", value: submissions.toLocaleString() },
          { label: "Unique Visitors", value: uniqueVisitors.toLocaleString() },
        ];

  const gridCols = tab === "widget" ? "" : "sm:grid-cols-3";

  return (
    <div className={`grid gap-4 ${gridCols}`}>
      {cards.map((card) => (
        <Card key={card.label} className="p-4">
          <p className="text-body-sm text-text-secondary">{card.label}</p>
          <p className="mt-1 text-2xl font-bold text-text-primary">{card.value}</p>
        </Card>
      ))}
    </div>
  );
}
