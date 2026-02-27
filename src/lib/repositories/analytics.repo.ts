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

export interface TimeSeriesPoint {
  date: string;
  count: number;
}

export interface MultiTimeSeries {
  page_views: TimeSeriesPoint[];
  submissions: TimeSeriesPoint[];
  unique_visitors: TimeSeriesPoint[];
}

export async function getAnalyticsMultiTimeSeries(
  supabase: TypedSupabaseClient,
  guestbookId: string,
  pageType: string,
  days: number = 30
): Promise<MultiTimeSeries> {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data: events, error } = await supabase
    .from("analytics_events")
    .select("event_type, visitor_hash, created_at")
    .eq("guestbook_id", guestbookId)
    .eq("page_type", pageType)
    .gte("created_at", since.toISOString())
    .order("created_at", { ascending: true });

  if (error) throw error;

  const viewCounts = new Map<string, number>();
  const submissionCounts = new Map<string, number>();
  const dailyVisitors = new Map<string, Set<string>>();

  for (const event of events ?? []) {
    const date = event.created_at.split("T")[0];
    if (event.event_type === "page_view" || event.event_type === "widget_load") {
      viewCounts.set(date, (viewCounts.get(date) ?? 0) + 1);
    } else if (event.event_type === "submission") {
      submissionCounts.set(date, (submissionCounts.get(date) ?? 0) + 1);
    }
    if (event.visitor_hash) {
      if (!dailyVisitors.has(date)) dailyVisitors.set(date, new Set());
      dailyVisitors.get(date)!.add(event.visitor_hash);
    }
  }

  // Fill in missing dates for all three series
  const page_views: TimeSeriesPoint[] = [];
  const submissions: TimeSeriesPoint[] = [];
  const unique_visitors: TimeSeriesPoint[] = [];
  const current = new Date(since);
  const today = new Date();
  while (current <= today) {
    const dateStr = current.toISOString().split("T")[0];
    page_views.push({ date: dateStr, count: viewCounts.get(dateStr) ?? 0 });
    submissions.push({ date: dateStr, count: submissionCounts.get(dateStr) ?? 0 });
    unique_visitors.push({ date: dateStr, count: dailyVisitors.get(dateStr)?.size ?? 0 });
    current.setDate(current.getDate() + 1);
  }

  return { page_views, submissions, unique_visitors };
}

export async function getAnalyticsHourlySeries(
  supabase: TypedSupabaseClient,
  guestbookId: string,
  pageType: string
): Promise<MultiTimeSeries> {
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  const { data: events, error } = await supabase
    .from("analytics_events")
    .select("event_type, visitor_hash, created_at")
    .eq("guestbook_id", guestbookId)
    .eq("page_type", pageType)
    .gte("created_at", todayStart.toISOString())
    .order("created_at", { ascending: true });

  if (error) throw error;

  const viewCounts = new Map<number, number>();
  const submissionCounts = new Map<number, number>();
  const hourlyVisitors = new Map<number, Set<string>>();

  for (const event of events ?? []) {
    const hour = new Date(event.created_at).getHours();
    if (event.event_type === "page_view" || event.event_type === "widget_load") {
      viewCounts.set(hour, (viewCounts.get(hour) ?? 0) + 1);
    } else if (event.event_type === "submission") {
      submissionCounts.set(hour, (submissionCounts.get(hour) ?? 0) + 1);
    }
    if (event.visitor_hash) {
      if (!hourlyVisitors.has(hour)) hourlyVisitors.set(hour, new Set());
      hourlyVisitors.get(hour)!.add(event.visitor_hash);
    }
  }

  const currentHour = now.getHours();
  const page_views: TimeSeriesPoint[] = [];
  const submissions: TimeSeriesPoint[] = [];
  const unique_visitors: TimeSeriesPoint[] = [];

  for (let h = 0; h <= currentHour; h++) {
    const date = String(h);
    page_views.push({ date, count: viewCounts.get(h) ?? 0 });
    submissions.push({ date, count: submissionCounts.get(h) ?? 0 });
    unique_visitors.push({ date, count: hourlyVisitors.get(h)?.size ?? 0 });
  }

  return { page_views, submissions, unique_visitors };
}
