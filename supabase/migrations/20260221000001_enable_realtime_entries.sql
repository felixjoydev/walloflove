-- Enable Supabase Realtime on the entries table so clients can subscribe
-- to INSERT, UPDATE, and DELETE events via WebSocket.
alter publication supabase_realtime add table public.entries;
