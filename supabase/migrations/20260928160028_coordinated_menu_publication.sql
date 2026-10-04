-- Coordinated publication is server-only; no browser role may call these functions.
alter table public.menu_items add column if not exists url_auto boolean not null default true;
create table public.public_section_routes (
  key text primary key check (key in ('clases','workshops','experiencias','giftcards','estudio','shop')),
  path text not null unique check (path ~ '^/[a-z0-9]+(-[a-z0-9]+)*$'),
  aliases text[] not null default '{}'
);
insert into public.public_section_routes(key,path) values
 ('clases','/clases'),('workshops','/workshops'),('experiencias','/experiencias'),
 ('giftcards','/gift-cards'),('estudio','/el-estudio'),('shop','/shop');
alter table public.public_section_routes enable row level security;
revoke all on public.public_section_routes from anon, authenticated;
grant select, insert, update, delete on public.public_section_routes to service_role;
create table public.menu_publication_history (
 id uuid primary key default gen_random_uuid(), menu_id uuid not null,
 created_at timestamptz not null default now(), actor text not null,
 before_state jsonb not null, publication jsonb not null
);
alter table public.menu_publication_history enable row level security;
revoke all on public.menu_publication_history from anon, authenticated;
grant select, insert on public.menu_publication_history to service_role;

create or replace function public.menu_publication_snapshot(p_menu_id uuid)
returns jsonb language plpgsql security invoker set search_path = public, pg_temp as $$
declare state jsonb; destinations jsonb := '[]'::jsonb; extra jsonb; entity text; prefix text;
begin
 foreach entity in array array['blog_posts','products','landing_pages'] loop
  if to_regclass('public.' || entity) is not null then
   prefix := case entity when 'blog_posts' then '/blog/' when 'products' then '/shop/' else '/landing/' end;
   execute format('select coalesce(jsonb_agg(%L || slug order by slug), %L::jsonb) from public.%I where status = %L and deleted_at is null', prefix, '[]', entity, 'published') into extra;
   destinations := destinations || extra;
  end if;
 end loop;
 select jsonb_build_object(
   'destinations', destinations,
   'menu', (select to_jsonb(m) from public.menus m where id=p_menu_id),
   'items', coalesce((select jsonb_agg(to_jsonb(i) order by i.id) from public.menu_items i where menu_id=p_menu_id),'[]'::jsonb),
   'offerings', coalesce((select jsonb_agg(to_jsonb(o) order by o.id) from public.offerings o),'[]'::jsonb),
   'routes', coalesce((select jsonb_agg(to_jsonb(r) order by r.key) from public.public_section_routes r),'[]'::jsonb),
   'redirects', coalesce((select jsonb_agg(to_jsonb(r) order by r.id) from public.redirects r),'[]'::jsonb),
   'visual', coalesce((select jsonb_agg(to_jsonb(s) order by s.id) from public.menu_visual_settings s),'[]'::jsonb)
 ) into state;
 return state || jsonb_build_object('revision',md5(state::text));
end $$;
revoke all on function public.menu_publication_snapshot(uuid) from public, anon, authenticated;
grant execute on function public.menu_publication_snapshot(uuid) to service_role;

