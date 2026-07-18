create or replace function public.code_attempt_assert_not_blocked(p_actor_id uuid, p_action text)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if p_actor_id is null or p_action not in ('student_link', 'class_join') then
    raise exception 'Invalid rate-limit context';
  end if;
  if exists (
    select 1
    from public.code_attempt_limits l
    where l.actor_id = p_actor_id
      and l.action = p_action
      and l.blocked_until > now()
  ) then
    raise exception '%', U&'\00C7ok fazla hatal\0131 kod denemesi yapt\0131n\0131z. 15 dakika sonra tekrar deneyin.';
  end if;
end
$$;

alter function public.code_attempt_assert_not_blocked(uuid,text) owner to postgres;
revoke all on function public.code_attempt_assert_not_blocked(uuid,text)
from public, anon, authenticated, service_role;
