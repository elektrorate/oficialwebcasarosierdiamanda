-- Internal links are admin-only and accessed through authenticated CMS APIs.
-- Keep existing records and the historical migration unchanged.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '30s';

alter table public.internal_links enable row level security;
drop policy if exists authenticated_all_internal_links on public.internal_links;
revoke all privileges on table public.internal_links from public, anon, authenticated;
grant select, insert, update, delete on table public.internal_links to service_role;

commit;
