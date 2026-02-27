-- Custom domain support for guestbooks.
ALTER TABLE public.guestbooks
  ADD COLUMN IF NOT EXISTS custom_domain text,
  ADD COLUMN IF NOT EXISTS domain_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS domain_vercel_status text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS domain_verification_data jsonb;

-- Keep one domain mapped to one guestbook.
CREATE UNIQUE INDEX IF NOT EXISTS idx_guestbooks_custom_domain_unique
  ON public.guestbooks (custom_domain)
  WHERE custom_domain IS NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'guestbooks_domain_vercel_status_check'
  ) THEN
    ALTER TABLE public.guestbooks
      ADD CONSTRAINT guestbooks_domain_vercel_status_check
      CHECK (domain_vercel_status IN ('none', 'pending_add', 'pending_dns', 'verified', 'error'));
  END IF;
END
$$;

-- Resolve a verified custom domain to a guestbook slug for middleware routing.
CREATE OR REPLACE FUNCTION public.get_slug_by_domain(lookup_domain text)
RETURNS TABLE (slug text, guestbook_id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT g.slug, g.id AS guestbook_id
  FROM public.guestbooks AS g
  WHERE g.custom_domain = lower(trim(both from lookup_domain))
    AND g.domain_verified = true
    AND g.slug IS NOT NULL
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_slug_by_domain(text)
TO anon, authenticated, service_role;
