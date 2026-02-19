"use client";

interface TimeSeriesPoint {
  date: string;
  count: number;
}

export function AnalyticsChart({ data }: { data: TimeSeriesPoint[] }) {
  if (data.length === 0) return null;

  const max = Math.max(...data.map((d) => d.count), 1);
  const chartHeight = 160;
  const barWidth = Math.max(2, Math.min(12, 600 / data.length - 2));

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4">
      <h3 className="text-sm font-medium text-neutral-500">Views over time</h3>
      <div className="mt-3 flex items-end gap-[2px]" style={{ height: chartHeight }}>
        {data.map((point) => {
          const height = (point.count / max) * chartHeight;
          return (
            <div
              key={point.date}
              className="group relative"
              style={{ width: barWidth }}
            >
              <div
                className="rounded-t bg-neutral-900 transition-colors group-hover:bg-neutral-700"
                style={{ height: Math.max(height, 1), width: "100%" }}
              />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden rounded bg-neutral-800 px-2 py-1 text-xs text-white whitespace-nowrap group-hover:block">
                {point.date}: {point.count}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-1 flex justify-between text-xs text-neutral-400">
        <span>{data[0]?.date}</span>
        <span>{data[data.length - 1]?.date}</span>
      </div>
    </div>
  );
}
