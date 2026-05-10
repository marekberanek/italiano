-- Newer Supabase projects no longer auto-grant DML on tables in `public` to
-- the `authenticated` role, which makes the app fail with
-- `permission denied for table vocab_items` even when RLS policies are in
-- place. Make the grants explicit so a freshly created project works
-- end-to-end after `db:migrate`.

grant usage on schema public to anon, authenticated;

grant select, insert, update, delete on public.profiles    to authenticated;
grant select, insert, update, delete on public.vocab_items to authenticated;
grant select, insert                 on public.study_events to authenticated;

-- Force PostgREST to refresh its cached schema so the new grants apply
-- immediately to API requests.
notify pgrst, 'reload schema';
