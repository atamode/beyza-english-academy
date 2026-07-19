-- Full refunds are recorded manually; no bank/provider refund is initiated here.
create table public.refund_requests(
 id uuid primary key default gen_random_uuid(),
 payment_request_id uuid not null references public.payment_requests(id) on delete restrict,
 requested_by uuid not null references auth.users(id) on delete restrict,
 status text not null default 'requested' check(status in('requested','approved','rejected','completed','cancelled')),
 refund_amount numeric(12,2) not null check(refund_amount>0),
 currency text not null default 'TRY' check(currency='TRY'),
 requested_reason text not null check(char_length(btrim(requested_reason)) between 10 and 1000),
 admin_note text check(admin_note is null or char_length(admin_note)<=1000),
 requested_at timestamptz not null default now(),reviewed_at timestamptz,reviewed_by uuid references auth.users(id),
 completed_at timestamptz,completed_by uuid references auth.users(id),
 refund_method text check(refund_method is null or refund_method in('bank_transfer','other')),
 refund_reference text check(refund_reference is null or char_length(btrim(refund_reference)) between 3 and 200),
 cancelled_at timestamptz,cancelled_by uuid references auth.users(id),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 check(status<>'completed' or (completed_at is not null and completed_by is not null and refund_method is not null and refund_reference is not null)),
 check(status<>'rejected' or (reviewed_at is not null and reviewed_by is not null and nullif(btrim(admin_note),'') is not null)),
 check(status<>'cancelled' or (cancelled_at is not null and cancelled_by is not null and nullif(btrim(admin_note),'') is not null))
);
create unique index refund_requests_one_open_idx on public.refund_requests(payment_request_id) where status in('requested','approved');
create unique index refund_requests_one_completed_idx on public.refund_requests(payment_request_id) where status='completed';
create index refund_requests_owner_created_idx on public.refund_requests(requested_by,created_at desc);
create index refund_requests_status_created_idx on public.refund_requests(status,created_at desc);

create table public.refund_events(
 id uuid primary key default gen_random_uuid(),refund_request_id uuid not null references public.refund_requests(id) on delete restrict,
 actor_user_id uuid not null references auth.users(id) on delete restrict,
 action text not null check(action in('refund_requested','refund_approved','refund_rejected','refund_cancelled','refund_completed','refund_accounting_alert_created','refund_accounting_alert_resolved')),
 old_status text,new_status text,metadata jsonb not null default '{}'::jsonb,created_at timestamptz not null default now()
);
create index refund_events_refund_created_idx on public.refund_events(refund_request_id,created_at);

create table public.refund_accounting_alerts(
 id uuid primary key default gen_random_uuid(),refund_request_id uuid not null references public.refund_requests(id) on delete restrict,
 payment_request_id uuid not null references public.payment_requests(id) on delete restrict,
 commission_earning_id uuid not null references public.teacher_commission_earnings(id) on delete restrict,
 payout_id uuid references public.teacher_commission_payouts(id) on delete restrict,
 teacher_id uuid not null references public.teacher_partner_profiles(teacher_id) on delete restrict,
 commission_amount numeric(12,2) not null check(commission_amount>=0),
 alert_type text not null check(alert_type in('commission_reserved_in_payout','commission_already_paid')),
 status text not null default 'open' check(status in('open','resolved')),
 resolution_note text check(resolution_note is null or char_length(btrim(resolution_note)) between 3 and 1000),
 resolved_at timestamptz,resolved_by uuid references auth.users(id),created_at timestamptz not null default now(),
 unique(refund_request_id,commission_earning_id),
 check(status<>'resolved' or (resolved_at is not null and resolved_by is not null and resolution_note is not null))
);
create index refund_alerts_status_created_idx on public.refund_accounting_alerts(status,created_at desc);

alter table public.subscriptions add column cancelled_at timestamptz,add column cancelled_by_refund_id uuid references public.refund_requests(id) on delete restrict;
alter table public.teacher_access_credits add column status text not null default 'active' check(status in('active','revoked')),
 add column revoked_at timestamptz,add column revoked_by_refund_id uuid references public.refund_requests(id) on delete restrict,
 add constraint teacher_access_credit_revocation_check check((status='active' and revoked_at is null and revoked_by_refund_id is null) or (status='revoked' and revoked_at is not null and revoked_by_refund_id is not null));