create or replace function public.publish_menu_revision(
 p_menu_id uuid, p_revision text, p_plan jsonb, p_visual jsonb, p_actor text
) returns jsonb language plpgsql security invoker set search_path = public, pg_temp as $$
declare current_state jsonb; entry jsonb; menu_item jsonb;
begin
 -- Serialize against all writers, including legacy CMS endpoints.
 lock table public.menus, public.menu_items, public.offerings, public.redirects,
   public.public_section_routes, public.menu_visual_settings in share row exclusive mode;
 current_state := public.menu_publication_snapshot(p_menu_id);
 if current_state->'menu' = 'null'::jsonb then raise exception 'Menú no encontrado'; end if;
 if p_revision is distinct from current_state->>'revision' then
   raise exception 'El contenido cambió en otra sesión. Recarga el editor antes de publicar.' using errcode='40001';
 end if;
 if jsonb_typeof(p_plan->'items') is distinct from 'array' then raise exception 'Publicación no válida'; end if;
 insert into public.menu_publication_history(menu_id,actor,before_state,publication)
 values(p_menu_id,p_actor,current_state,p_plan);
 for entry in select value from jsonb_array_elements(p_plan->'offerings') loop
   update public.offerings set type=entry->>'type', slug=entry->>'slug',
     details=jsonb_set(coalesce(details,'{}'::jsonb),'{class}',
       coalesce(details->'class','{}'::jsonb) || jsonb_build_object('menuTitle',entry->>'menu_title')),
     updated_at=now()
   where id=(entry->>'id')::uuid and deleted_at is null;
   if not found then raise exception 'Página no encontrada'; end if;
 end loop;
 for entry in select value from jsonb_array_elements(p_plan->'routes') loop
   update public.public_section_routes set path=entry->>'path',
     aliases=array(select jsonb_array_elements_text(entry->'aliases')) where key=entry->>'key';
 end loop;
 for entry in select value from jsonb_array_elements(p_plan->'redirects') loop
   update public.redirects set target_url=entry->>'target_url',redirect_type='301',updated_at=now()
   where source_url=entry->>'source_url' and status='active' and deleted_at is null;
   if not found then
     insert into public.redirects(source_url,target_url,redirect_type,status,notes)
     values(entry->>'source_url',entry->>'target_url','301','active','Cambio de URL desde menú');
   end if;
 end loop;
 -- Keep stable IDs; detach before removing obsolete items to avoid FK side effects.
 update public.menu_items set parent_id=null where menu_id=p_menu_id;
 delete from public.menu_items where menu_id=p_menu_id and id not in
   (select (value->>'id')::uuid from jsonb_array_elements(p_plan->'items'));
 for menu_item in select value from jsonb_array_elements(p_plan->'items')
   order by (value->>'parent_id') nulls first loop
   insert into public.menu_items(id,menu_id,label,type,url,linked_entity_type,linked_entity_id,
      parent_id,sort_order,is_visible,open_in_new_tab,url_auto)
   values((menu_item->>'id')::uuid,p_menu_id,menu_item->>'label',menu_item->>'type',menu_item->>'url',
      menu_item->>'linked_entity_type',menu_item->>'linked_entity_id',null,
      (menu_item->>'sort_order')::integer,(menu_item->>'is_visible')::boolean,
      (menu_item->>'open_in_new_tab')::boolean,(menu_item->>'url_auto')::boolean)
   on conflict(id) do update set label=excluded.label,type=excluded.type,url=excluded.url,
      linked_entity_type=excluded.linked_entity_type,linked_entity_id=excluded.linked_entity_id,
      sort_order=excluded.sort_order,is_visible=excluded.is_visible,
      open_in_new_tab=excluded.open_in_new_tab,url_auto=excluded.url_auto,updated_at=now();
 end loop;
 for menu_item in select value from jsonb_array_elements(p_plan->'items') loop
   update public.menu_items set parent_id=(menu_item->>'parent_id')::uuid
   where id=(menu_item->>'id')::uuid and menu_id=p_menu_id;
 end loop;
 if p_visual is not null then
   insert into public.menu_visual_settings(key,header_logo_url,scroll_menu_background_color,
     scroll_menu_text_color,scroll_menu_icon_color,scroll_menu_logo_tint_enabled,scroll_menu_logo_tint_color)
   values('default',p_visual->>'header_logo_url',p_visual->>'scroll_menu_background_color',
     p_visual->>'scroll_menu_text_color',p_visual->>'scroll_menu_icon_color',
     (p_visual->>'scroll_menu_logo_tint_enabled')::boolean,p_visual->>'scroll_menu_logo_tint_color')
   on conflict(key) do update set header_logo_url=excluded.header_logo_url,
     scroll_menu_background_color=excluded.scroll_menu_background_color,
     scroll_menu_text_color=excluded.scroll_menu_text_color,scroll_menu_icon_color=excluded.scroll_menu_icon_color,
     scroll_menu_logo_tint_enabled=excluded.scroll_menu_logo_tint_enabled,
     scroll_menu_logo_tint_color=excluded.scroll_menu_logo_tint_color,updated_at=now();
 end if;
 update public.menus set updated_at=now() where id=p_menu_id;
 return public.menu_publication_snapshot(p_menu_id);
end $$;
revoke all on function public.publish_menu_revision(uuid,text,jsonb,jsonb,text) from public, anon, authenticated;
grant execute on function public.publish_menu_revision(uuid,text,jsonb,jsonb,text) to service_role;
