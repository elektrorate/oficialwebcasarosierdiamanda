alter table public.blog_posts
  add column if not exists title_image_id text not null default '';

comment on column public.blog_posts.title_image_id is
  'Imagen opcional mostrada debajo del título en el detalle público de Bitácora.';