alter table public.teacher_commission_earnings add column cancelled_at timestamptz,
 add column cancelled_by_refund_id uuid references public.refund_requests(id) on delete restrict,
 add column cancellation_reason text check(cancellation_reason is null or cancellation_reason='payment_refunded');

alter table public.refund_requests enable row level security;
alter table public.refund_events enable row level security;
alter table public.refund_accounting_alerts enable row level security;
revoke all on public.refund_requests,public.refund_events,public.refund_accounting_alerts from public,anon,authenticated,service_role;
grant select on public.refund_requests,public.refund_events,public.refund_accounting_alerts to authenticated;
create policy "users read own refunds or admins read all" on public.refund_requests for select to authenticated
 using((select auth.uid())=requested_by or public.is_poma_admin());
create policy "users read own refund events or admins read all" on public.refund_events for select to authenticated
 using(public.is_poma_admin() or exists(select 1 from public.refund_requests r where r.id=refund_request_id and r.requested_by=(select auth.uid())));
create policy "admins read refund accounting alerts" on public.refund_accounting_alerts for select to authenticated using(public.is_poma_admin());

create function public.request_refund(p_payment_request_id uuid,p_reason text)
returns public.refund_requests language plpgsql security definer set search_path='' as $$
declare p public.payment_requests;pl public.plans;s public.subscriptions;c public.teacher_access_credits;r public.refund_requests;
begin
 if auth.uid() is null then raise exception 'Oturum gerekli';end if;
 if char_length(btrim(coalesce(p_reason,''))) not between 10 and 1000 then raise exception 'İade nedeni 10-1000 karakter olmalı';end if;
 select * into p from public.payment_requests where id=p_payment_request_id for update;
 if not found or p.user_id<>auth.uid() then raise exception 'Ödeme iade için uygun değil';end if;
 if p.status<>'approved' or p.payable_amount<=0 then raise exception 'Ödeme iade için uygun değil';end if;
 if exists(select 1 from public.refund_requests x where x.payment_request_id=p.id and x.status in('requested','approved','completed')) then raise exception 'Bu ödeme için açık veya tamamlanmış iade var';end if;
 select * into pl from public.plans where id=p.plan_id and code in('FAMILY_MONTHLY','FAMILY_YEARLY','TEACHER_MONTHLY');
 if not found then raise exception 'Plan iade için uygun değil';end if;
 if pl.code in('FAMILY_MONTHLY','FAMILY_YEARLY') then
  select * into s from public.subscriptions where source_payment_request_id=p.id and user_id=p.user_id for update;
  if not found or s.status<>'active' or s.ends_at<=now() or s.id<>(select n.id from public.subscriptions n where n.user_id=p.user_id and n.status='active' and n.ends_at>now() order by n.ends_at desc,n.created_at desc,n.id desc limit 1) then raise exception 'Bu dönem otomatik iade için uygun değil';end if;
 else
  select * into c from public.teacher_access_credits where source_payment_request_id=p.id for update;
  if not found or c.status<>'active' or c.ends_at<=greatest(now(),c.starts_at) then raise exception 'Öğretmen erişimi iade için uygun değil';end if;
 end if;
 insert into public.refund_requests(payment_request_id,requested_by,refund_amount,requested_reason) values(p.id,auth.uid(),p.payable_amount,btrim(p_reason)) returning * into r;
 insert into public.refund_events(refund_request_id,actor_user_id,action,old_status,new_status,metadata) values(r.id,auth.uid(),'refund_requested',null,'requested',jsonb_build_object('payment_request_id',p.id,'plan_code',pl.code));
 return r;
end $$;

