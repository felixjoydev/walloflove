-- Drop overly broad anonymous read policy that exposes all columns
DROP POLICY IF EXISTS "Public can read guestbooks by slug" ON public.guestbooks;

-- Replace with a policy that only allows reading the minimal public projection
-- via a restricted set of columns. Since RLS operates at row level,
-- we use a view to control column access for public consumers.
CREATE OR REPLACE VIEW public.public_guestbooks AS
  SELECT id, name, slug, settings
  FROM public.guestbooks
  WHERE slug IS NOT NULL;

-- Grant anonymous read on the view only (not the base table)
GRANT SELECT ON public.public_guestbooks TO anon;

-- Explicitly revoke direct anon access to the base table
-- (authenticated users still read via their own RLS policies)
REVOKE SELECT ON public.guestbooks FROM anon;
