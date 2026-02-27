"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";


interface TimeSeriesPoint {
  date: string;
  count: number;
}

interface AnalyticsChartProps {
  pageViews: TimeSeriesPoint[];
  submissions: TimeSeriesPoint[];
  uniqueVisitors: TimeSeriesPoint[];
  timeRange: number;
  onTimeRangeChange: (days: number) => void;
  totalPageViews: number;
  totalSubmissions: number;
  totalUniqueVisitors: number;
}

const TIME_RANGES = [
  { label: "Today", days: 1 },
  { label: "Last 7 Days", days: 7 },
  { label: "Last 30 Days", days: 30 },
] as const;

const COLORS = {
  pageViews: "#9580FF",
  submissions: "#34D399",
  uniqueVisitors: "#60A5FA",
};

function formatDateLabel(dateStr: string, timeRange: number): string {
  if (timeRange === 1) {
    const hour = parseInt(dateStr, 10);
    const suffix = hour < 12 ? "AM" : "PM";
    const display = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${display} ${suffix}`;
  }
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function CustomXTick({
  x,
  y,
  index,
  payload,
  totalCount,
  hoveredIndex,
}: {
  x?: number;
  y?: number;
  index?: number;
  payload?: { value: string };
  totalCount: number;
  hoveredIndex: number | null;
}) {
  if (!payload || index === undefined) return null;
  const isFirst = index === 0;
  const isLast = index === totalCount - 1;
  const isHovered = index === hoveredIndex;
  if (!isFirst && !isLast && !isHovered) return null;

  const anchor = isFirst ? "start" : isLast ? "end" : "middle";

  return (
    <text x={x} y={(y ?? 0) + 12} fill="#949494" fontSize={12} textAnchor={anchor}>
      {payload.value}
    </text>
  );
}

function SyncTooltip({
  active,
  payload,
  label,
  onActiveLabel,
}: {
  active?: boolean;
  payload?: { value: number; name: string; color: string }[];
  label?: string;
  onActiveLabel: (label: string | null) => void;
}) {
  useEffect(() => {
    onActiveLabel(active && label ? label : null);
  }, [active, label, onActiveLabel]);

  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-icon px-3 py-2 text-[12px] shadow-card" style={{ backgroundColor: "#14141F" }}>
      <p className="font-medium text-white mb-1">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} className="flex items-center gap-[6px] text-[#949494]">
          <span className="inline-block w-[6px] h-[6px] rounded-full" style={{ backgroundColor: entry.color }} />
          {entry.name}: {entry.value.toLocaleString()}
        </p>
      ))}
    </div>
  );
}

export function AnalyticsChart({ pageViews, submissions, uniqueVisitors, timeRange, onTimeRangeChange, totalPageViews, totalSubmissions, totalUniqueVisitors }: AnalyticsChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Merge the 3 series into one dataset keyed by date
  const chartData = pageViews.map((point, i) => ({
    label: formatDateLabel(point.date, timeRange),
    pageViews: point.count,
    submissions: submissions[i]?.count ?? 0,
    uniqueVisitors: uniqueVisitors[i]?.count ?? 0,
  }));

  const labelToIndexRef = useRef(new Map<string, number>());
  labelToIndexRef.current.clear();
  chartData.forEach((d, i) => {
    if (!labelToIndexRef.current.has(d.label)) labelToIndexRef.current.set(d.label, i);
  });

  const handleActiveLabel = useCallback((label: string | null) => {
    if (label) {
      const idx = labelToIndexRef.current.get(label);
      setHoveredIndex(idx ?? null);
    } else {
      setHoveredIndex(null);
    }
  }, []);

  return (
    <div className="rounded-input border border-border bg-bg-page shadow-card">
      <div className="flex items-center gap-1 px-[12px] py-[10px]">
        {TIME_RANGES.map((range) => (
          <button
            key={range.days}
            onClick={() => onTimeRangeChange(range.days)}
            className={`rounded-icon px-3 py-1 text-[12px] font-medium transition-colors cursor-pointer ${
              timeRange === range.days
                ? "bg-bg-subtle text-text-primary"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            {range.label}
          </button>
        ))}
      </div>
      <div className="rounded-t-input rounded-b-input border-t border-border bg-bg-card px-4 pt-5 pb-4">
      <div className="flex items-center gap-6">
        {[
          { label: "Page Views", color: COLORS.pageViews, value: totalPageViews },
          { label: "Submissions", color: COLORS.submissions, value: totalSubmissions },
          { label: "Unique Visitors", color: COLORS.uniqueVisitors, value: totalUniqueVisitors },
        ].map((item) => (
          <div key={item.label} className="flex flex-col gap-1">
            <div className="flex items-center gap-[6px]">
              <span className="inline-block w-[6px] h-[6px] rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-[14px] text-text-secondary">{item.label}</span>
            </div>
            <p className="text-xl font-bold text-text-primary pl-3">{item.value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      <div className="mt-10" style={{ height: 240 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 4, right: 12, left: 12, bottom: 0 }}>
            <defs>
              <linearGradient id="gradPageViews" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={COLORS.pageViews} stopOpacity={0.12} />
                <stop offset="100%" stopColor={COLORS.pageViews} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradSubmissions" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={COLORS.submissions} stopOpacity={0.12} />
                <stop offset="100%" stopColor={COLORS.submissions} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradUniqueVisitors" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={COLORS.uniqueVisitors} stopOpacity={0.12} />
                <stop offset="100%" stopColor={COLORS.uniqueVisitors} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#EAEAEA"
              vertical={false}
            />
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              interval={0}
              tick={<CustomXTick totalCount={chartData.length} hoveredIndex={hoveredIndex} />}
            />
            <Tooltip content={<SyncTooltip onActiveLabel={handleActiveLabel} />} />
            <Area
              type="monotone"
              dataKey="pageViews"
              name="Page Views"
              stroke={COLORS.pageViews}
              strokeWidth={2}
              fill="url(#gradPageViews)"
              animationDuration={500}
              dot={false}
              activeDot={{ r: 3, fill: COLORS.pageViews, stroke: "#fff", strokeWidth: 2 }}
            />
            <Area
              type="monotone"
              dataKey="submissions"
              name="Submissions"
              stroke={COLORS.submissions}
              strokeWidth={2}
              fill="url(#gradSubmissions)"
              animationDuration={500}
              dot={false}
              activeDot={{ r: 3, fill: COLORS.submissions, stroke: "#fff", strokeWidth: 2 }}
            />
            <Area
              type="monotone"
              dataKey="uniqueVisitors"
              name="Unique Visitors"
              stroke={COLORS.uniqueVisitors}
              strokeWidth={2}
              fill="url(#gradUniqueVisitors)"
              animationDuration={500}
              dot={false}
              activeDot={{ r: 3, fill: COLORS.uniqueVisitors, stroke: "#fff", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      </div>
    </div>
  );
}
