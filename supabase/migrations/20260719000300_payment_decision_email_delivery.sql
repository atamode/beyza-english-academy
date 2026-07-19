create table public.payment_email_deliveries(
  id uuid primary key default gen_random_uuid(),
  payment_request_id uuid not null references public.payment_requests(id) on delete cascade,
  recipient_user_id uuid not null,
  decision text not null check(decision in('approved','rejected')),
  status text not null default 'pending' check(status in('pending','processing','sent','failed')),
  plan_code text not null,
  plan_name text not null,
  payment_code text not null,
  payable_amount numeric(12,2) not null check(payable_amount>=0),
  admin_note text null,
  membership_ends_at timestamptz null,
  attempt_count integer not null default 0 check(attempt_count>=0),
  processing_started_at timestamptz null,
  provider_message_id text null,
  last_error text null check(last_error is null or char_length(last_error)<=500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  sent_at timestamptz null,
  unique(payment_request_id,decision),
  check((status='sent' and sent_at is not null and nullif(btrim(provider_message_id),'') is not null)
    or (status<>'sent' and sent_at is null)),
  check((status='processing' and processing_started_at is not null)
    or (status<>'processing' and processing_started_at is null))
);

create index payment_email_deliveries_status_created_idx on public.payment_email_deliveries(status,created_at);
create index payment_email_deliveries_payment_request_idx on public.payment_email_deliveries(payment_request_id);
create index payment_email_deliveries_recipient_created_idx on public.payment_email_deliveries(recipient_user_id,created_at desc);

alter table public.payment_email_deliveries enable row level security;
revoke all on table public.payment_email_deliveries from public,anon,authenticated,service_role;
grant select,update on table public.payment_email_deliveries to service_role;

drop function public.list_admin_payments();
create function public.list_admin_payments()
returns table(
  id uuid,user_id uuid,user_email text,plan_code text,plan_name text,payment_code text,
  list_price numeric,discount_amount numeric,payable_amount numeric,payment_method text,
  instagram_username text,sender_name text,transfer_date date,status text,admin_note text,
  created_at timestamptz,reviewed_at timestamptz,expires_at timestamptz,expired_at timestamptz,
  current_subscription_ends_at timestamptz,receipts jsonb,
  email_delivery_id uuid,email_delivery_status text,email_attempt_count integer,
  email_sent_at timestamptz,email_last_error text
)
language plpgsql security definer set search_path=public as $$
begin
 if not public.is_poma_admin() then raise exception 'Yönetici yetkisi gerekli';end if;
 perform public.expire_stale_payment_requests(null);
 return query
 select pr.id,pr.user_id,u.email::text,p.code,p.name,pr.payment_code,pr.list_price,
  pr.discount_amount,pr.payable_amount,pr.payment_method,pr.instagram_username,
  pr.sender_name,pr.transfer_date,pr.status,pr.admin_note,pr.created_at,pr.reviewed_at,
  pr.expires_at,pr.expired_at,
  (select max(s.ends_at) from public.subscriptions s where s.user_id=pr.user_id and s.status='active' and s.ends_at>now()),
  coalesce((select jsonb_agg(jsonb_build_object('id',r.id,'storage_path',r.storage_path,
   'original_filename',r.original_filename,'mime_type',r.mime_type,'size_bytes',r.size_bytes,
   'created_at',r.created_at) order by r.created_at desc)
   from public.payment_receipts r where r.payment_request_id=pr.id),'[]'::jsonb),
  d.id,d.status,d.attempt_count,d.sent_at,d.last_error
 from public.payment_requests pr
 join public.plans p on p.id=pr.plan_id
 join auth.users u on u.id=pr.user_id
 left join public.payment_email_deliveries d on d.payment_request_id=pr.id and d.decision=pr.status
 order by pr.created_at desc;
end $$;
revoke all on function public.list_admin_payments() from public,anon,authenticated,service_role;
grant execute on function public.list_admin_payments() to authenticated;

create or replace function public.review_payment(p_payment_request_id uuid,p_decision text,p_admin_note text default null)
returns public.payment_requests language plpgsql security definer set search_path=public as $$
declare r public.payment_requests;oldrow public.payment_requests;p public.plans;base timestamptz;finish timestamptz;grant_days int;grant_plan_id uuid;
 partner public.teacher_partner_profiles;ref public.teacher_referrals;credit_start timestamptz;credit_end timestamptz;
begin
 if not public.is_poma_admin() then raise exception 'Yönetici yetkisi gerekli';end if;
 if p_decision not in('approved','rejected') then raise exception 'Geçersiz karar';end if;
 if p_decision='rejected' and nullif(btrim(p_admin_note),'') is null then raise exception 'Red notu zorunlu';end if;
 perform public.expire_stale_payment_requests(null);
 select * into oldrow from public.payment_requests where id=p_payment_request_id for update;
 if not found then raise exception 'Ödeme daha önce incelendi veya bulunamadı';end if;
 if oldrow.status='expired' then raise exception 'Ödeme talebinin süresi dolmuş.';end if;
 if oldrow.status not in('pending','receipt_sent') then raise exception 'Ödeme daha önce incelendi veya bulunamadı';end if;
 select * into p from public.plans where id=oldrow.plan_id;
 if not found then raise exception 'Plan bulunamadı';end if;
 update public.payment_requests set status=p_decision,admin_note=nullif(btrim(p_admin_note),''),reviewed_at=now(),reviewed_by=auth.uid() where id=oldrow.id returning * into r;
 perform public.record_admin_audit(case when p_decision='approved' then 'payment_approved' else 'payment_rejected' end,'payment_request',r.id,
  jsonb_build_object('status',oldrow.status,'admin_note',oldrow.admin_note),
  jsonb_build_object('status',r.status,'reviewed_by',r.reviewed_by,'reviewed_at',r.reviewed_at,'admin_note',r.admin_note),
  jsonb_build_object('user_id',r.user_id,'plan_id',r.plan_id,'payable_amount',r.payable_amount,'payment_method',r.payment_method));
 if p_decision='rejected' then
  insert into public.payment_email_deliveries(payment_request_id,recipient_user_id,decision,plan_code,plan_name,payment_code,payable_amount,admin_note,membership_ends_at)
  values(r.id,r.user_id,'rejected',p.code,p.name,r.payment_code,r.payable_amount,r.admin_note,null)
  on conflict(payment_request_id,decision) do nothing;
  return r;
 end if;
 if p.code='TEACHER_MONTHLY' then
  select * into partner from public.teacher_partner_profiles where teacher_id=r.user_id for update;
  if not found then raise exception 'Öğretmen partner profili bulunamadı';end if;
  credit_start:=greatest(now(),coalesce(partner.access_ends_at,now()));credit_end:=credit_start+interval '30 days';
  update public.teacher_partner_profiles set access_ends_at=credit_end,updated_at=now() where teacher_id=r.user_id;
  insert into public.teacher_access_credits(teacher_id,source_payment_request_id,days,starts_at,ends_at,source_type)
  values(r.user_id,r.id,30,credit_start,credit_end,'teacher_purchase');
  insert into public.payment_email_deliveries(payment_request_id,recipient_user_id,decision,plan_code,plan_name,payment_code,payable_amount,admin_note,membership_ends_at)
  values(r.id,r.user_id,'approved',p.code,p.name,r.payment_code,r.payable_amount,r.admin_note,credit_end)
  on conflict(payment_request_id,decision) do nothing;
  return r;
 end if;
 select coalesce(max(ends_at),now()) into base from public.subscriptions where user_id=r.user_id and status='active' and ends_at>now();
 base:=greatest(base,now());grant_days:=p.duration_days;grant_plan_id:=p.id;
 select coalesce(c.grants_duration_days,gp.duration_days),gp.id into grant_days,grant_plan_id from public.coupon_redemptions cr
 join public.coupons c on c.id=cr.coupon_id left join public.plans gp on gp.code=c.grants_plan_code where cr.payment_request_id=r.id and c.discount_type='grant';
 if not found then grant_days:=p.duration_days;grant_plan_id:=p.id;end if;
 if p.code='FAMILY_YEARLY' and grant_plan_id=p.id then finish:=base+interval '12 months';else finish:=base+make_interval(days=>grant_days);end if;
 insert into public.subscriptions(user_id,plan_id,starts_at,ends_at,status,source_payment_request_id) values(r.user_id,grant_plan_id,now(),finish,'active',r.id);
 select * into ref from public.teacher_referrals where referred_user_id=r.user_id for update;
 if not found and r.partner_teacher_id is not null then
  if r.partner_teacher_id=r.user_id then raise exception 'Self-referral engellendi';end if;
  insert into public.teacher_referrals(teacher_id,referred_user_id,partner_code,first_payment_request_id)
  values(r.partner_teacher_id,r.user_id,r.partner_code,r.id) on conflict(referred_user_id) do nothing returning * into ref;
  if found then
   select * into partner from public.teacher_partner_profiles where teacher_id=ref.teacher_id for update;
   credit_start:=greatest(now(),coalesce(partner.access_ends_at,now()));credit_end:=credit_start+interval '30 days';
   insert into public.teacher_access_credits(teacher_id,referred_user_id,source_payment_request_id,days,starts_at,ends_at)
   values(ref.teacher_id,r.user_id,r.id,30,credit_start,credit_end) on conflict do nothing;
   update public.teacher_partner_profiles set access_ends_at=credit_end,updated_at=now() where teacher_id=ref.teacher_id;
  end if;
 end if;
 select * into ref from public.teacher_referrals where referred_user_id=r.user_id;
 if found then
  select * into partner from public.teacher_partner_profiles where teacher_id=ref.teacher_id;
  insert into public.teacher_commission_earnings(teacher_id,referred_user_id,payment_request_id,gross_amount,commission_rate,commission_amount)
  values(ref.teacher_id,r.user_id,r.id,r.payable_amount,partner.commission_rate,round(r.payable_amount*partner.commission_rate,2)) on conflict(payment_request_id) do nothing;
 end if;
 insert into public.payment_email_deliveries(payment_request_id,recipient_user_id,decision,plan_code,plan_name,payment_code,payable_amount,admin_note,membership_ends_at)
 values(r.id,r.user_id,'approved',p.code,p.name,r.payment_code,r.payable_amount,r.admin_note,finish)
 on conflict(payment_request_id,decision) do nothing;
 return r;
end $$;

create or replace function public.service_cleanup_partner_e2e_run(p_run_id text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_user_ids uuid[]:='{}'::uuid[];v_teacher_ids uuid[]:='{}'::uuid[];v_payment_ids uuid[]:='{}'::uuid[];v_payout_ids uuid[]:='{}'::uuid[];
 v_user_count integer:=0;v_audit_deleted integer:=0;v_audit_remaining integer:=0;v_email_deleted integer:=0;v_email_remaining integer:=0;v_result jsonb;
begin
 if coalesce(auth.jwt()->>'role','')<>'service_role' then raise exception 'service_role gerekli';end if;
 if p_run_id is null or p_run_id!~'^poma-e2e-[0-9]{8}-[0-9]{6}-[0-9a-f]{8}$' then raise exception 'Geçersiz E2E run ID';end if;
 select coalesce(array_agg(u.id order by u.id),'{}'::uuid[]),count(*)::integer into v_user_ids,v_user_count from auth.users u where u.raw_user_meta_data->>'e2e_run_id'=p_run_id;
 if v_user_count>3 then raise exception 'E2E kullanıcı sınırı aşıldı';end if;
 if exists(select 1 from auth.users u where u.id=any(v_user_ids) and lower(coalesce(u.email,''))!~('^e2e-(admin|teacher|parent)\+'||p_run_id||'@e2e\.invalid$')) then raise exception 'E2E test domain doğrulaması başarısız';end if;
 select coalesce(array_agg(t.id),'{}'::uuid[]) into v_teacher_ids from public.teacher_profiles t where t.id=any(v_user_ids);
 select coalesce(array_agg(p.id),'{}'::uuid[]) into v_payment_ids from public.payment_requests p where p.user_id=any(v_user_ids) or p.partner_teacher_id=any(v_teacher_ids);
 select coalesce(array_agg(p.id),'{}'::uuid[]) into v_payout_ids from public.teacher_commission_payouts p where p.teacher_id=any(v_teacher_ids) or p.created_by=any(v_user_ids);
 delete from public.payment_email_deliveries d where d.payment_request_id=any(v_payment_ids);get diagnostics v_email_deleted=row_count;
 delete from public.admin_audit_log a where
  (a.entity_type in('teacher_profile','teacher_partner_profile') and a.entity_id=any(v_teacher_ids))
  or (a.entity_type='payment_request' and a.entity_id=any(v_payment_ids))
  or (a.entity_type='commission_payout' and a.entity_id=any(v_payout_ids));
 get diagnostics v_audit_deleted=row_count;
 v_result:=public.service_cleanup_partner_e2e_run_base(p_run_id);
 select count(*)::integer into v_email_remaining from public.payment_email_deliveries d where d.payment_request_id=any(v_payment_ids);
 select count(*)::integer into v_audit_remaining from public.admin_audit_log a where
  (a.entity_type in('teacher_profile','teacher_partner_profile') and a.entity_id=any(v_teacher_ids))
  or (a.entity_type='payment_request' and a.entity_id=any(v_payment_ids))
  or (a.entity_type='commission_payout' and a.entity_id=any(v_payout_ids));
 return jsonb_set(jsonb_set(jsonb_set(jsonb_set(jsonb_set(v_result,
  '{deleted,admin_audit_log}',to_jsonb(v_audit_deleted),true),
  '{admin_audit_log_remaining}',to_jsonb(v_audit_remaining),true),
  '{payment_email_deliveries_deleted}',to_jsonb(v_email_deleted),true),
  '{payment_email_deliveries_remaining}',to_jsonb(v_email_remaining),true),
  '{remaining_total}',to_jsonb(coalesce((v_result->>'remaining_total')::integer,0)+v_audit_remaining+v_email_remaining),true);
end $$;
revoke all on function public.service_cleanup_partner_e2e_run(text) from public,anon,authenticated,service_role;
grant execute on function public.service_cleanup_partner_e2e_run(text) to service_role;
