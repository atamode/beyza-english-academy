create table public.code_attempt_limits (
  actor_id uuid not null references auth.users(id) on delete cascade,
  action text not null check (action in ('student_link', 'class_join')),
  window_started_at timestamptz not null,
  failed_count smallint not null check (failed_count >= 0),
  blocked_until timestamptz null,
  updated_at timestamptz not null,
  primary key (actor_id, action)
);

alter table public.code_attempt_limits enable row level security;
revoke all on table public.code_attempt_limits from public, anon, authenticated, service_role;

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
    select 1 from public.code_attempt_limits l
    where l.actor_id = p_actor_id
      and l.action = p_action
      and l.blocked_until > now()
  ) then
    raise exception '%', U&'\00C7ok fazla hatal\0131 kod denemesi yapt\0131n\0131z. 15 dakika sonra tekrar deneyin.';
  end if;
end
$$;

create or replace function public.code_attempt_record_failure(p_actor_id uuid, p_action text)
returns smallint
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_failed_count smallint;
begin
  if p_actor_id is null or p_action not in ('student_link', 'class_join') then
    raise exception 'Geçersiz rate-limit bağlamı';
  end if;
  insert into public.code_attempt_limits(
    actor_id, action, window_started_at, failed_count, blocked_until, updated_at
  ) values (
    p_actor_id, p_action, now(), 1, null, now()
  )
  on conflict (actor_id, action) do update
  set window_started_at = case
        when code_attempt_limits.window_started_at <= now() - interval '15 minutes' then now()
        else code_attempt_limits.window_started_at
      end,
      failed_count = case
        when code_attempt_limits.window_started_at <= now() - interval '15 minutes' then 1
        else (code_attempt_limits.failed_count + 1)::smallint
      end,
      blocked_until = case
        when code_attempt_limits.window_started_at <= now() - interval '15 minutes' then null
        when code_attempt_limits.failed_count + 1 >= 5 then now() + interval '15 minutes'
        else code_attempt_limits.blocked_until
      end,
      updated_at = now()
  returning failed_count into v_failed_count;
  return v_failed_count;
end
$$;

create or replace function public.code_attempt_clear(p_actor_id uuid, p_action text)
returns void
language sql
security invoker
set search_path = ''
as $$
  delete from public.code_attempt_limits
  where actor_id = p_actor_id and action = p_action;
$$;

alter function public.code_attempt_assert_not_blocked(uuid,text) owner to postgres;
alter function public.code_attempt_record_failure(uuid,text) owner to postgres;
alter function public.code_attempt_clear(uuid,text) owner to postgres;
revoke all on function public.code_attempt_assert_not_blocked(uuid,text),
  public.code_attempt_record_failure(uuid,text),
  public.code_attempt_clear(uuid,text)
from public, anon, authenticated, service_role;

