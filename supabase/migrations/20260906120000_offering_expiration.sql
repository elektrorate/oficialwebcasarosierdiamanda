-- Migration: Automatic expiration for offerings (Clases, Workshops, Experiencias, Gift Cards)
-- Adds opt-in expiration columns to public.offerings.
-- Existing offerings keep working unchanged (expiration disabled by default).

alter table public.offerings
  add column if not exists expiration_enabled boolean not null default false,
  add column if not exists expires_at timestamptz,
  add column if not exists expired_at timestamptz;

-- A record must not enable expiration without an end date.
alter table public.offerings
  drop constraint if exists offerings_expiration_requires_date;

alter table public.offerings
  add constraint offerings_expiration_requires_date
    check (
      (not expiration_enabled)
      or (expires_at is not null)
    );

-- Partial index for published offerings with active expiration (used by the cron job).
create index if not exists idx_offerings_expire_due
  on public.offerings (expires_at)
  where status = 'published' and expiration_enabled and expires_at is not null;

comment on table public.offerings is
  'Offerings (Clases, Workshops, Experiencias, Gift Cards) with optional automatic expiration.';
