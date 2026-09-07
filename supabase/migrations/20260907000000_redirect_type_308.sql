-- Migration: Allow 308 (Permanent Redirect) as a managed redirect type.
-- The middleware (src/proxy.ts) uses the stored "redirect_type" as the HTTP
-- status when resolving public redirects before the page handler runs.

alter table public.redirects
  drop constraint if exists redirects_redirect_type_check;

alter table public.redirects
  add constraint redirects_redirect_type_check
    check (redirect_type in ('301', '302', '308'));

-- Convert the legacy homepage alias rule to a permanent 308 redirect.
update public.redirects
  set redirect_type = '308', updated_at = now()
  where source_url = '/home'
    and status = 'active'
    and redirect_type = '301';