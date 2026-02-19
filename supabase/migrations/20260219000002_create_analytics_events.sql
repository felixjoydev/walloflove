CREATE TABLE public.analytics_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  guestbook_id uuid REFERENCES public.guestbooks(id) ON DELETE CASCADE NOT NULL,
  event_type text NOT NULL CHECK (event_type IN ('page_view', 'submission', 'widget_load')),
  page_type text NOT NULL CHECK (page_type IN ('wall', 'collection', 'widget')),
  visitor_hash text,
  country text,
  referrer text,
  user_agent text,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_analytics_guestbook_type ON public.analytics_events(guestbook_id, page_type, created_at);

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Owner can read analytics for their guestbooks
CREATE POLICY "Owner can read analytics for own guestbooks"
  ON public.analytics_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.guestbooks
      WHERE guestbooks.id = analytics_events.guestbook_id
      AND guestbooks.user_id = auth.uid()
    )
  );

-- No public insert — all inserts go through API routes with service role
