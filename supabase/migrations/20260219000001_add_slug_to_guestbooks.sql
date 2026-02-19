-- Add slug column to guestbooks for human-readable public URLs
ALTER TABLE public.guestbooks ADD COLUMN slug text UNIQUE;
CREATE INDEX idx_guestbooks_slug ON public.guestbooks (slug);

-- Allow public read of guestbooks by slug (for public wall/collection pages)
CREATE POLICY "Public can read guestbooks by slug"
  ON public.guestbooks FOR SELECT
  USING (slug IS NOT NULL);
