"use client";

import { useState } from "react";
import { StatsCards } from "./stats-cards";
import { AnalyticsChart } from "./analytics-chart";
import { Card } from "@/components/ui/card";

interface Summary {
  page_views: number;
  submissions: number;
  unique_visitors: number;
  top_countries: { country: string; count: number }[];
  top_referrers: { referrer: string; count: number }[];
}

interface TimeSeriesPoint {
  date: string;
  count: number;
}

interface AnalyticsData {
  summary: Summary;
  timeSeries: TimeSeriesPoint[];
}

type AnalyticsTab = "wall" | "collection" | "widget";

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

  const tabs: { label: string; value: AnalyticsTab }[] = [
    { label: "Wall of Love", value: "wall" },
    { label: "Collection Link", value: "collection" },
    { label: "Widget", value: "widget" },
  ];

  const isEmpty = data.summary.page_views === 0 && data.summary.submissions === 0;

  return (
    <div>
      <h1 className="text-subheading font-semibold text-text-primary">Analytics</h1>

      <div className="mt-4 flex gap-1 border-b border-border">
        {tabs.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`border-b-2 px-4 py-2.5 text-body-sm font-medium transition-colors cursor-pointer ${
              tab === t.value
                ? "border-text-primary text-text-primary"
                : "border-transparent text-text-placeholder hover:text-text-secondary"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-6">
        <StatsCards
          pageViews={data.summary.page_views}
          submissions={data.summary.submissions}
          uniqueVisitors={data.summary.unique_visitors}
          tab={tab}
        />

        <AnalyticsChart
          data={data.timeSeries}
          timeRange={timeRange}
          onTimeRangeChange={setTimeRange}
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
