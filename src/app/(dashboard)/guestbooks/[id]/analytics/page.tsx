import { createClient } from "@/lib/supabase/server";
import {
  getAnalyticsSummary,
  getAnalyticsMultiTimeSeries,
  getAnalyticsHourlySeries,
} from "@/lib/repositories/analytics.repo";
import { AnalyticsView } from "@/components/analytics/analytics-view";

export default async function AnalyticsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [wallSummary, collectionSummary, widgetSummary, wallSeries, collectionSeries, widgetSeries, wallHourly, collectionHourly, widgetHourly] =
    await Promise.all([
      getAnalyticsSummary(supabase, id, "wall"),
      getAnalyticsSummary(supabase, id, "collection"),
      getAnalyticsSummary(supabase, id, "widget"),
      getAnalyticsMultiTimeSeries(supabase, id, "wall"),
      getAnalyticsMultiTimeSeries(supabase, id, "collection"),
      getAnalyticsMultiTimeSeries(supabase, id, "widget"),
      getAnalyticsHourlySeries(supabase, id, "wall"),
      getAnalyticsHourlySeries(supabase, id, "collection"),
      getAnalyticsHourlySeries(supabase, id, "widget"),
    ]);

  return (
    <AnalyticsView
      wall={{ summary: wallSummary, series: wallSeries, hourlySeries: wallHourly }}
      collection={{ summary: collectionSummary, series: collectionSeries, hourlySeries: collectionHourly }}
      widget={{ summary: widgetSummary, series: widgetSeries, hourlySeries: widgetHourly }}
    />
  );
}