create function public.admin_review_refund(p_refund_request_id uuid,p_decision text,p_admin_note text default null)
returns public.refund_requests language plpgsql security definer set search_path='' as $$
declare r public.refund_requests;p public.payment_requests;pl public.plans;s public.subscriptions;c public.teacher_access_credits;old_status text;
begin
 if not public.is_poma_admin() then raise exception 'Yönetici yetkisi gerekli';end if;
 if p_decision not in('approved','rejected','cancelled') then raise exception 'Geçersiz iade kararı';end if;
 if p_decision in('rejected','cancelled') and nullif(btrim(coalesce(p_admin_note,'')),'') is null then raise exception 'Yönetici notu zorunlu';end if;
 select * into r from public.refund_requests where id=p_refund_request_id for update;if not found then raise exception 'İade talebi bulunamadı';end if;old_status:=r.status;
 if (p_decision in('approved','rejected') and r.status<>'requested') or (p_decision='cancelled' and r.status<>'approved') then raise exception 'İade durumu değiştirilemez';end if;
 if p_decision='approved' then
  select * into p from public.payment_requests where id=r.payment_request_id and status='approved' and payable_amount=r.refund_amount for update;if not found then raise exception 'Ödeme iade için uygun değil';end if;
  select * into pl from public.plans where id=p.plan_id;
  if pl.code in('FAMILY_MONTHLY','FAMILY_YEARLY') then select * into s from public.subscriptions where source_payment_request_id=p.id and status='active' and ends_at>now() for update;if not found or s.id<>(select n.id from public.subscriptions n where n.user_id=p.user_id and n.status='active' and n.ends_at>now() order by n.ends_at desc,n.created_at desc,n.id desc limit 1) then raise exception 'Bu dönem otomatik iade için uygun değil';end if;
  else select * into c from public.teacher_access_credits where source_payment_request_id=p.id and status='active' and ends_at>greatest(now(),starts_at) for update;if not found then raise exception 'Öğretmen erişimi iade için uygun değil';end if;end if;
 end if;
 update public.refund_requests set status=p_decision,admin_note=nullif(btrim(p_admin_note),''),reviewed_at=case when p_decision in('approved','rejected') then now() else reviewed_at end,
  reviewed_by=case when p_decision in('approved','rejected') then auth.uid() else reviewed_by end,cancelled_at=case when p_decision='cancelled' then now() end,cancelled_by=case when p_decision='cancelled' then auth.uid() end,updated_at=now() where id=r.id returning * into r;
 insert into public.refund_events(refund_request_id,actor_user_id,action,old_status,new_status,metadata) values(r.id,auth.uid(),'refund_'||p_decision,old_status,p_decision,'{}');
 perform public.record_admin_audit('refund_'||p_decision,'refund_request',r.id,jsonb_build_object('status',old_status),jsonb_build_object('status',r.status,'admin_note',r.admin_note),jsonb_build_object('payment_request_id',r.payment_request_id));
 return r;
end $$;

create function public.admin_complete_refund(p_refund_request_id uuid,p_refund_method text,p_refund_reference text,p_admin_note text default null)
returns public.refund_requests language plpgsql security definer set search_path='' as $$
declare r public.refund_requests;p public.payment_requests;pl public.plans;s public.subscriptions;c public.teacher_access_credits;e public.teacher_commission_earnings;a public.refund_accounting_alerts;
 old_access timestamptz;remaining interval;available interval;removable interval;alert_type text;
