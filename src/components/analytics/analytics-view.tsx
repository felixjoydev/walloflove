"use client";

import { useState, useMemo } from "react";
import { AnalyticsChart } from "./analytics-chart";
import { Card } from "@/components/ui/card";

interface TimeSeriesPoint {
  date: string;
  count: number;
}

interface MultiTimeSeries {
  page_views: TimeSeriesPoint[];
  submissions: TimeSeriesPoint[];
  unique_visitors: TimeSeriesPoint[];
}

interface Summary {
  top_countries: { country: string; count: number }[];
  top_referrers: { referrer: string; count: number }[];
}

interface AnalyticsData {
  summary: Summary;
  series: MultiTimeSeries;
  hourlySeries: MultiTimeSeries;
}

type AnalyticsTab = "wall" | "collection" | "widget";

function filterByRange(data: TimeSeriesPoint[], days: number): TimeSeriesPoint[] {
  if (days >= data.length) return data;
  return data.slice(-days);
}

function sumCounts(data: TimeSeriesPoint[]): number {
  return data.reduce((sum, p) => sum + p.count, 0);
}

export function AnalyticsView({
  wall,
  collection,
  widget,
}: {
  wall: AnalyticsData;
  collection: AnalyticsData;
  widget: AnalyticsData;
}) {
  const [tab, setTab] = useState<AnalyticsTab>("wall");
  const [timeRange, setTimeRange] = useState(30);

  const data = tab === "wall" ? wall : tab === "collection" ? collection : widget;

  const tabs: { label: string; value: AnalyticsTab; disabled?: boolean }[] = [
    { label: "Wall of Love", value: "wall" },
    { label: "Collection Link", value: "collection" },
    { label: "Widget", value: "widget", disabled: true },
  ];

  // Filter series by selected time range (use hourly data for "Today")
  const isToday = timeRange === 1;
  const filteredViews = useMemo(() => isToday ? data.hourlySeries.page_views : filterByRange(data.series.page_views, timeRange), [data.hourlySeries.page_views, data.series.page_views, timeRange, isToday]);
  const filteredSubmissions = useMemo(() => isToday ? data.hourlySeries.submissions : filterByRange(data.series.submissions, timeRange), [data.hourlySeries.submissions, data.series.submissions, timeRange, isToday]);
  const filteredVisitors = useMemo(() => isToday ? data.hourlySeries.unique_visitors : filterByRange(data.series.unique_visitors, timeRange), [data.hourlySeries.unique_visitors, data.series.unique_visitors, timeRange, isToday]);

  // Compute stats from filtered series
  const pageViews = sumCounts(filteredViews);
  const submissions = sumCounts(filteredSubmissions);
  const uniqueVisitors = sumCounts(filteredVisitors);

  const isEmpty = pageViews === 0 && submissions === 0;

  return (
    <div>
      <h1 className="text-subheading font-semibold text-text-primary">Analytics</h1>

      <div className="mt-4 flex gap-1 border-b border-border">
        {tabs.map((t) => (
          <button
            key={t.value}
            onClick={() => !t.disabled && setTab(t.value)}
            disabled={t.disabled}
            className={`border-b-2 px-4 py-2.5 text-body-sm font-medium transition-colors flex items-center gap-[6px] ${
              t.disabled
                ? "border-transparent text-text-placeholder cursor-default opacity-50"
                : tab === t.value
                  ? "border-text-primary text-text-primary cursor-pointer"
                  : "border-transparent text-text-placeholder hover:text-text-secondary cursor-pointer"
            }`}
          >
            {t.label}
            {t.disabled && (
              <span className="text-[10px] font-medium bg-bg-subtle text-text-placeholder rounded-full px-[6px] py-[1px]">
                Soon
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="mt-8 space-y-6">
        <AnalyticsChart
          pageViews={filteredViews}
          submissions={filteredSubmissions}
          uniqueVisitors={filteredVisitors}
          timeRange={timeRange}
          onTimeRangeChange={setTimeRange}
          totalPageViews={pageViews}
          totalSubmissions={submissions}
          totalUniqueVisitors={uniqueVisitors}
        />

        {data.summary.top_countries.length > 0 && (
          <Card className="p-4">
            <h3 className="text-body-sm font-medium text-text-secondary">Top Countries</h3>
            <div className="mt-3 space-y-2">
              {data.summary.top_countries.map(({ country, count }) => (
                <div key={country} className="flex items-center justify-between text-body-sm">
                  <span className="text-text-primary">{country}</span>
                  <span className="text-text-secondary">{count}</span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {isEmpty && (
          <div className="mt-8 text-center">
            <p className="text-body-sm text-text-placeholder">
              No data yet. Analytics will appear once your pages get traffic.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