create or replace function public.link_guardian_by_student_code(
  p_student_code text,
  p_relationship text default 'guardian'
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid := (select auth.uid());
  v_child_id uuid;
  v_caller_type text;
  v_normalized_code text;
begin
  if v_actor_id is null then
    raise exception 'Oturum gerekli';
  end if;
  select p.account_type into v_caller_type
  from public.parent_profiles p
  where p.id = v_actor_id;
  if v_caller_type not in ('parent', 'both') then
    raise exception 'Bu işlem yalnız veli hesabıyla yapılabilir.';
  end if;

  perform public.code_attempt_assert_not_blocked(v_actor_id, 'student_link');
  v_normalized_code := upper(btrim(coalesce(p_student_code, '')));
  select c.id into v_child_id
  from public.children c
  where c.student_code = v_normalized_code and c.is_active = true;
  if v_child_id is null then
    perform public.code_attempt_record_failure(v_actor_id, 'student_link');
    return null;
  end if;

  insert into public.guardian_students(guardian_id, child_id, relationship, is_primary)
  values (v_actor_id, v_child_id, coalesce(nullif(btrim(p_relationship), ''), 'guardian'), false)
  on conflict (guardian_id, child_id) do nothing;
  perform public.code_attempt_clear(v_actor_id, 'student_link');
  return v_child_id;
end
$$;

create or replace function public.join_class_by_code(p_child_id uuid, p_join_code text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid := (select auth.uid());
  v_class_id uuid;
  v_normalized_code text;
begin
  if v_actor_id is null or not public.can_manage_child(p_child_id) then
    raise exception 'Bu öğrenci profili üzerinde yetkiniz yok.';
  end if;

  perform public.code_attempt_assert_not_blocked(v_actor_id, 'class_join');
  v_normalized_code := upper(btrim(coalesce(p_join_code, '')));
  select c.id into v_class_id
  from public.classes c
  join public.teacher_profiles tp on tp.id = c.teacher_id
  where c.join_code = v_normalized_code
    and c.is_active = true
    and tp.approval_status = 'approved';
  if v_class_id is null then
    perform public.code_attempt_record_failure(v_actor_id, 'class_join');
    return null;
  end if;

  insert into public.class_students(class_id, child_id)
  values (v_class_id, p_child_id)
  on conflict (class_id, child_id) do nothing;
  perform public.code_attempt_clear(v_actor_id, 'class_join');
  return v_class_id;
end
$$;

revoke all on function public.link_guardian_by_student_code(text,text),
  public.join_class_by_code(uuid,text)
from public, anon, authenticated, service_role;
grant execute on function public.link_guardian_by_student_code(text,text),
  public.join_class_by_code(uuid,text)
to authenticated;

create or replace function public.service_cleanup_partner_e2e_run(p_run_id text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_ids uuid[] := '{}'::uuid[];
  v_teacher_ids uuid[] := '{}'::uuid[];
  v_payment_ids uuid[] := '{}'::uuid[];
  v_class_ids uuid[] := '{}'::uuid[];
  v_child_ids uuid[] := '{}'::uuid[];
  v_user_count integer := 0;
  v_count integer := 0;
  v_remaining integer := 0;
  v_rate_limit_remaining integer := 0;
  v_deleted jsonb := '{}'::jsonb;
begin
  if coalesce(auth.jwt() ->> 'role', '') <> 'service_role' then
    raise exception 'service_role gerekli';
  end if;
  if p_run_id is null or p_run_id !~ '^poma-e2e-[0-9]{8}-[0-9]{6}-[0-9a-f]{8}$' then
    raise exception 'Geçersiz E2E run ID';
  end if;

  select coalesce(array_agg(u.id order by u.id), '{}'::uuid[]), count(*)::integer
  into v_user_ids, v_user_count
  from auth.users u
  where u.raw_user_meta_data ->> 'e2e_run_id' = p_run_id;
  if v_user_count > 3 then raise exception 'E2E kullanıcı sınırı aşıldı'; end if;
  if exists (
    select 1 from auth.users u
    where u.id = any(v_user_ids)
      and lower(coalesce(u.email, '')) !~ ('^e2e-(admin|teacher|parent)\+' || p_run_id || '@e2e\.invalid$')
  ) then
    raise exception 'E2E test domain doğrulaması başarısız';
  end if;

  select coalesce(array_agg(t.id), '{}'::uuid[]) into v_teacher_ids
  from public.teacher_profiles t where t.id = any(v_user_ids);
  select coalesce(array_agg(p.id), '{}'::uuid[]) into v_payment_ids
  from public.payment_requests p
  where p.user_id = any(v_user_ids) or p.partner_teacher_id = any(v_teacher_ids);
  select coalesce(array_agg(c.id), '{}'::uuid[]) into v_class_ids
  from public.classes c where c.teacher_id = any(v_teacher_ids);
  select coalesce(array_agg(c.id), '{}'::uuid[]) into v_child_ids
  from public.children c
  where c.parent_id = any(v_user_ids) or c.auth_user_id = any(v_user_ids);

  delete from public.code_attempt_limits l where l.actor_id = any(v_user_ids);
  get diagnostics v_count = row_count;
  v_deleted := v_deleted || jsonb_build_object('code_attempt_limits', v_count);
  delete from public.teacher_partner_audit a where a.teacher_id = any(v_teacher_ids) or a.actor_user_id = any(v_user_ids);
  get diagnostics v_count = row_count; v_deleted := v_deleted || jsonb_build_object('teacher_partner_audit', v_count);
  delete from public.teacher_commission_earnings e where e.teacher_id = any(v_teacher_ids) or e.referred_user_id = any(v_user_ids) or e.payment_request_id = any(v_payment_ids);
  get diagnostics v_count = row_count; v_deleted := v_deleted || jsonb_build_object('teacher_commission_earnings', v_count);
  delete from public.teacher_commission_payouts p where p.teacher_id = any(v_teacher_ids) or p.created_by = any(v_user_ids);
  get diagnostics v_count = row_count; v_deleted := v_deleted || jsonb_build_object('teacher_commission_payouts', v_count);
  delete from public.teacher_access_credits c where c.teacher_id = any(v_teacher_ids) or c.referred_user_id = any(v_user_ids) or c.source_payment_request_id = any(v_payment_ids);
  get diagnostics v_count = row_count; v_deleted := v_deleted || jsonb_build_object('teacher_access_credits', v_count);
  delete from public.teacher_referrals r where r.teacher_id = any(v_teacher_ids) or r.referred_user_id = any(v_user_ids) or r.first_payment_request_id = any(v_payment_ids);
  get diagnostics v_count = row_count; v_deleted := v_deleted || jsonb_build_object('teacher_referrals', v_count);
  delete from public.coupon_redemptions r where r.user_id = any(v_user_ids) or r.payment_request_id = any(v_payment_ids);
  get diagnostics v_count = row_count; v_deleted := v_deleted || jsonb_build_object('coupon_redemptions', v_count);
  delete from public.payment_receipts r where r.payment_request_id = any(v_payment_ids) or r.uploaded_by = any(v_user_ids);
  get diagnostics v_count = row_count; v_deleted := v_deleted || jsonb_build_object('payment_receipts', v_count);
  delete from public.subscriptions s where s.user_id = any(v_user_ids) or s.source_payment_request_id = any(v_payment_ids);
  get diagnostics v_count = row_count; v_deleted := v_deleted || jsonb_build_object('subscriptions', v_count);
  delete from public.payment_requests p where p.id = any(v_payment_ids);
  get diagnostics v_count = row_count; v_deleted := v_deleted || jsonb_build_object('payment_requests', v_count);
  delete from public.learning_report_snapshots r where r.parent_user_id = any(v_user_ids) or r.child_id = any(v_child_ids);
  get diagnostics v_count = row_count; v_deleted := v_deleted || jsonb_build_object('learning_report_snapshots', v_count);
  delete from public.teacher_notes n where n.teacher_id = any(v_teacher_ids) or n.child_id = any(v_child_ids);
  get diagnostics v_count = row_count; v_deleted := v_deleted || jsonb_build_object('teacher_notes', v_count);
  delete from public.assignments a where a.class_id = any(v_class_ids);
  get diagnostics v_count = row_count; v_deleted := v_deleted || jsonb_build_object('assignments', v_count);
  delete from public.class_students cs where cs.class_id = any(v_class_ids) or cs.child_id = any(v_child_ids);
  get diagnostics v_count = row_count; v_deleted := v_deleted || jsonb_build_object('class_students', v_count);
  delete from public.classes c where c.id = any(v_class_ids);
  get diagnostics v_count = row_count; v_deleted := v_deleted || jsonb_build_object('classes', v_count);
  delete from public.guardian_students g where g.guardian_id = any(v_user_ids) or g.child_id = any(v_child_ids);
  get diagnostics v_count = row_count; v_deleted := v_deleted || jsonb_build_object('guardian_students', v_count);
  delete from public.student_state s where s.child_id = any(v_child_ids);
  get diagnostics v_count = row_count; v_deleted := v_deleted || jsonb_build_object('student_state', v_count);
  delete from public.student_access s where s.child_id = any(v_child_ids);
  get diagnostics v_count = row_count; v_deleted := v_deleted || jsonb_build_object('student_access', v_count);
  delete from public.children c where c.id = any(v_child_ids);
  get diagnostics v_count = row_count; v_deleted := v_deleted || jsonb_build_object('children', v_count);
  delete from public.teacher_partner_profiles p where p.teacher_id = any(v_teacher_ids);
  get diagnostics v_count = row_count; v_deleted := v_deleted || jsonb_build_object('teacher_partner_profiles', v_count);
  delete from public.teacher_profiles t where t.id = any(v_teacher_ids);
  get diagnostics v_count = row_count; v_deleted := v_deleted || jsonb_build_object('teacher_profiles', v_count);
  delete from public.parent_profiles p where p.id = any(v_user_ids);
  get diagnostics v_count = row_count; v_deleted := v_deleted || jsonb_build_object('parent_profiles', v_count);

  select count(*)::integer into v_rate_limit_remaining
  from public.code_attempt_limits l where l.actor_id = any(v_user_ids);
  select
    v_rate_limit_remaining +
    (select count(*) from public.parent_profiles p where p.id = any(v_user_ids)) +
    (select count(*) from public.teacher_profiles t where t.id = any(v_teacher_ids)) +
    (select count(*) from public.teacher_partner_profiles p where p.teacher_id = any(v_teacher_ids)) +
    (select count(*) from public.payment_requests p where p.id = any(v_payment_ids)) +
    (select count(*) from public.subscriptions s where s.user_id = any(v_user_ids) or s.source_payment_request_id = any(v_payment_ids)) +
    (select count(*) from public.teacher_referrals r where r.teacher_id = any(v_teacher_ids) or r.referred_user_id = any(v_user_ids)) +
    (select count(*) from public.teacher_access_credits c where c.teacher_id = any(v_teacher_ids) or c.referred_user_id = any(v_user_ids)) +
    (select count(*) from public.teacher_commission_earnings e where e.teacher_id = any(v_teacher_ids) or e.referred_user_id = any(v_user_ids)) +
    (select count(*) from public.teacher_commission_payouts p where p.teacher_id = any(v_teacher_ids) or p.created_by = any(v_user_ids)) +
    (select count(*) from public.teacher_partner_audit a where a.teacher_id = any(v_teacher_ids) or a.actor_user_id = any(v_user_ids)) +
    (select count(*) from public.classes c where c.id = any(v_class_ids)) +
    (select count(*) from public.children c where c.id = any(v_child_ids))
  into v_remaining;

  return jsonb_build_object(
    'run_id', p_run_id,
    'matched_auth_users', v_user_count,
    'deleted', v_deleted,
    'rate_limit_remaining', v_rate_limit_remaining,
    'remaining_total', v_remaining
  );
end
$$;

revoke all on function public.service_cleanup_partner_e2e_run(text)
from public, anon, authenticated, service_role;
grant execute on function public.service_cleanup_partner_e2e_run(text) to service_role;