begin
 if not public.is_poma_admin() then raise exception 'Yönetici yetkisi gerekli';end if;
 if p_refund_method not in('bank_transfer','other') or char_length(btrim(coalesce(p_refund_reference,''))) not between 3 and 200 then raise exception 'İade yöntemi ve referansı zorunlu';end if;
 select * into r from public.refund_requests where id=p_refund_request_id for update;if not found then raise exception 'İade talebi bulunamadı';end if;
 if r.status='completed' then return r;end if;if r.status<>'approved' then raise exception 'Yalnız kabul edilmiş iade tamamlanabilir';end if;
 select * into p from public.payment_requests where id=r.payment_request_id for update;if p.status<>'approved' or p.payable_amount<>r.refund_amount then raise exception 'Ödeme iade için uygun değil';end if;
 select * into pl from public.plans where id=p.plan_id;
 if pl.code in('FAMILY_MONTHLY','FAMILY_YEARLY') then
  select * into s from public.subscriptions where source_payment_request_id=p.id for update;
  if not found or s.status<>'active' or s.id<>(select n.id from public.subscriptions n where n.user_id=p.user_id and n.status='active' order by n.ends_at desc,n.created_at desc,n.id desc limit 1) then raise exception 'Üyelik dönemi artık iade için uygun değil';end if;
  update public.subscriptions set status='cancelled',cancelled_at=now(),cancelled_by_refund_id=r.id,updated_at=now() where id=s.id;
  update public.subscriptions set status='expired',updated_at=now() where user_id=p.user_id and status='active' and ends_at<=now();
  update public.membership_expiry_reminder_deliveries set status='skipped',skipped_at=now(),skip_reason='entitlement_refunded',processing_started_at=null,last_error=null,updated_at=now() where entitlement_type='family_subscription' and entitlement_id=s.id and status in('pending','failed');
 end if;
 for c in select * from public.teacher_access_credits where source_payment_request_id=p.id for update loop
  if c.status='active' then
   select access_ends_at into old_access from public.teacher_partner_profiles where teacher_id=c.teacher_id for update;
   remaining:=greatest(interval '0',c.ends_at-greatest(now(),c.starts_at));available:=greatest(interval '0',coalesce(old_access,now())-now());removable:=least(remaining,available);
   update public.teacher_access_credits set status='revoked',revoked_at=now(),revoked_by_refund_id=r.id where id=c.id;
   if removable>interval '0' then update public.teacher_partner_profiles set access_ends_at=greatest(now(),old_access-removable),updated_at=now() where teacher_id=c.teacher_id;end if;
   update public.membership_expiry_reminder_deliveries set status='skipped',skipped_at=now(),skip_reason='entitlement_refunded',processing_started_at=null,last_error=null,updated_at=now() where entitlement_type='teacher_access' and entitlement_id=c.teacher_id and status in('pending','failed');
  end if;
 end loop;
 select * into e from public.teacher_commission_earnings where payment_request_id=p.id for update;
 if found and e.status in('pending','payable') then update public.teacher_commission_earnings set status='cancelled',cancelled_at=now(),cancelled_by_refund_id=r.id,cancellation_reason='payment_refunded' where id=e.id;
 elsif found and e.status in('pending_payout','paid') then
  alert_type:=case e.status when 'pending_payout' then 'commission_reserved_in_payout' else 'commission_already_paid' end;
  insert into public.refund_accounting_alerts(refund_request_id,payment_request_id,commission_earning_id,payout_id,teacher_id,commission_amount,alert_type) values(r.id,p.id,e.id,e.payout_id,e.teacher_id,e.commission_amount,alert_type) on conflict(refund_request_id,commission_earning_id) do nothing returning * into a;
  if found then insert into public.refund_events(refund_request_id,actor_user_id,action,old_status,new_status,metadata) values(r.id,auth.uid(),'refund_accounting_alert_created',r.status,r.status,jsonb_build_object('alert_type',alert_type,'alert_id',a.id));end if;
 end if;
 update public.refund_requests set status='completed',completed_at=now(),completed_by=auth.uid(),refund_method=p_refund_method,refund_reference=btrim(p_refund_reference),admin_note=coalesce(nullif(btrim(p_admin_note),''),admin_note),updated_at=now() where id=r.id returning * into r;
 insert into public.refund_events(refund_request_id,actor_user_id,action,old_status,new_status,metadata) values(r.id,auth.uid(),'refund_completed','approved','completed',jsonb_build_object('refund_method',p_refund_method));
 perform public.record_admin_audit('refund_completed','refund_request',r.id,jsonb_build_object('status','approved'),jsonb_build_object('status','completed','completed_at',r.completed_at),jsonb_build_object('payment_request_id',p.id,'refund_amount',r.refund_amount));
 return r;
end $$;

create function public.admin_resolve_refund_accounting_alert(p_alert_id uuid,p_resolution_note text)
returns public.refund_accounting_alerts language plpgsql security definer set search_path='' as $$
declare a public.refund_accounting_alerts;
begin
 if not public.is_poma_admin() then raise exception 'Yönetici yetkisi gerekli';end if;
 if char_length(btrim(coalesce(p_resolution_note,''))) not between 3 and 1000 then raise exception 'Çözüm notu zorunlu';end if;
 select * into a from public.refund_accounting_alerts where id=p_alert_id for update;if not found then raise exception 'Muhasebe uyarısı bulunamadı';end if;
 if a.status='resolved' then return a;end if;
 update public.refund_accounting_alerts set status='resolved',resolution_note=btrim(p_resolution_note),resolved_at=now(),resolved_by=auth.uid() where id=a.id returning * into a;
 insert into public.refund_events(refund_request_id,actor_user_id,action,old_status,new_status,metadata) values(a.refund_request_id,auth.uid(),'refund_accounting_alert_resolved','open','resolved',jsonb_build_object('alert_id',a.id));
 perform public.record_admin_audit('refund_accounting_alert_resolved','refund_accounting_alert',a.id,jsonb_build_object('status','open'),jsonb_build_object('status','resolved','resolution_note',a.resolution_note),jsonb_build_object('refund_request_id',a.refund_request_id));
 return a;
end $$;

