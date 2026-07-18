-- Complete teacher approval and provide a narrowly scoped live E2E cleanup path.

create or replace function public.admin_set_teacher_approval(
  p_teacher_id uuid,
  p_status text,
  p_admin_note text default null
)
returns public.teacher_profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_old public.teacher_profiles;
  v_result public.teacher_profiles;
  v_note text := nullif(btrim(p_admin_note), '');
begin
  if (select auth.uid()) is null then
    raise exception 'Oturum gerekli';
  end if;
  if not public.is_poma_admin() then
    raise exception 'Yönetici yetkisi gerekli';
  end if;
  if p_status is null or p_status not in ('pending', 'approved', 'rejected', 'suspended') then
    raise exception 'Geçersiz öğretmen onay durumu';
  end if;
  if p_status in ('rejected', 'suspended') and v_note is null then
    raise exception 'Reddetme veya askıya alma notu gerekli';
  end if;

  select * into v_old
  from public.teacher_profiles
  where id = p_teacher_id
  for update;
  if not found then
    raise exception 'Öğretmen profili bulunamadı';
  end if;

  update public.teacher_profiles
  set approval_status = p_status,
      approved_at = case
        when p_status = 'approved' then now()
        when p_status in ('pending', 'rejected') then null
        else approved_at
      end,
      approved_by = case
        when p_status = 'approved' then (select auth.uid())
        when p_status in ('pending', 'rejected') then null
        else approved_by
      end,
      updated_at = now()
  where id = p_teacher_id
  returning * into v_result;

  insert into public.teacher_partner_audit(
    teacher_id, actor_user_id, action, entity_type, entity_id, old_values, new_values
  ) values (
    p_teacher_id, (select auth.uid()), 'teacher_approval_changed', 'teacher_profile', p_teacher_id,
    to_jsonb(v_old), to_jsonb(v_result) || jsonb_build_object('admin_note', v_note)
  );
  return v_result;
end
$$;

create or replace function public.list_admin_teacher_profiles(p_status text default null)
returns table(
  teacher_id uuid,
  display_name text,
  school_name text,
  approval_status text,
  created_at timestamptz,
  approved_at timestamptz,
  approved_by uuid
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'Oturum gerekli';
  end if;
  if not public.is_poma_admin() then
    raise exception 'Yönetici yetkisi gerekli';
  end if;
  if p_status is not null and p_status not in ('pending', 'approved', 'rejected', 'suspended') then
    raise exception 'Geçersiz öğretmen onay durumu';
  end if;
  return query
    select t.id, t.display_name, t.school_name, t.approval_status,
           t.created_at, t.approved_at, t.approved_by
    from public.teacher_profiles t
    where p_status is null or t.approval_status = p_status
    order by t.created_at desc, t.id;
end
$$;

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

  if v_user_count > 3 then
    raise exception 'E2E kullanıcı sınırı aşıldı';
  end if;
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

  delete from public.teacher_partner_audit a
  where a.teacher_id = any(v_teacher_ids) or a.actor_user_id = any(v_user_ids);
  get diagnostics v_count = row_count; v_deleted := v_deleted || jsonb_build_object('teacher_partner_audit', v_count);

  delete from public.teacher_commission_earnings e
  where e.teacher_id = any(v_teacher_ids) or e.referred_user_id = any(v_user_ids)
     or e.payment_request_id = any(v_payment_ids);
  get diagnostics v_count = row_count; v_deleted := v_deleted || jsonb_build_object('teacher_commission_earnings', v_count);

  delete from public.teacher_commission_payouts p
  where p.teacher_id = any(v_teacher_ids) or p.created_by = any(v_user_ids);
  get diagnostics v_count = row_count; v_deleted := v_deleted || jsonb_build_object('teacher_commission_payouts', v_count);

  delete from public.teacher_access_credits c
  where c.teacher_id = any(v_teacher_ids) or c.referred_user_id = any(v_user_ids)
     or c.source_payment_request_id = any(v_payment_ids);
  get diagnostics v_count = row_count; v_deleted := v_deleted || jsonb_build_object('teacher_access_credits', v_count);

  delete from public.teacher_referrals r
  where r.teacher_id = any(v_teacher_ids) or r.referred_user_id = any(v_user_ids)
     or r.first_payment_request_id = any(v_payment_ids);
  get diagnostics v_count = row_count; v_deleted := v_deleted || jsonb_build_object('teacher_referrals', v_count);

  delete from public.coupon_redemptions r
  where r.user_id = any(v_user_ids) or r.payment_request_id = any(v_payment_ids);
  get diagnostics v_count = row_count; v_deleted := v_deleted || jsonb_build_object('coupon_redemptions', v_count);

  delete from public.payment_receipts r
  where r.payment_request_id = any(v_payment_ids) or r.uploaded_by = any(v_user_ids);
  get diagnostics v_count = row_count; v_deleted := v_deleted || jsonb_build_object('payment_receipts', v_count);

  delete from public.subscriptions s
  where s.user_id = any(v_user_ids) or s.source_payment_request_id = any(v_payment_ids);
  get diagnostics v_count = row_count; v_deleted := v_deleted || jsonb_build_object('subscriptions', v_count);

  delete from public.payment_requests p where p.id = any(v_payment_ids);
  get diagnostics v_count = row_count; v_deleted := v_deleted || jsonb_build_object('payment_requests', v_count);

  delete from public.learning_report_snapshots r
  where r.parent_user_id = any(v_user_ids) or r.child_id = any(v_child_ids);
  get diagnostics v_count = row_count; v_deleted := v_deleted || jsonb_build_object('learning_report_snapshots', v_count);
  delete from public.teacher_notes n
  where n.teacher_id = any(v_teacher_ids) or n.child_id = any(v_child_ids);
  get diagnostics v_count = row_count; v_deleted := v_deleted || jsonb_build_object('teacher_notes', v_count);
  delete from public.assignments a where a.class_id = any(v_class_ids);
  get diagnostics v_count = row_count; v_deleted := v_deleted || jsonb_build_object('assignments', v_count);
  delete from public.class_students cs
  where cs.class_id = any(v_class_ids) or cs.child_id = any(v_child_ids);
  get diagnostics v_count = row_count; v_deleted := v_deleted || jsonb_build_object('class_students', v_count);
  delete from public.classes c where c.id = any(v_class_ids);
  get diagnostics v_count = row_count; v_deleted := v_deleted || jsonb_build_object('classes', v_count);
  delete from public.guardian_students g
  where g.guardian_id = any(v_user_ids) or g.child_id = any(v_child_ids);
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

  select
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
    'remaining_total', v_remaining
  );
end
$$;

revoke all on function public.admin_set_teacher_approval(uuid,text,text),
  public.list_admin_teacher_profiles(text)
from public, anon, authenticated;
grant execute on function public.admin_set_teacher_approval(uuid,text,text),
  public.list_admin_teacher_profiles(text)
to authenticated;

revoke all on function public.service_cleanup_partner_e2e_run(text)
from public, anon, authenticated, service_role;
grant execute on function public.service_cleanup_partner_e2e_run(text) to service_role;
