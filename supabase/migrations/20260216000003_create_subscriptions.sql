-- Create subscriptions table
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  stripe_customer_id text,
  stripe_subscription_id text,
  plan text not null default 'free' check (plan in ('free', 'starter', 'pro')),
  status text not null default 'active' check (status in ('active', 'canceled', 'past_due')),
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS
alter table public.subscriptions enable row level security;

-- Owner can read their own subscription
create policy "Owner can read own subscription"
  on public.subscriptions for select
  using (auth.uid() = user_id);

-- No public insert/update/delete — all writes via service role (Stripe webhook handler)

-- Auto-update updated_at
create trigger set_updated_at
  before update on public.subscriptions
  for each row execute function public.handle_updated_at();
