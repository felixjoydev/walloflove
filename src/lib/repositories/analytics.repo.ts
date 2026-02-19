import type { TypedSupabaseClient } from "@shared/types/supabase";

interface TrackEventParams {
  guestbook_id: string;
  event_type: string;
  page_type: string;
  visitor_hash?: string;
  country?: string;
  referrer?: string;
  user_agent?: string;
}

export async function trackEvent(
  supabase: TypedSupabaseClient,
  params: TrackEventParams
) {
  const { error } = await supabase
    .from("analytics_events")
    .insert(params);

  if (error) throw error;
}

export interface AnalyticsSummary {
  page_views: number;
  submissions: number;
  unique_visitors: number;
  top_countries: { country: string; count: number }[];
  top_referrers: { referrer: string; count: number }[];
}

export async function getAnalyticsSummary(
  supabase: TypedSupabaseClient,
  guestbookId: string,
  pageType: string,
  days: number = 30
): Promise<AnalyticsSummary> {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data: events, error } = await supabase
    .from("analytics_events")
    .select("event_type, visitor_hash, country, referrer, created_at")
    .eq("guestbook_id", guestbookId)
    .eq("page_type", pageType)
    .gte("created_at", since.toISOString());

  if (error) throw error;

  let pageViews = 0;
  let submissions = 0;
  // Track unique visitors per day (hashes rotate daily, so per-day is accurate)
  const dailyVisitors = new Map<string, Set<string>>();
  const countryCounts = new Map<string, number>();
  const referrerCounts = new Map<string, number>();

  for (const event of events ?? []) {
    if (event.event_type === "page_view" || event.event_type === "widget_load") {
      pageViews++;
    } else if (event.event_type === "submission") {
      submissions++;
    }
    if (event.visitor_hash) {
      const day = event.created_at.split("T")[0];
      if (!dailyVisitors.has(day)) dailyVisitors.set(day, new Set());
      dailyVisitors.get(day)!.add(event.visitor_hash);
    }
    if (event.country) {
      countryCounts.set(event.country, (countryCounts.get(event.country) ?? 0) + 1);
    }
    if (event.referrer) {
      referrerCounts.set(event.referrer, (referrerCounts.get(event.referrer) ?? 0) + 1);
    }
  }

  // Average daily unique visitors (honest metric given daily hash rotation)
  const daysWithTraffic = dailyVisitors.size;
  const totalDailyUniques = [...dailyVisitors.values()].reduce(
    (sum, set) => sum + set.size,
    0
  );
  const avgDailyVisitors =
    daysWithTraffic > 0 ? Math.round(totalDailyUniques / daysWithTraffic) : 0;

  const sortMap = (map: Map<string, number>) =>
    [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

  return {
    page_views: pageViews,
    submissions,
    unique_visitors: avgDailyVisitors,
    top_countries: sortMap(countryCounts).map(([country, count]) => ({ country, count })),
    top_referrers: sortMap(referrerCounts).map(([referrer, count]) => ({ referrer, count })),
  };
}

interface TimeSeriesPoint {
  date: string;
  count: number;
}

export async function getAnalyticsTimeSeries(
  supabase: TypedSupabaseClient,
  guestbookId: string,
  pageType: string,
  days: number = 30
): Promise<TimeSeriesPoint[]> {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data: events, error } = await supabase
    .from("analytics_events")
    .select("created_at")
    .eq("guestbook_id", guestbookId)
    .eq("page_type", pageType)
    .gte("created_at", since.toISOString())
    .order("created_at", { ascending: true });

  if (error) throw error;

  // Group by date
  const dateCounts = new Map<string, number>();
  for (const event of events ?? []) {
    const date = event.created_at.split("T")[0];
    dateCounts.set(date, (dateCounts.get(date) ?? 0) + 1);
  }

  // Fill in missing dates
  const result: TimeSeriesPoint[] = [];
  const current = new Date(since);
  const today = new Date();
  while (current <= today) {
    const dateStr = current.toISOString().split("T")[0];
    result.push({ date: dateStr, count: dateCounts.get(dateStr) ?? 0 });
    current.setDate(current.getDate() + 1);
  }

  return result;
}
