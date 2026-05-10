-- Italiano: profiles, vocab_items, study_events + RLS
-- Run via Supabase CLI: supabase db push (see docs/DEPLOYMENT.md)

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  display_name text,
  locale text
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;

create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create table if not exists public.vocab_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  client_uuid text not null,
  it text not null,
  cz text not null,
  p text not null default '',
  learned boolean not null default false,
  streak integer not null default 0,
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (user_id, client_uuid)
);

create index if not exists vocab_items_user_updated_idx
  on public.vocab_items (user_id, updated_at desc);

alter table public.vocab_items enable row level security;

drop policy if exists "vocab_select_own" on public.vocab_items;
drop policy if exists "vocab_insert_own" on public.vocab_items;
drop policy if exists "vocab_update_own" on public.vocab_items;
drop policy if exists "vocab_delete_own" on public.vocab_items;

create policy "vocab_select_own"
  on public.vocab_items for select
  using (auth.uid() = user_id);

create policy "vocab_insert_own"
  on public.vocab_items for insert
  with check (auth.uid() = user_id);

create policy "vocab_update_own"
  on public.vocab_items for update
  using (auth.uid() = user_id);

create policy "vocab_delete_own"
  on public.vocab_items for delete
  using (auth.uid() = user_id);

create table if not exists public.study_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null,
  payload jsonb not null default '{}'::jsonb,
  client_id text not null,
  created_at timestamptz not null default now(),
  unique (user_id, client_id)
);

create index if not exists study_events_user_created_idx
  on public.study_events (user_id, created_at desc);

alter table public.study_events enable row level security;

drop policy if exists "study_events_select_own" on public.study_events;
drop policy if exists "study_events_insert_own" on public.study_events;

create policy "study_events_select_own"
  on public.study_events for select
  using (auth.uid() = user_id);

create policy "study_events_insert_own"
  on public.study_events for insert
  with check (auth.uid() = user_id);
