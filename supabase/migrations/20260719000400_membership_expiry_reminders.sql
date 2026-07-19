-- Membership expiry reminder outbox, one-time cron tokens and scheduled runner.
create extension if not exists pg_cron;
create extension if not exists pg_net;

create table public.membership_expiry_reminder_deliveries(
  id uuid primary key default gen_random_uuid(),
  entitlement_type text not null check(entitlement_type in('family_subscription','teacher_access')),
  entitlement_id uuid not null,
  recipient_user_id uuid not null references auth.users(id) on delete restrict,
  reminder_kind text not null check(reminder_kind in('days_7','days_1')),
  entitlement_ends_at timestamptz not null,
  plan_code text not null,
  plan_name text not null,
  status text not null default 'pending' check(status in('pending','processing','sent','failed','skipped')),
  attempt_count integer not null default 0 check(attempt_count>=0),
  processing_started_at timestamptz,
  provider_message_id text,
  last_error text check(last_error is null or char_length(last_error)<=500),
  skip_reason text check(skip_reason is null or char_length(skip_reason)<=500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  sent_at timestamptz,
  skipped_at timestamptz,
  unique(entitlement_type,recipient_user_id,reminder_kind,entitlement_ends_at),
  check((status='sent' and sent_at is not null and nullif(btrim(provider_message_id),'') is not null)
    or (status<>'sent' and sent_at is null)),
  check((status='skipped' and skipped_at is not null and nullif(btrim(skip_reason),'') is not null)
    or (status<>'skipped' and skipped_at is null)),
  check((status='processing' and processing_started_at is not null)
    or (status<>'processing' and processing_started_at is null)),
  check(not(sent_at is not null and skipped_at is not null))
);
create index membership_reminders_status_created_idx on public.membership_expiry_reminder_deliveries(status,created_at);
create index membership_reminders_recipient_created_idx on public.membership_expiry_reminder_deliveries(recipient_user_id,created_at desc);
create index membership_reminders_ends_idx on public.membership_expiry_reminder_deliveries(entitlement_ends_at);
create index membership_reminders_entitlement_idx on public.membership_expiry_reminder_deliveries(entitlement_type,entitlement_id);
alter table public.membership_expiry_reminder_deliveries enable row level security;
revoke all on table public.membership_expiry_reminder_deliveries from public,anon,authenticated,service_role;
grant select,update on table public.membership_expiry_reminder_deliveries to service_role;

create table public.membership_reminder_job_tokens(
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  used_at timestamptz,
  net_request_id bigint,
  check(expires_at>created_at),
  check(used_at is null or used_at>=created_at)
);
create index membership_reminder_tokens_expires_idx on public.membership_reminder_job_tokens(expires_at);
create index membership_reminder_tokens_used_idx on public.membership_reminder_job_tokens(used_at);
alter table public.membership_reminder_job_tokens enable row level security;
revoke all on table public.membership_reminder_job_tokens from public,anon,authenticated,service_role;

create function public.enqueue_membership_expiry_reminders(p_now timestamptz default now())
returns jsonb language plpgsql security invoker set search_path='' as $$
declare v_family integer:=0;v_teacher integer:=0;
begin
  with current_subscriptions as(
    select distinct on(s.user_id) s.id,s.user_id,s.ends_at,p.code,p.name
    from public.subscriptions s join public.plans p on p.id=s.plan_id
    where s.status='active' and s.ends_at is not null and s.ends_at>p_now
      and p.code not in('FREE_STARTER','TEACHER_MONTHLY')
    order by s.user_id,s.ends_at desc,s.created_at desc,s.id desc
  ), inserted as(
    insert into public.membership_expiry_reminder_deliveries(
      entitlement_type,entitlement_id,recipient_user_id,reminder_kind,entitlement_ends_at,plan_code,plan_name)
    select 'family_subscription',s.id,s.user_id,
      case ((s.ends_at at time zone 'Europe/Istanbul')::date-(p_now at time zone 'Europe/Istanbul')::date)
        when 7 then 'days_7' when 1 then 'days_1' end,
      s.ends_at,s.code,s.name
    from current_subscriptions s
    where ((s.ends_at at time zone 'Europe/Istanbul')::date-(p_now at time zone 'Europe/Istanbul')::date) in(7,1)
    on conflict(entitlement_type,recipient_user_id,reminder_kind,entitlement_ends_at) do nothing returning 1
  ) select count(*)::integer into v_family from inserted;

  with teacher_plan as(select code,name from public.plans where code='TEACHER_MONTHLY' order by version desc,created_at desc limit 1),inserted as(
    insert into public.membership_expiry_reminder_deliveries(
      entitlement_type,entitlement_id,recipient_user_id,reminder_kind,entitlement_ends_at,plan_code,plan_name)
    select 'teacher_access',tp.id,tp.id,
      case ((pp.access_ends_at at time zone 'Europe/Istanbul')::date-(p_now at time zone 'Europe/Istanbul')::date)
        when 7 then 'days_7' when 1 then 'days_1' end,
      pp.access_ends_at,p.code,p.name
    from public.teacher_profiles tp join public.teacher_partner_profiles pp on pp.teacher_id=tp.id cross join teacher_plan p
    where tp.approval_status='approved' and pp.status='active' and pp.access_ends_at is not null and pp.access_ends_at>p_now
      and ((pp.access_ends_at at time zone 'Europe/Istanbul')::date-(p_now at time zone 'Europe/Istanbul')::date) in(7,1)
    on conflict(entitlement_type,recipient_user_id,reminder_kind,entitlement_ends_at) do nothing returning 1
  ) select count(*)::integer into v_teacher from inserted;
  return jsonb_build_object('family_inserted',v_family,'teacher_inserted',v_teacher,'total_inserted',v_family+v_teacher);
end $$;
revoke all on function public.enqueue_membership_expiry_reminders(timestamptz) from public,anon,authenticated,service_role;

create function public.service_claim_membership_reminder_job(p_job_token uuid,p_limit integer default 50)
returns table(id uuid,entitlement_type text,entitlement_id uuid,recipient_user_id uuid,reminder_kind text,
 entitlement_ends_at timestamptz,plan_code text,plan_name text,attempt_count integer)
language plpgsql security definer set search_path='' as $$
declare d public.membership_expiry_reminder_deliveries;r record;v_reason text;v_expected integer;
begin
  if coalesce(auth.jwt()->>'role','')<>'service_role' then raise exception 'service_role gerekli';end if;
  if p_limit<1 or p_limit>100 then raise exception 'Geçersiz limit';end if;
  update public.membership_reminder_job_tokens set used_at=now()
    where membership_reminder_job_tokens.id=p_job_token and used_at is null and expires_at>now()
    returning membership_reminder_job_tokens.id into r;
  if not found then raise exception 'Geçersiz veya kullanılmış iş tokenı';end if;
  for d in
    select x.* from public.membership_expiry_reminder_deliveries x
    where x.status='pending' or (x.status='failed' and x.attempt_count<3)
      or (x.status='processing' and x.processing_started_at<now()-interval '15 minutes' and x.attempt_count<3)
    order by case x.reminder_kind when 'days_1' then 1 else 2 end,x.created_at,x.id
    for update skip locked limit p_limit
  loop
    v_reason:=null;v_expected:=case d.reminder_kind when 'days_7' then 7 else 1 end;
    if d.entitlement_type='family_subscription' then
      select s.id,s.ends_at into r from public.subscriptions s
      where s.user_id=d.recipient_user_id and s.status='active' and s.ends_at>now()
      order by s.ends_at desc,s.created_at desc,s.id desc limit 1;
      if not found then v_reason:='entitlement_inactive';
      elsif r.id<>d.entitlement_id or r.ends_at<>d.entitlement_ends_at then v_reason:='entitlement_changed';
      elsif ((r.ends_at at time zone 'Europe/Istanbul')::date-(now() at time zone 'Europe/Istanbul')::date)<>v_expected then v_reason:='reminder_window_expired';end if;
    else
      select tp.approval_status,pp.status,pp.access_ends_at into r from public.teacher_profiles tp
      left join public.teacher_partner_profiles pp on pp.teacher_id=tp.id where tp.id=d.entitlement_id;
      if not found or r.approval_status<>'approved' then v_reason:='teacher_not_approved';
      elsif r.status<>'active' then v_reason:='entitlement_inactive';
      elsif r.access_ends_at<>d.entitlement_ends_at then v_reason:='entitlement_changed';
      elsif ((r.access_ends_at at time zone 'Europe/Istanbul')::date-(now() at time zone 'Europe/Istanbul')::date)<>v_expected then v_reason:='reminder_window_expired';end if;
    end if;
    if v_reason is not null then
      update public.membership_expiry_reminder_deliveries set status='skipped',skipped_at=now(),skip_reason=v_reason,
        processing_started_at=null,last_error=null,updated_at=now() where membership_expiry_reminder_deliveries.id=d.id;
    else
      update public.membership_expiry_reminder_deliveries set status='processing',processing_started_at=now(),
        attempt_count=membership_expiry_reminder_deliveries.attempt_count+1,updated_at=now(),last_error=null,skip_reason=null,skipped_at=null
      where membership_expiry_reminder_deliveries.id=d.id returning * into d;
      return query select d.id,d.entitlement_type,d.entitlement_id,d.recipient_user_id,d.reminder_kind,
        d.entitlement_ends_at,d.plan_code,d.plan_name,d.attempt_count;
    end if;
  end loop;
end $$;
revoke all on function public.service_claim_membership_reminder_job(uuid,integer) from public,anon,authenticated,service_role;
grant execute on function public.service_claim_membership_reminder_job(uuid,integer) to service_role;

create function public.run_membership_expiry_reminder_job()
returns jsonb language plpgsql security invoker set search_path='' as $$
declare v_enqueue jsonb;v_token uuid;v_request_id bigint;
begin
  v_enqueue:=public.enqueue_membership_expiry_reminders(now());
  delete from public.membership_reminder_job_tokens where created_at<now()-interval '7 days';
  insert into public.membership_reminder_job_tokens(expires_at) values(now()+interval '15 minutes') returning id into v_token;
  select net.http_post(
    url:='https://gzsrcjovhhlfpvvpucri.supabase.co/functions/v1/send-membership-expiry-reminders',
    headers:='{"Content-Type":"application/json"}'::jsonb,
    body:=jsonb_build_object('job_token',v_token)
  ) into v_request_id;
  update public.membership_reminder_job_tokens set net_request_id=v_request_id where id=v_token;
  return v_enqueue||jsonb_build_object('request_queued',v_request_id is not null);
end $$;
revoke all on function public.run_membership_expiry_reminder_job() from public,anon,authenticated,service_role;

create or replace function public.service_cleanup_partner_e2e_run(p_run_id text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_user_ids uuid[]:='{}'::uuid[];v_teacher_ids uuid[]:='{}'::uuid[];v_payment_ids uuid[]:='{}'::uuid[];v_payout_ids uuid[]:='{}'::uuid[];
 v_user_count integer:=0;v_audit_deleted integer:=0;v_audit_remaining integer:=0;v_email_deleted integer:=0;v_email_remaining integer:=0;
 v_reminder_deleted integer:=0;v_reminder_remaining integer:=0;v_result jsonb;
begin
 if coalesce(auth.jwt()->>'role','')<>'service_role' then raise exception 'service_role gerekli';end if;
 if p_run_id is null or p_run_id!~'^poma-e2e-[0-9]{8}-[0-9]{6}-[0-9a-f]{8}$' then raise exception 'Geçersiz E2E run ID';end if;
 select coalesce(array_agg(u.id order by u.id),'{}'::uuid[]),count(*)::integer into v_user_ids,v_user_count from auth.users u where u.raw_user_meta_data->>'e2e_run_id'=p_run_id;
 if v_user_count>3 then raise exception 'E2E kullanıcı sınırı aşıldı';end if;
 if exists(select 1 from auth.users u where u.id=any(v_user_ids) and lower(coalesce(u.email,''))!~('^e2e-(admin|teacher|parent)\+'||p_run_id||'@e2e\.invalid$')) then raise exception 'E2E test domain doğrulaması başarısız';end if;
 select coalesce(array_agg(t.id),'{}'::uuid[]) into v_teacher_ids from public.teacher_profiles t where t.id=any(v_user_ids);
 select coalesce(array_agg(p.id),'{}'::uuid[]) into v_payment_ids from public.payment_requests p where p.user_id=any(v_user_ids) or p.partner_teacher_id=any(v_teacher_ids);
 select coalesce(array_agg(p.id),'{}'::uuid[]) into v_payout_ids from public.teacher_commission_payouts p where p.teacher_id=any(v_teacher_ids) or p.created_by=any(v_user_ids);
 delete from public.membership_expiry_reminder_deliveries d where d.recipient_user_id=any(v_user_ids);get diagnostics v_reminder_deleted=row_count;
 delete from public.payment_email_deliveries d where d.payment_request_id=any(v_payment_ids);get diagnostics v_email_deleted=row_count;
 delete from public.admin_audit_log a where (a.entity_type in('teacher_profile','teacher_partner_profile') and a.entity_id=any(v_teacher_ids))
  or (a.entity_type='payment_request' and a.entity_id=any(v_payment_ids)) or (a.entity_type='commission_payout' and a.entity_id=any(v_payout_ids));
 get diagnostics v_audit_deleted=row_count;
 v_result:=public.service_cleanup_partner_e2e_run_base(p_run_id);
 select count(*)::integer into v_reminder_remaining from public.membership_expiry_reminder_deliveries d where d.recipient_user_id=any(v_user_ids);
 select count(*)::integer into v_email_remaining from public.payment_email_deliveries d where d.payment_request_id=any(v_payment_ids);
 select count(*)::integer into v_audit_remaining from public.admin_audit_log a where (a.entity_type in('teacher_profile','teacher_partner_profile') and a.entity_id=any(v_teacher_ids))
  or (a.entity_type='payment_request' and a.entity_id=any(v_payment_ids)) or (a.entity_type='commission_payout' and a.entity_id=any(v_payout_ids));
 return jsonb_set(jsonb_set(jsonb_set(jsonb_set(jsonb_set(jsonb_set(jsonb_set(v_result,
  '{deleted,admin_audit_log}',to_jsonb(v_audit_deleted),true),'{admin_audit_log_remaining}',to_jsonb(v_audit_remaining),true),
  '{payment_email_deliveries_deleted}',to_jsonb(v_email_deleted),true),'{payment_email_deliveries_remaining}',to_jsonb(v_email_remaining),true),
  '{membership_reminders_deleted}',to_jsonb(v_reminder_deleted),true),'{membership_reminders_remaining}',to_jsonb(v_reminder_remaining),true),
  '{remaining_total}',to_jsonb(coalesce((v_result->>'remaining_total')::integer,0)+v_audit_remaining+v_email_remaining+v_reminder_remaining),true);
end $$;
revoke all on function public.service_cleanup_partner_e2e_run(text) from public,anon,authenticated,service_role;
grant execute on function public.service_cleanup_partner_e2e_run(text) to service_role;

do $$declare v_job_id bigint;begin
  for v_job_id in select jobid from cron.job where jobname='membership-expiry-reminders-v1' loop perform cron.unschedule(v_job_id);end loop;
  perform cron.schedule('membership-expiry-reminders-v1','5 6,12 * * *','select public.run_membership_expiry_reminder_job();');
end $$;
