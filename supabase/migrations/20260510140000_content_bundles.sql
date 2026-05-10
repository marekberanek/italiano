-- Italiano: global lesson content bundles (read-only for users).
-- Source of truth: this DB. JSON files in assets/data/ are uploaded via
-- `npm run content:push` (see scripts/content-push.mjs).

create table if not exists public.content_bundles (
  id text primary key,
  version text not null,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.content_meta (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

alter table public.content_bundles enable row level security;
alter table public.content_meta    enable row level security;

drop policy if exists "content_bundles_read_all" on public.content_bundles;
create policy "content_bundles_read_all"
  on public.content_bundles for select
  using (true);

drop policy if exists "content_meta_read_all" on public.content_meta;
create policy "content_meta_read_all"
  on public.content_meta for select
  using (true);

grant usage on schema public to anon, authenticated, service_role;
grant select on public.content_bundles to anon, authenticated;
grant select on public.content_meta    to anon, authenticated;

-- service_role bypasses RLS but still needs DML grants on newly created
-- tables (Supabase no longer auto-grants on public.* since 2025). Used by
-- `npm run content:push` and any future server-side writes.
grant select, insert, update, delete on public.content_bundles to service_role;
grant select, insert, update, delete on public.content_meta    to service_role;

notify pgrst, 'reload schema';
