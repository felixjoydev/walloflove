-- Atomic JSONB merge for guestbook settings (eliminates read-modify-write race)
CREATE OR REPLACE FUNCTION public.merge_guestbook_settings(
  guestbook_id uuid,
  new_settings jsonb
)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE public.guestbooks
  SET settings = settings || new_settings
  WHERE id = guestbook_id
  RETURNING settings;
$$;
