-- Plus purchases linked to an account. Run once in Supabase: SQL Editor → New query → paste → Run.
-- Only the server (secret key) writes rows. Signed in users can read their own rows, nothing else.

create table if not exists public.entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  plan text not null check (plan in ('monthly', 'lifetime')),
  source text not null check (source in ('solana', 'stripe')),
  -- Solana Pay reference or Stripe Checkout session id. Unique, so one purchase
  -- can only ever belong to one account.
  source_ref text not null unique,
  solana_signature text,
  stripe_subscription_id text,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists entitlements_user_id_idx on public.entitlements (user_id);

alter table public.entitlements enable row level security;

drop policy if exists "read own entitlements" on public.entitlements;
create policy "read own entitlements" on public.entitlements
  for select to authenticated
  using ((select auth.uid()) = user_id);

-- No insert, update or delete policies: browsers can never write purchases.
