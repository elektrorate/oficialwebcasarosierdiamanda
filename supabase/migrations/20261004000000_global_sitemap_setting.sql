-- Keep sitemap publication in the canonical global SEO settings.
-- Additive and idempotent so it is safe to apply after older CMS migrations.
alter table if exists public.site_settings
  add column if not exists sitemap_enabled boolean not null default true;
