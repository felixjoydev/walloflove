-- Create guestbooks table
create table public.guestbooks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS
alter table public.guestbooks enable row level security;

-- Owner can read their own guestbooks
create policy "Owner can read own guestbooks"
  on public.guestbooks for select
  using (auth.uid() = user_id);

-- Owner can insert guestbooks
create policy "Owner can create guestbooks"
  on public.guestbooks for insert
  with check (auth.uid() = user_id);

-- Owner can update their own guestbooks
create policy "Owner can update own guestbooks"
  on public.guestbooks for update
  using (auth.uid() = user_id);

-- Owner can delete their own guestbooks
create policy "Owner can delete own guestbooks"
  on public.guestbooks for delete
  using (auth.uid() = user_id);

-- Auto-update updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at
  before update on public.guestbooks
  for each row execute function public.handle_updated_at();
