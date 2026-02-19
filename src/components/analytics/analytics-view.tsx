"use client";

import { useState } from "react";
import { StatsCards } from "./stats-cards";
import { AnalyticsChart } from "./analytics-chart";

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

  const data = tab === "wall" ? wall : tab === "collection" ? collection : widget;

  const tabs: { label: string; value: AnalyticsTab }[] = [
    { label: "Wall of Love", value: "wall" },
    { label: "Collection Link", value: "collection" },
    { label: "Widget", value: "widget" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold">Analytics</h1>

      <div className="mt-4 flex gap-1 border-b border-neutral-200">
        {tabs.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              tab === t.value
                ? "border-neutral-900 text-neutral-900"
                : "border-transparent text-neutral-500 hover:text-neutral-700"
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
        />

        <AnalyticsChart data={data.timeSeries} />

        {/* Country breakdown */}
        {data.summary.top_countries.length > 0 && (
          <div className="rounded-xl border border-neutral-200 bg-white p-4">
            <h3 className="text-sm font-medium text-neutral-500">Top Countries</h3>
            <div className="mt-3 space-y-2">
              {data.summary.top_countries.map(({ country, count }) => (
                <div key={country} className="flex items-center justify-between text-sm">
                  <span>{country}</span>
                  <span className="text-neutral-500">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Referrer breakdown */}
        {data.summary.top_referrers.length > 0 && (
          <div className="rounded-xl border border-neutral-200 bg-white p-4">
            <h3 className="text-sm font-medium text-neutral-500">Top Referrers</h3>
            <div className="mt-3 space-y-2">
              {data.summary.top_referrers.map(({ referrer, count }) => (
                <div key={referrer} className="flex items-center justify-between text-sm">
                  <span className="truncate max-w-[300px]">{referrer}</span>
                  <span className="text-neutral-500">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {data.summary.page_views === 0 && data.summary.submissions === 0 && (
          <div className="mt-8 text-center">
            <p className="text-sm text-neutral-500">
              No data yet. Analytics will appear once your pages get traffic.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
