-- Optional explanatory copy below each featured section subtitle.
alter table public.home_page_settings
  add column if not exists classes_description text not null default '',
  add column if not exists workshops_description text not null default '';
