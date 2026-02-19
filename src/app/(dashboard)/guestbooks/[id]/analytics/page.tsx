import { createClient } from "@/lib/supabase/server";
import {
  getAnalyticsSummary,
  getAnalyticsTimeSeries,
} from "@/lib/repositories/analytics.repo";
import { AnalyticsView } from "@/components/analytics/analytics-view";

export default async function AnalyticsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [wallSummary, collectionSummary, widgetSummary, wallTimeSeries, collectionTimeSeries, widgetTimeSeries] =
    await Promise.all([
      getAnalyticsSummary(supabase, id, "wall"),
      getAnalyticsSummary(supabase, id, "collection"),
      getAnalyticsSummary(supabase, id, "widget"),
      getAnalyticsTimeSeries(supabase, id, "wall"),
      getAnalyticsTimeSeries(supabase, id, "collection"),
      getAnalyticsTimeSeries(supabase, id, "widget"),
    ]);

  return (
    <AnalyticsView
      wall={{ summary: wallSummary, timeSeries: wallTimeSeries }}
      collection={{ summary: collectionSummary, timeSeries: collectionTimeSeries }}
      widget={{ summary: widgetSummary, timeSeries: widgetTimeSeries }}
    />
  );
}
