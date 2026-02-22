"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card } from "@/components/ui/card";

interface TimeSeriesPoint {
  date: string;
  count: number;
}

interface AnalyticsChartProps {
  data: TimeSeriesPoint[];
  timeRange: number;
  onTimeRangeChange: (days: number) => void;
}

const TIME_RANGES = [
  { label: "Today", days: 1 },
  { label: "Last 7 Days", days: 7 },
  { label: "Last 30 Days", days: 30 },
] as const;

function filterByTimeRange(data: TimeSeriesPoint[], days: number): TimeSeriesPoint[] {
  if (days >= data.length) return data;
  return data.slice(-days);
}

function formatDateLabel(dateStr: string, timeRange: number): string {
  const date = new Date(dateStr + "T00:00:00");
  if (timeRange === 1) {
    return "Today";
  }
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-icon px-3 py-2 text-[12px] shadow-card" style={{ backgroundColor: "#14141F" }}>
      <p className="font-medium text-white">{label}</p>
      <p className="mt-0.5 text-[#949494]">
        {payload[0].value.toLocaleString()} views
      </p>
    </div>
  );
}

export function AnalyticsChart({ data, timeRange, onTimeRangeChange }: AnalyticsChartProps) {
  if (data.length === 0) return null;

  const filtered = filterByTimeRange(data, timeRange);

  const chartData = filtered.map((point) => ({
    ...point,
    label: formatDateLabel(point.date, timeRange),
  }));

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-body-sm font-medium text-text-secondary">Views over time</h3>
        <div className="flex gap-1 rounded-icon bg-bg-subtle p-1">
          {TIME_RANGES.map((range) => (
            <button
              key={range.days}
              onClick={() => onTimeRangeChange(range.days)}
              className={`rounded-icon px-3 py-1 text-[12px] font-medium transition-colors cursor-pointer ${
                timeRange === range.days
                  ? "bg-bg-card text-text-primary shadow-card-sm"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4" style={{ height: 240 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#9580FF" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#9580FF" stopOpacity={0} />
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
              tick={{ fontSize: 12, fill: "#949494" }}
              interval="preserveStartEnd"
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "#949494" }}
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="count"
              stroke="#9580FF"
              strokeWidth={2}
              fill="url(#chartGradient)"
              dot={false}
              activeDot={{
                r: 4,
                fill: "#9580FF",
                stroke: "#fff",
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
