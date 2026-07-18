create table public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid not null,
  action text not null check (btrim(action) <> ''),
  entity_type text not null check (btrim(entity_type) <> ''),
  entity_id uuid null,
  old_values jsonb not null default '{}'::jsonb check (jsonb_typeof(old_values) = 'object'),
  new_values jsonb not null default '{}'::jsonb check (jsonb_typeof(new_values) = 'object'),
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now()
);

create index admin_audit_log_created_at_idx on public.admin_audit_log(created_at desc);
create index admin_audit_log_action_created_at_idx on public.admin_audit_log(action, created_at desc);
create index admin_audit_log_entity_created_at_idx on public.admin_audit_log(entity_type, entity_id, created_at desc);
create index admin_audit_log_actor_created_at_idx on public.admin_audit_log(actor_user_id, created_at desc);

alter table public.admin_audit_log enable row level security;
revoke all on table public.admin_audit_log from public, anon, authenticated, service_role;

create or replace function public.protect_admin_audit_identity()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.id is distinct from old.id or new.created_at is distinct from old.created_at then
    raise exception 'Audit kimliği ve oluşturulma zamanı değiştirilemez';
  end if;
  return new;
end
$$;

create trigger admin_audit_log_identity_immutable
before update on public.admin_audit_log
for each row execute function public.protect_admin_audit_identity();