create function public.list_admin_refunds()
returns table(refund_request_id uuid,payment_request_id uuid,user_email text,payment_code text,plan_code text,plan_name text,payable_amount numeric,payment_created_at timestamptz,
 refund_status text,refund_amount numeric,refund_requested_at timestamptz,refund_reason text,refund_admin_note text,refund_completed_at timestamptz,refund_method text,refund_reference text,
 refund_eligibility boolean,refund_ineligibility_reason text,entitlement_type text,access_ends_at timestamptz,commission_status text,accounting_alert_count bigint,accounting_alert_id uuid)
language plpgsql security definer set search_path='' as $$
begin
 if not public.is_poma_admin() then raise exception 'Yönetici yetkisi gerekli';end if;
 return query select r.id,p.id,u.email::text,p.payment_code,pl.code,pl.name,p.payable_amount,p.created_at,r.status,r.refund_amount,r.requested_at,r.requested_reason,r.admin_note,r.completed_at,r.refund_method,r.refund_reference,
  (p.status='approved' and p.payable_amount>0 and r.status in('requested','approved')),
  case when p.status<>'approved' then 'Ödeme onaylı değil' when p.payable_amount<=0 then 'İade edilebilir tutar yok' when r.status not in('requested','approved') then 'İade işlemi sonuçlanmış' end,
  case when pl.code='TEACHER_MONTHLY' then 'teacher_access' else 'family_subscription' end,
  coalesce(s.ends_at,tp.access_ends_at),ce.status,(select count(*) from public.refund_accounting_alerts x where x.refund_request_id=r.id and x.status='open'),
  (select x.id from public.refund_accounting_alerts x where x.refund_request_id=r.id and x.status='open' order by x.created_at,x.id limit 1)
 from public.refund_requests r join public.payment_requests p on p.id=r.payment_request_id join public.plans pl on pl.id=p.plan_id join auth.users u on u.id=p.user_id
 left join public.subscriptions s on s.source_payment_request_id=p.id left join public.teacher_access_credits tc on tc.source_payment_request_id=p.id
 left join public.teacher_partner_profiles tp on tp.teacher_id=tc.teacher_id left join public.teacher_commission_earnings ce on ce.payment_request_id=p.id order by r.created_at desc;
end $$;

create or replace function public.get_my_partner_summary()
returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object('partner_code',p.partner_code,'status',p.status,'commission_rate',p.commission_rate,
  'monthly_access_price',p.monthly_access_price,'access_ends_at',p.access_ends_at,
  'has_full_access',t.approval_status='approved' and p.status='active' and p.access_ends_at>now(),
  'total_students',(select count(*) from public.teacher_referrals r where r.teacher_id=p.teacher_id),
  'students_this_month',(select count(*) from public.teacher_referrals r where r.teacher_id=p.teacher_id and r.qualified_at>=date_trunc('month',now())),
  'earned_access_days',(select coalesce(sum(c.days),0) from public.teacher_access_credits c where c.teacher_id=p.teacher_id and c.status='active'),
  'remaining_access_days',greatest(0,ceil(extract(epoch from(p.access_ends_at-now()))/86400)),
  'total_commission',(select coalesce(sum(e.commission_amount),0) from public.teacher_commission_earnings e where e.teacher_id=p.teacher_id and e.status<>'cancelled'),
  'payable_commission',(select coalesce(sum(e.commission_amount),0) from public.teacher_commission_earnings e where e.teacher_id=p.teacher_id and e.status='payable'),
  'pending_payout_commission',(select coalesce(sum(e.commission_amount),0) from public.teacher_commission_earnings e where e.teacher_id=p.teacher_id and e.status='pending_payout'),
  'paid_commission',(select coalesce(sum(e.commission_amount),0) from public.teacher_commission_earnings e where e.teacher_id=p.teacher_id and e.status='paid'))
 from public.teacher_partner_profiles p join public.teacher_profiles t on t.id=p.teacher_id where p.teacher_id=(select auth.uid());
$$;

revoke all on function public.request_refund(uuid,text),public.admin_review_refund(uuid,text,text),public.admin_complete_refund(uuid,text,text,text),public.admin_resolve_refund_accounting_alert(uuid,text),public.list_admin_refunds() from public,anon,authenticated,service_role;
grant execute on function public.request_refund(uuid,text),public.admin_review_refund(uuid,text,text),public.admin_complete_refund(uuid,text,text,text),public.admin_resolve_refund_accounting_alert(uuid,text),public.list_admin_refunds() to authenticated;
