grant delete on table private.api_rate_limits to service_role;

create or replace function public.reset_api_rate_limit(
  p_route text,
  p_identifier_hash text
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_deleted_count integer;
begin
  if p_route is null or length(p_route) not between 1 and 100
    or p_identifier_hash is null or length(p_identifier_hash) <> 64 then
    raise exception 'Invalid rate limit parameters' using errcode = '22023';
  end if;

  delete from private.api_rate_limits
  where route = p_route
    and identifier_hash = p_identifier_hash;

  get diagnostics v_deleted_count = row_count;
  return v_deleted_count > 0;
end;
$$;

revoke all on function public.reset_api_rate_limit(text, text)
  from public, anon, authenticated;
grant execute on function public.reset_api_rate_limit(text, text)
  to service_role;