create or replace function public.record_admin_audit(
  p_action text,
  p_entity_type text,
  p_entity_id uuid,
  p_old_values jsonb,
  p_new_values jsonb,
  p_metadata jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_actor uuid := (select auth.uid());
  v_id uuid;
begin
  if v_actor is null then raise exception 'Oturum gerekli'; end if;
  if not public.is_poma_admin() then raise exception 'Yönetici yetkisi gerekli'; end if;
  if nullif(btrim(p_action), '') is null or nullif(btrim(p_entity_type), '') is null then
    raise exception 'Audit action ve entity_type gerekli';
  end if;
  if jsonb_typeof(coalesce(p_old_values, '{}'::jsonb)) <> 'object'
     or jsonb_typeof(coalesce(p_new_values, '{}'::jsonb)) <> 'object'
     or jsonb_typeof(coalesce(p_metadata, '{}'::jsonb)) <> 'object' then
    raise exception 'Audit değerleri JSON object olmalı';
  end if;
  insert into public.admin_audit_log(actor_user_id, action, entity_type, entity_id, old_values, new_values, metadata)
  values(v_actor, btrim(p_action), btrim(p_entity_type), p_entity_id,
    coalesce(p_old_values, '{}'::jsonb), coalesce(p_new_values, '{}'::jsonb), coalesce(p_metadata, '{}'::jsonb))
  returning id into v_id;
  return v_id;
end
$$;

alter function public.protect_admin_audit_identity() owner to postgres;
alter function public.record_admin_audit(text,text,uuid,jsonb,jsonb,jsonb) owner to postgres;
revoke all on function public.protect_admin_audit_identity(),
  public.record_admin_audit(text,text,uuid,jsonb,jsonb,jsonb)
from public, anon, authenticated, service_role;

create or replace function public.list_admin_audit_log(
  p_action text default null,
  p_entity_type text default null,
  p_limit integer default 100
)
returns table(
  id uuid, actor_user_id uuid, action text, entity_type text, entity_id uuid,
  old_values jsonb, new_values jsonb, metadata jsonb, created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then raise exception 'Oturum gerekli'; end if;
  if not public.is_poma_admin() then raise exception 'Yönetici yetkisi gerekli'; end if;
  if p_limit is null or p_limit < 1 or p_limit > 200 then raise exception 'Limit 1 ile 200 arasında olmalı'; end if;
  return query
  select a.id,a.actor_user_id,a.action,a.entity_type,a.entity_id,a.old_values,a.new_values,a.metadata,a.created_at
  from public.admin_audit_log a
  where (p_action is null or a.action=p_action)
    and (p_entity_type is null or a.entity_type=p_entity_type)
  order by a.created_at desc, a.id desc
  limit p_limit;
end
$$;

revoke all on function public.list_admin_audit_log(text,text,integer) from public, anon, authenticated, service_role;
grant execute on function public.list_admin_audit_log(text,text,integer) to authenticated;

create or replace function public.admin_set_teacher_approval(p_teacher_id uuid,p_status text,p_admin_note text default null)
returns public.teacher_profiles language plpgsql security definer set search_path = '' as $$
declare v_old public.teacher_profiles;v_result public.teacher_profiles;v_note text:=nullif(btrim(p_admin_note),'');
begin
 if (select auth.uid()) is null then raise exception 'Oturum gerekli';end if;
 if not public.is_poma_admin() then raise exception 'Yönetici yetkisi gerekli';end if;
 if p_status is null or p_status not in('pending','approved','rejected','suspended') then raise exception 'Geçersiz öğretmen onay durumu';end if;
 if p_status in('rejected','suspended') and v_note is null then raise exception 'Reddetme veya askıya alma notu gerekli';end if;
 select * into v_old from public.teacher_profiles where id=p_teacher_id for update;
 if not found then raise exception 'Öğretmen profili bulunamadı';end if;
 update public.teacher_profiles set approval_status=p_status,
  approved_at=case when p_status='approved' then now() when p_status in('pending','rejected') then null else approved_at end,
  approved_by=case when p_status='approved' then (select auth.uid()) when p_status in('pending','rejected') then null else approved_by end,
  updated_at=now() where id=p_teacher_id returning * into v_result;
 insert into public.teacher_partner_audit(teacher_id,actor_user_id,action,entity_type,entity_id,old_values,new_values)
 values(p_teacher_id,(select auth.uid()),'teacher_approval_changed','teacher_profile',p_teacher_id,to_jsonb(v_old),to_jsonb(v_result)||jsonb_build_object('admin_note',v_note));
 perform public.record_admin_audit('teacher_approval_changed','teacher_profile',p_teacher_id,
  jsonb_build_object('approval_status',v_old.approval_status,'approved_at',v_old.approved_at,'approved_by',v_old.approved_by),
  jsonb_build_object('approval_status',v_result.approval_status,'approved_at',v_result.approved_at,'approved_by',v_result.approved_by,'admin_note',v_note),'{}'::jsonb);
 return v_result;
end $$;

create or replace function public.admin_create_commission_payout(p_teacher_id uuid,p_period_start date,p_period_end date,p_admin_note text default null)
returns public.teacher_commission_payouts language plpgsql security definer set search_path='' as $$
declare v_earning_ids uuid[];v_earning_count integer;v_amount numeric(12,2);v_reserved_count integer;v_reserved_amount numeric(12,2);v_result public.teacher_commission_payouts;
begin
 if not public.is_poma_admin() then raise exception 'Yönetici yetkisi gerekli';end if;
 if p_teacher_id is null or p_period_start is null or p_period_end is null or p_period_end<p_period_start then raise exception 'Geçerli öğretmen ve payout tarihleri gerekli';end if;
 select array_agg(locked.id order by locked.id),count(*)::integer,sum(locked.commission_amount)::numeric(12,2) into v_earning_ids,v_earning_count,v_amount
 from(select e.id,e.commission_amount from public.teacher_commission_earnings e where e.teacher_id=p_teacher_id and e.status='payable' and e.payout_id is null and e.earned_at::date between p_period_start and p_period_end order by e.id for update)locked;
 if coalesce(v_earning_count,0)=0 or coalesce(v_amount,0)<=0 then raise exception 'Ödenecek yeni komisyon bulunamadı';end if;
 insert into public.teacher_commission_payouts(teacher_id,amount,period_start,period_end,admin_note,created_by)
 values(p_teacher_id,v_amount,p_period_start,p_period_end,nullif(btrim(p_admin_note),''),(select auth.uid())) returning * into v_result;
 update public.teacher_commission_earnings e set status='pending_payout',payout_id=v_result.id where e.id=any(v_earning_ids) and e.status='payable' and e.payout_id is null;
 get diagnostics v_reserved_count=row_count;
 select coalesce(sum(e.commission_amount),0)::numeric(12,2) into v_reserved_amount from public.teacher_commission_earnings e where e.payout_id=v_result.id and e.status='pending_payout';
 if v_reserved_count<>v_earning_count or v_reserved_amount<>v_result.amount then raise exception 'Payout rezervasyon toplamı doğrulanamadı';end if;
 insert into public.teacher_partner_audit(teacher_id,actor_user_id,action,entity_type,entity_id,new_values)
 values(p_teacher_id,(select auth.uid()),'payout_created','commission_payout',v_result.id,jsonb_build_object('payout_id',v_result.id,'teacher_id',p_teacher_id,'earning_count',v_earning_count,'amount',v_result.amount,'period_start',p_period_start,'period_end',p_period_end));
 perform public.record_admin_audit('commission_payout_created','commission_payout',v_result.id,'{}'::jsonb,
  jsonb_build_object('status',v_result.status,'teacher_id',p_teacher_id,'amount',v_result.amount,'period_start',p_period_start,'period_end',p_period_end,'earning_count',v_earning_count,'admin_note',v_result.admin_note),
  jsonb_build_object('teacher_id',p_teacher_id));
 return v_result;
end $$;

create or replace function public.admin_cancel_commission_payout(p_payout_id uuid,p_admin_note text)
returns public.teacher_commission_payouts language plpgsql security definer set search_path='' as $$
declare v_old public.teacher_commission_payouts;v_result public.teacher_commission_payouts;v_earning_count integer;
begin
 if not public.is_poma_admin() then raise exception 'Yönetici yetkisi gerekli';end if;
 if nullif(btrim(p_admin_note),'') is null then raise exception 'Payout iptal notu gerekli';end if;
 select * into v_old from public.teacher_commission_payouts p where p.id=p_payout_id for update;
 if not found or v_old.status<>'pending' then raise exception 'Yalnız pending payout iptal edilebilir';end if;
 update public.teacher_commission_earnings e set status='payable',payout_id=null where e.payout_id=p_payout_id and e.status='pending_payout';get diagnostics v_earning_count=row_count;
 if v_earning_count=0 then raise exception 'Payout için rezerve edilmiş komisyon bulunamadı';end if;
 update public.teacher_commission_payouts p set status='cancelled',cancelled_at=now(),admin_note=btrim(p_admin_note) where p.id=p_payout_id returning * into v_result;
 insert into public.teacher_partner_audit(teacher_id,actor_user_id,action,entity_type,entity_id,new_values)
 values(v_result.teacher_id,(select auth.uid()),'payout_cancelled','commission_payout',v_result.id,jsonb_build_object('payout_id',v_result.id,'teacher_id',v_result.teacher_id,'earning_count',v_earning_count,'amount',v_result.amount,'admin_note',v_result.admin_note));
 perform public.record_admin_audit('commission_payout_cancelled','commission_payout',v_result.id,
  jsonb_build_object('status',v_old.status,'admin_note',v_old.admin_note),
  jsonb_build_object('status',v_result.status,'cancelled_at',v_result.cancelled_at,'admin_note',v_result.admin_note),
  jsonb_build_object('teacher_id',v_result.teacher_id,'amount',v_result.amount,'earning_count',v_earning_count));
 return v_result;
end $$;

create or replace function public.admin_mark_commission_payout_paid(p_payout_id uuid,p_admin_note text default null)
returns public.teacher_commission_payouts language plpgsql security definer set search_path='' as $$
declare v_old public.teacher_commission_payouts;v_result public.teacher_commission_payouts;v_earning_ids uuid[];v_earning_count integer;v_amount numeric(12,2);
begin
 if not public.is_poma_admin() then raise exception 'Yönetici yetkisi gerekli';end if;
 select * into v_old from public.teacher_commission_payouts p where p.id=p_payout_id for update;
 if not found or v_old.status<>'pending' then raise exception 'Payout bulunamadı veya pending durumda değil';end if;
 select array_agg(locked.id order by locked.id),count(*)::integer,coalesce(sum(locked.commission_amount),0)::numeric(12,2) into v_earning_ids,v_earning_count,v_amount
 from(select e.id,e.commission_amount from public.teacher_commission_earnings e where e.payout_id=p_payout_id and e.status='pending_payout' order by e.id for update)locked;
 if v_earning_count=0 then raise exception 'Payout için rezerve edilmiş komisyon bulunamadı';end if;
 if v_amount<>v_old.amount then raise exception 'Payout ve bağlı komisyon toplamı eşleşmiyor';end if;
 update public.teacher_commission_payouts p set status='paid',paid_at=now(),admin_note=coalesce(nullif(btrim(p_admin_note),''),p.admin_note) where p.id=p_payout_id returning * into v_result;
 update public.teacher_commission_earnings e set status='paid',paid_at=v_result.paid_at where e.id=any(v_earning_ids) and e.payout_id=p_payout_id and e.status='pending_payout';
 insert into public.teacher_partner_audit(teacher_id,actor_user_id,action,entity_type,entity_id,new_values)
 values(v_result.teacher_id,(select auth.uid()),'payout_paid','commission_payout',v_result.id,jsonb_build_object('payout_id',v_result.id,'teacher_id',v_result.teacher_id,'earning_count',v_earning_count,'amount',v_result.amount,'paid_at',v_result.paid_at));
 perform public.record_admin_audit('commission_payout_paid','commission_payout',v_result.id,
  jsonb_build_object('status',v_old.status,'admin_note',v_old.admin_note),
  jsonb_build_object('status',v_result.status,'paid_at',v_result.paid_at,'admin_note',v_result.admin_note),
  jsonb_build_object('teacher_id',v_result.teacher_id,'amount',v_result.amount,'earning_count',v_earning_count));
 return v_result;
end $$;

alter function public.service_cleanup_partner_e2e_run(text) rename to service_cleanup_partner_e2e_run_base;
alter function public.service_cleanup_partner_e2e_run_base(text) security invoker;
revoke all on function public.service_cleanup_partner_e2e_run_base(text) from public,anon,authenticated,service_role;

create or replace function public.service_cleanup_partner_e2e_run(p_run_id text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_user_ids uuid[]:='{}'::uuid[];v_teacher_ids uuid[]:='{}'::uuid[];v_payment_ids uuid[]:='{}'::uuid[];v_payout_ids uuid[]:='{}'::uuid[];
 v_user_count integer:=0;v_deleted integer:=0;v_remaining integer:=0;v_result jsonb;
begin
 if coalesce(auth.jwt()->>'role','')<>'service_role' then raise exception 'service_role gerekli';end if;
 if p_run_id is null or p_run_id!~'^poma-e2e-[0-9]{8}-[0-9]{6}-[0-9a-f]{8}$' then raise exception 'Geçersiz E2E run ID';end if;
 select coalesce(array_agg(u.id order by u.id),'{}'::uuid[]),count(*)::integer into v_user_ids,v_user_count from auth.users u where u.raw_user_meta_data->>'e2e_run_id'=p_run_id;
 if v_user_count>3 then raise exception 'E2E kullanıcı sınırı aşıldı';end if;
 if exists(select 1 from auth.users u where u.id=any(v_user_ids) and lower(coalesce(u.email,''))!~('^e2e-(admin|teacher|parent)\+'||p_run_id||'@e2e\.invalid$')) then raise exception 'E2E test domain doğrulaması başarısız';end if;
 select coalesce(array_agg(t.id),'{}'::uuid[]) into v_teacher_ids from public.teacher_profiles t where t.id=any(v_user_ids);
 select coalesce(array_agg(p.id),'{}'::uuid[]) into v_payment_ids from public.payment_requests p where p.user_id=any(v_user_ids) or p.partner_teacher_id=any(v_teacher_ids);
 select coalesce(array_agg(p.id),'{}'::uuid[]) into v_payout_ids from public.teacher_commission_payouts p where p.teacher_id=any(v_teacher_ids) or p.created_by=any(v_user_ids);
 delete from public.admin_audit_log a where
  (a.entity_type in('teacher_profile','teacher_partner_profile') and a.entity_id=any(v_teacher_ids))
  or (a.entity_type='payment_request' and a.entity_id=any(v_payment_ids))
  or (a.entity_type='commission_payout' and a.entity_id=any(v_payout_ids));
 get diagnostics v_deleted=row_count;
 v_result:=public.service_cleanup_partner_e2e_run_base(p_run_id);
 select count(*)::integer into v_remaining from public.admin_audit_log a where
  (a.entity_type in('teacher_profile','teacher_partner_profile') and a.entity_id=any(v_teacher_ids))
  or (a.entity_type='payment_request' and a.entity_id=any(v_payment_ids))
  or (a.entity_type='commission_payout' and a.entity_id=any(v_payout_ids));
 return jsonb_set(jsonb_set(jsonb_set(v_result,'{deleted,admin_audit_log}',to_jsonb(v_deleted),true),'{admin_audit_log_remaining}',to_jsonb(v_remaining),true),'{remaining_total}',to_jsonb(coalesce((v_result->>'remaining_total')::integer,0)+v_remaining),true);
end $$;

revoke all on function public.service_cleanup_partner_e2e_run(text) from public,anon,authenticated,service_role;
grant execute on function public.service_cleanup_partner_e2e_run(text) to service_role;

create or replace function public.admin_upsert_teacher_partner(p_teacher_id uuid,p_partner_code text,p_status text default 'active',p_commission_rate numeric default .10,p_access_ends_at timestamptz default null,p_admin_note text default null)
returns public.teacher_partner_profiles language plpgsql security definer set search_path=public as $$
declare oldrow public.teacher_partner_profiles;result public.teacher_partner_profiles;
begin
 if not public.is_poma_admin() then raise exception 'Yönetici yetkisi gerekli';end if;
 if not exists(select 1 from public.teacher_profiles where id=p_teacher_id) then raise exception 'Öğretmen bulunamadı';end if;
 select * into oldrow from public.teacher_partner_profiles where teacher_id=p_teacher_id for update;
 insert into public.teacher_partner_profiles(teacher_id,partner_code,status,commission_rate,access_ends_at)
 values(p_teacher_id,upper(btrim(p_partner_code)),p_status,p_commission_rate,p_access_ends_at)
 on conflict(teacher_id) do update set partner_code=excluded.partner_code,status=excluded.status,commission_rate=excluded.commission_rate,
 access_ends_at=coalesce(excluded.access_ends_at,teacher_partner_profiles.access_ends_at),updated_at=now() returning * into result;
 insert into public.teacher_partner_audit(teacher_id,actor_user_id,action,entity_type,entity_id,old_values,new_values)
 values(p_teacher_id,auth.uid(),'partner_upsert','teacher_partner_profile',p_teacher_id,coalesce(to_jsonb(oldrow),'{}'::jsonb),to_jsonb(result)||jsonb_build_object('admin_note',p_admin_note));
 perform public.record_admin_audit('teacher_partner_upserted','teacher_partner_profile',p_teacher_id,
  case when oldrow is null then '{}'::jsonb else jsonb_build_object('status',oldrow.status,'commission_rate',oldrow.commission_rate,'access_ends_at',oldrow.access_ends_at) end,
  jsonb_build_object('status',result.status,'commission_rate',result.commission_rate,'access_ends_at',result.access_ends_at,'admin_note',nullif(btrim(p_admin_note),'')),
  jsonb_build_object('teacher_id',p_teacher_id));
 return result;
end $$;

create or replace function public.review_payment(p_payment_request_id uuid,p_decision text,p_admin_note text default null)
returns public.payment_requests language plpgsql security definer set search_path=public as $$
declare r public.payment_requests;oldrow public.payment_requests;p public.plans;base timestamptz;finish timestamptz;grant_days int;grant_plan_id uuid;
 partner public.teacher_partner_profiles;ref public.teacher_referrals;credit_start timestamptz;credit_end timestamptz;
begin
 if not public.is_poma_admin() then raise exception 'Yönetici yetkisi gerekli';end if;
 if p_decision not in('approved','rejected') then raise exception 'Geçersiz karar';end if;
 if p_decision='rejected' and nullif(btrim(p_admin_note),'') is null then raise exception 'Red notu zorunlu';end if;
 select * into oldrow from public.payment_requests where id=p_payment_request_id for update;
 if not found or oldrow.status not in('pending','receipt_sent') then raise exception 'Ödeme daha önce incelendi veya bulunamadı';end if;
 update public.payment_requests set status=p_decision,admin_note=nullif(btrim(p_admin_note),''),reviewed_at=now(),reviewed_by=auth.uid() where id=oldrow.id returning * into r;
 perform public.record_admin_audit(case when p_decision='approved' then 'payment_approved' else 'payment_rejected' end,'payment_request',r.id,
  jsonb_build_object('status',oldrow.status,'admin_note',oldrow.admin_note),
  jsonb_build_object('status',r.status,'reviewed_by',r.reviewed_by,'reviewed_at',r.reviewed_at,'admin_note',r.admin_note),
  jsonb_build_object('user_id',r.user_id,'plan_id',r.plan_id,'payable_amount',r.payable_amount,'payment_method',r.payment_method));
 if p_decision<>'approved' then return r;end if;
 select * into p from public.plans where id=r.plan_id;
 if p.code='TEACHER_MONTHLY' then
  select * into partner from public.teacher_partner_profiles where teacher_id=r.user_id for update;
  if not found then raise exception 'Öğretmen partner profili bulunamadı';end if;
  credit_start:=greatest(now(),coalesce(partner.access_ends_at,now()));credit_end:=credit_start+interval '30 days';
  update public.teacher_partner_profiles set access_ends_at=credit_end,updated_at=now() where teacher_id=r.user_id;
  insert into public.teacher_access_credits(teacher_id,source_payment_request_id,days,starts_at,ends_at,source_type)
  values(r.user_id,r.id,30,credit_start,credit_end,'teacher_purchase');return r;
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
 return r;
end $$;
