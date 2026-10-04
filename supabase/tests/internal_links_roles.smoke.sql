-- Run after secure_internal_links. The fixture and all writes are rolled back.
begin;
set local statement_timeout = '30s';

do $test$
declare
  role_name text;
  privilege_name text;
begin
  foreach role_name in array array['anon', 'authenticated'] loop
    foreach privilege_name in array array[
      'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER'
    ] loop
      if has_table_privilege(role_name, 'public.internal_links', privilege_name) then
        raise exception '% unexpectedly has % on internal_links', role_name, privilege_name;
      end if;
    end loop;
  end loop;

  if not (select relrowsecurity from pg_class where oid = 'public.internal_links'::regclass) then
    raise exception 'RLS must remain enabled';
  end if;
  if exists (
    select 1 from pg_policies where schemaname = 'public'
      and tablename = 'internal_links' and policyname = 'authenticated_all_internal_links'
  ) then
    raise exception 'The broad authenticated policy still exists';
  end if;
end
$test$;

set local role anon;
do $test$
begin
  begin
    perform count(*) from public.internal_links;
    raise exception 'anon read unexpectedly allowed';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.internal_links set label = label where false;
    raise exception 'anon write unexpectedly allowed';
  exception when insufficient_privilege then null;
  end;
end
$test$;

reset role;
set local role authenticated;
do $test$
begin
  begin
    perform count(*) from public.internal_links;
    raise exception 'authenticated read unexpectedly allowed';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.internal_links set label = label where false;
    raise exception 'authenticated write unexpectedly allowed';
  exception when insufficient_privilege then null;
  end;
end
$test$;

reset role;
set local role service_role;
do $test$
declare
  fixture_id uuid := gen_random_uuid();
begin
  insert into public.internal_links(id, label, url)
    values (fixture_id, 'Internal links permission test', 'https://example.com');
  if not exists (select 1 from public.internal_links where id = fixture_id) then
    raise exception 'service_role cannot read its fixture';
  end if;
  update public.internal_links set label = 'Updated permission test' where id = fixture_id;
  if not exists (
    select 1 from public.internal_links where id = fixture_id and label = 'Updated permission test'
  ) then
    raise exception 'service_role cannot update its fixture';
  end if;
  delete from public.internal_links where id = fixture_id;
  if exists (select 1 from public.internal_links where id = fixture_id) then
    raise exception 'service_role cannot delete its fixture';
  end if;
end
$test$;

reset role;
select 'PASS: browser access denied; service_role CRUD works' as result;
rollback;
