-- Create entries table
create table public.entries (
  id uuid primary key default gen_random_uuid(),
  guestbook_id uuid not null references public.guestbooks(id) on delete cascade,
  name text not null check (char_length(name) <= 100),
  message text check (message is null or char_length(message) <= 200),
  link text check (link is null or char_length(link) <= 500),
  stroke_data jsonb not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  visitor_hash text not null,
  deletion_token text not null default gen_random_uuid()::text,
  created_at timestamptz not null default now()
);

-- RLS
alter table public.entries enable row level security;

-- Anyone can read approved entries (widget needs this)
create policy "Public can read approved entries"
  on public.entries for select
  using (status = 'approved');

-- NO public insert policy — all inserts go through API routes with service role

-- Owner can read all entries in their guestbooks (for moderation)
create policy "Owner can read all entries in own guestbooks"
  on public.entries for select
  using (
    exists (
      select 1 from public.guestbooks
      where guestbooks.id = entries.guestbook_id
      and guestbooks.user_id = auth.uid()
    )
  );

-- Owner can update entry status (moderation)
create policy "Owner can moderate entries in own guestbooks"
  on public.entries for update
  using (
    exists (
      select 1 from public.guestbooks
      where guestbooks.id = entries.guestbook_id
      and guestbooks.user_id = auth.uid()
    )
  );

-- Owner can delete entries in their guestbooks
create policy "Owner can delete entries in own guestbooks"
  on public.entries for delete
  using (
    exists (
      select 1 from public.guestbooks
      where guestbooks.id = entries.guestbook_id
      and guestbooks.user_id = auth.uid()
    )
  );

-- Partial index for widget queries (only approved entries, sorted by newest)
create index idx_entries_approved
  on public.entries (guestbook_id, created_at desc)
  where status = 'approved';

-- Index for moderation queries
create index idx_entries_guestbook_status
  on public.entries (guestbook_id, status, created_at desc);

-- Index for rate limiting lookups by visitor hash
create index idx_entries_visitor_hash
  on public.entries (visitor_hash, created_at desc);

-- Index for deletion token lookups
create index idx_entries_deletion_token
  on public.entries (deletion_token);
