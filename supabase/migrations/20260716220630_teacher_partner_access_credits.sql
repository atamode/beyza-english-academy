-- Poma Academy teacher partner, access-credit and commission system.
create extension if not exists pgcrypto;

insert into public.plans(code,name,price,duration_days,child_limit,active,version)
values('TEACHER_MONTHLY','Öğretmen Aylık Erişim',199.00,30,1,true,1)
on conflict(code) do update set name=excluded.name,price=excluded.price,
 duration_days=excluded.duration_days,child_limit=excluded.child_limit,active=excluded.active;

create table public.teacher_partner_profiles(
 teacher_id uuid primary key references public.teacher_profiles(id) on delete cascade,
 partner_code text not null check(partner_code=upper(btrim(partner_code)) and partner_code~'^[A-Z0-9]{3,24}$'),
 status text not null default 'pending' check(status in('pending','active','suspended')),
 commission_rate numeric(5,4) not null default .10 check(commission_rate>=0 and commission_rate<=1),
 monthly_access_price numeric(12,2) not null default 199.00 check(monthly_access_price>=0),
 access_ends_at timestamptz,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create unique index teacher_partner_profiles_code_upper_key on public.teacher_partner_profiles(upper(partner_code));

create table public.teacher_referrals(
 id uuid primary key default gen_random_uuid(),teacher_id uuid not null references public.teacher_partner_profiles(teacher_id),
 referred_user_id uuid not null references auth.users(id),partner_code text not null,
 first_payment_request_id uuid not null references public.payment_requests(id),qualified_at timestamptz not null default now(),
 created_at timestamptz not null default now(),unique(referred_user_id),unique(first_payment_request_id),
 check(teacher_id<>referred_user_id)
);
create index teacher_referrals_teacher_idx on public.teacher_referrals(teacher_id,qualified_at desc);

create table public.teacher_access_credits(
 id uuid primary key default gen_random_uuid(),teacher_id uuid not null references public.teacher_partner_profiles(teacher_id),
 referred_user_id uuid references auth.users(id),source_payment_request_id uuid not null references public.payment_requests(id),
 days integer not null default 30 check(days=30),starts_at timestamptz not null,ends_at timestamptz not null,
 source_type text not null default 'referral' check(source_type in('referral','teacher_purchase','admin_adjustment')),
 created_at timestamptz not null default now(),unique(referred_user_id),unique(source_payment_request_id),
 check(ends_at>starts_at)
);
create index teacher_access_credits_teacher_idx on public.teacher_access_credits(teacher_id,created_at desc);

create table public.teacher_commission_earnings(
 id uuid primary key default gen_random_uuid(),teacher_id uuid not null references public.teacher_partner_profiles(teacher_id),
 referred_user_id uuid not null references auth.users(id),payment_request_id uuid not null unique references public.payment_requests(id),
 gross_amount numeric(12,2) not null check(gross_amount>=0),commission_rate numeric(5,4) not null check(commission_rate>=0 and commission_rate<=1),
 commission_amount numeric(12,2) not null check(commission_amount>=0),
 status text not null default 'payable' check(status in('pending','payable','paid','cancelled')),
 earned_at timestamptz not null default now(),paid_at timestamptz,created_at timestamptz not null default now()
);
create index teacher_commission_teacher_idx on public.teacher_commission_earnings(teacher_id,status,earned_at desc);

create table public.teacher_commission_payouts(
 id uuid primary key default gen_random_uuid(),teacher_id uuid not null references public.teacher_partner_profiles(teacher_id),
 amount numeric(12,2) not null check(amount>0),period_start date not null,period_end date not null,
 status text not null default 'pending' check(status in('pending','paid','cancelled')),admin_note text,
 paid_at timestamptz,created_at timestamptz not null default now(),created_by uuid not null references auth.users(id),
 check(period_end>=period_start)
);
create index teacher_commission_payouts_teacher_idx on public.teacher_commission_payouts(teacher_id,created_at desc);

create table public.teacher_partner_audit(
 id uuid primary key default gen_random_uuid(),teacher_id uuid references public.teacher_profiles(id),
 actor_user_id uuid not null references auth.users(id),action text not null,entity_type text not null,entity_id uuid,
 old_values jsonb not null default '{}'::jsonb,new_values jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now()
);
create index teacher_partner_audit_teacher_idx on public.teacher_partner_audit(teacher_id,created_at desc);

alter table public.payment_requests add column partner_teacher_id uuid references public.teacher_partner_profiles(teacher_id);
alter table public.payment_requests add column partner_code text;
alter table public.payment_requests add constraint payment_partner_pair_check check((partner_teacher_id is null)=(partner_code is null));

alter table public.teacher_partner_profiles enable row level security;
alter table public.teacher_referrals enable row level security;
alter table public.teacher_access_credits enable row level security;
alter table public.teacher_commission_earnings enable row level security;
alter table public.teacher_commission_payouts enable row level security;
alter table public.teacher_partner_audit enable row level security;

revoke all on public.teacher_partner_profiles,public.teacher_referrals,public.teacher_access_credits,
 public.teacher_commission_earnings,public.teacher_commission_payouts,public.teacher_partner_audit from public,anon,authenticated;
grant select on public.teacher_partner_profiles,public.teacher_referrals,public.teacher_access_credits,
 public.teacher_commission_earnings,public.teacher_commission_payouts to authenticated;

create policy "teacher reads own partner profile" on public.teacher_partner_profiles for select to authenticated
 using(teacher_id=(select auth.uid()) or public.is_poma_admin());
create policy "teacher reads own referrals" on public.teacher_referrals for select to authenticated
 using(teacher_id=(select auth.uid()) or public.is_poma_admin());
create policy "teacher reads own access credits" on public.teacher_access_credits for select to authenticated
 using(teacher_id=(select auth.uid()) or public.is_poma_admin());
create policy "teacher reads own commissions" on public.teacher_commission_earnings for select to authenticated
 using(teacher_id=(select auth.uid()) or public.is_poma_admin());
create policy "teacher reads own payouts" on public.teacher_commission_payouts for select to authenticated
 using(teacher_id=(select auth.uid()) or public.is_poma_admin());

create or replace function public.validate_partner_code(p_partner_code text)
returns table(valid boolean,display_name text)
language sql stable security definer set search_path=public as $$
 select true,tp.display_name from public.teacher_partner_profiles pp join public.teacher_profiles tp on tp.id=pp.teacher_id
 where pp.partner_code=upper(btrim(p_partner_code)) and pp.status='active' and tp.approval_status='approved';
$$;

create or replace function public.register_my_teacher_partner()
returns public.teacher_partner_profiles language plpgsql security definer set search_path=public as $$
declare result public.teacher_partner_profiles; code text;
begin
 if auth.uid() is null or not exists(select 1 from public.teacher_profiles where id=auth.uid()) then raise exception 'Öğretmen hesabı gerekli'; end if;
 select * into result from public.teacher_partner_profiles where teacher_id=auth.uid(); if found then return result; end if;
 code:='POMA'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,8));
 insert into public.teacher_partner_profiles(teacher_id,partner_code) values(auth.uid(),code) returning * into result; return result;
end $$;

create or replace function public.get_my_partner_summary()
returns jsonb language sql stable security definer set search_path=public as $$
 select jsonb_build_object('partner_code',p.partner_code,'status',p.status,'commission_rate',p.commission_rate,
  'monthly_access_price',p.monthly_access_price,'access_ends_at',p.access_ends_at,
  'has_full_access',tp.approval_status='approved' and p.status='active' and p.access_ends_at>now(),
  'total_students',(select count(*) from public.teacher_referrals r where r.teacher_id=p.teacher_id),
  'students_this_month',(select count(*) from public.teacher_referrals r where r.teacher_id=p.teacher_id and r.qualified_at>=date_trunc('month',now())),
  'earned_access_days',(select coalesce(sum(c.days),0) from public.teacher_access_credits c where c.teacher_id=p.teacher_id),
  'remaining_access_days',greatest(0,ceil(extract(epoch from(p.access_ends_at-now()))/86400)),
  'total_commission',(select coalesce(sum(e.commission_amount),0) from public.teacher_commission_earnings e where e.teacher_id=p.teacher_id and e.status<>'cancelled'),
  'payable_commission',(select coalesce(sum(e.commission_amount),0) from public.teacher_commission_earnings e where e.teacher_id=p.teacher_id and e.status='payable'),
  'paid_commission',(select coalesce(sum(e.commission_amount),0) from public.teacher_commission_earnings e where e.teacher_id=p.teacher_id and e.status='paid'))
 from public.teacher_partner_profiles p join public.teacher_profiles tp on tp.id=p.teacher_id where p.teacher_id=auth.uid();
$$;

create or replace function public.get_my_partner_access()
returns table(approved boolean,partner_active boolean,access_ends_at timestamptz,has_full_access boolean)
language sql stable security definer set search_path=public as $$
 select tp.approval_status='approved',pp.status='active',pp.access_ends_at,
 tp.approval_status='approved' and pp.status='active' and pp.access_ends_at>now()
 from public.teacher_profiles tp left join public.teacher_partner_profiles pp on pp.teacher_id=tp.id where tp.id=auth.uid();
$$;

create or replace function public.list_my_partner_referrals()
returns table(id uuid,qualified_at timestamptz,partner_code text)
language sql stable security definer set search_path=public as $$
 select r.id,r.qualified_at,r.partner_code from public.teacher_referrals r where r.teacher_id=auth.uid() order by r.qualified_at desc;
$$;
create or replace function public.list_my_commission_history()
returns table(id uuid,gross_amount numeric,commission_amount numeric,status text,earned_at timestamptz,paid_at timestamptz)
language sql stable security definer set search_path=public as $$
 select e.id,e.gross_amount,e.commission_amount,e.status,e.earned_at,e.paid_at from public.teacher_commission_earnings e
 where e.teacher_id=auth.uid() order by e.earned_at desc;
$$;

drop function if exists public.create_payment_request(text,text,text,text,text,date);
create or replace function public.create_payment_request(p_plan_code text,p_payment_method text,p_coupon_code text default null,
 p_instagram_username text default null,p_sender_name text default null,p_transfer_date date default null,p_partner_code text default null)
returns public.payment_requests language plpgsql security definer set search_path=public as $$
declare p public.plans; v_coupon_id uuid; v_discount numeric(12,2):=0; result public.payment_requests; partner public.teacher_partner_profiles;
begin
 if auth.uid() is null then raise exception 'Oturum gerekli'; end if;
 select * into p from public.plans where code=p_plan_code and active and price>0; if not found then raise exception 'Ücretli aktif plan bulunamadı'; end if;
 if p.code='TEACHER_MONTHLY' and not exists(select 1 from public.teacher_profiles where id=auth.uid()) then raise exception 'Bu plan yalnız öğretmen hesapları içindir'; end if;
 if p_payment_method not in('bank_transfer','instagram') then raise exception 'Geçersiz ödeme yöntemi'; end if;
 if nullif(btrim(p_coupon_code),'') is not null then select coupon_id,discount_amount into v_coupon_id,v_discount from public.quote_coupon(p_plan_code,p_coupon_code); end if;
 if p.code<>'TEACHER_MONTHLY' and nullif(btrim(p_partner_code),'') is not null then
  select pp.* into partner from public.teacher_partner_profiles pp join public.teacher_profiles tp on tp.id=pp.teacher_id
  where pp.partner_code=upper(btrim(p_partner_code)) and pp.status='active' and tp.approval_status='approved';
  if not found then raise exception 'Öğretmen kodu geçersiz veya aktif değil'; end if;
  if partner.teacher_id=auth.uid() then raise exception 'Kendi partner kodunuzu kullanamazsınız'; end if;
 end if;
 insert into public.payment_requests(user_id,plan_id,list_price,discount_amount,payable_amount,payment_method,instagram_username,sender_name,transfer_date,partner_teacher_id,partner_code)
 values(auth.uid(),p.id,p.price,v_discount,p.price-v_discount,p_payment_method,nullif(btrim(p_instagram_username),''),nullif(btrim(p_sender_name),''),p_transfer_date,partner.teacher_id,partner.partner_code) returning * into result;
 if v_coupon_id is not null then insert into public.coupon_redemptions(coupon_id,user_id,payment_request_id,discount_amount) values(v_coupon_id,auth.uid(),result.id,v_discount); end if;
 return result;
end $$;

create or replace function public.review_payment(p_payment_request_id uuid,p_decision text,p_admin_note text default null)
returns public.payment_requests language plpgsql security definer set search_path=public as $$
declare r public.payment_requests;p public.plans;base timestamptz;finish timestamptz;grant_days int;grant_plan_id uuid;
 partner public.teacher_partner_profiles;ref public.teacher_referrals;credit_start timestamptz;credit_end timestamptz;
begin
 if not public.is_poma_admin() then raise exception 'Yönetici yetkisi gerekli'; end if;
 if p_decision not in('approved','rejected') then raise exception 'Geçersiz karar'; end if;
 if p_decision='rejected' and nullif(btrim(p_admin_note),'') is null then raise exception 'Red notu zorunlu'; end if;
 select * into r from public.payment_requests where id=p_payment_request_id for update;
 if not found or r.status not in('pending','receipt_sent') then raise exception 'Ödeme daha önce incelendi veya bulunamadı'; end if;
 update public.payment_requests set status=p_decision,admin_note=nullif(btrim(p_admin_note),''),reviewed_at=now(),reviewed_by=auth.uid() where id=r.id returning * into r;
 if p_decision<>'approved' then return r; end if;
 select * into p from public.plans where id=r.plan_id;
 if p.code='TEACHER_MONTHLY' then
  select * into partner from public.teacher_partner_profiles where teacher_id=r.user_id for update;
  if not found then raise exception 'Öğretmen partner profili bulunamadı'; end if;
  credit_start:=greatest(now(),coalesce(partner.access_ends_at,now()));credit_end:=credit_start+interval '30 days';
  update public.teacher_partner_profiles set access_ends_at=credit_end,updated_at=now() where teacher_id=r.user_id;
  insert into public.teacher_access_credits(teacher_id,source_payment_request_id,days,starts_at,ends_at,source_type)
  values(r.user_id,r.id,30,credit_start,credit_end,'teacher_purchase'); return r;
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
 values(p_teacher_id,auth.uid(),'partner_upsert','teacher_partner_profile',p_teacher_id,coalesce(to_jsonb(oldrow),'{}'::jsonb),to_jsonb(result)||jsonb_build_object('admin_note',p_admin_note));return result;
end $$;

create or replace function public.list_admin_teacher_partners()
returns table(teacher_id uuid,display_name text,partner_code text,status text,commission_rate numeric,access_ends_at timestamptz,referral_count bigint,payable_commission numeric)
language plpgsql stable security definer set search_path=public as $$ begin
 if not public.is_poma_admin() then raise exception 'Yönetici yetkisi gerekli';end if;
 return query select p.teacher_id,t.display_name,p.partner_code,p.status,p.commission_rate,p.access_ends_at,
 (select count(*) from public.teacher_referrals r where r.teacher_id=p.teacher_id),
 (select coalesce(sum(e.commission_amount),0) from public.teacher_commission_earnings e where e.teacher_id=p.teacher_id and e.status='payable')
 from public.teacher_partner_profiles p join public.teacher_profiles t on t.id=p.teacher_id order by t.display_name;end $$;

create or replace function public.admin_create_commission_payout(p_teacher_id uuid,p_period_start date,p_period_end date,p_admin_note text default null)
returns public.teacher_commission_payouts language plpgsql security definer set search_path=public as $$
declare amount numeric;result public.teacher_commission_payouts;
begin
 if not public.is_poma_admin() then raise exception 'Yönetici yetkisi gerekli';end if;
 perform 1 from public.teacher_commission_earnings where teacher_id=p_teacher_id and status='payable' and earned_at::date between p_period_start and p_period_end for update;
 select coalesce(sum(commission_amount),0) into amount from public.teacher_commission_earnings where teacher_id=p_teacher_id and status='payable' and earned_at::date between p_period_start and p_period_end;
 if amount<=0 then raise exception 'Ödenecek komisyon bulunamadı';end if;
 insert into public.teacher_commission_payouts(teacher_id,amount,period_start,period_end,admin_note,created_by) values(p_teacher_id,amount,p_period_start,p_period_end,nullif(btrim(p_admin_note),''),auth.uid()) returning * into result;
 insert into public.teacher_partner_audit(teacher_id,actor_user_id,action,entity_type,entity_id,new_values) values(p_teacher_id,auth.uid(),'payout_created','commission_payout',result.id,to_jsonb(result));return result;
end $$;

create or replace function public.admin_mark_commission_payout_paid(p_payout_id uuid,p_admin_note text default null)
returns public.teacher_commission_payouts language plpgsql security definer set search_path=public as $$
declare result public.teacher_commission_payouts;
begin
 if not public.is_poma_admin() then raise exception 'Yönetici yetkisi gerekli';end if;
 select * into result from public.teacher_commission_payouts where id=p_payout_id for update;
 if not found or result.status<>'pending' then raise exception 'Payout bulunamadı veya işlendi';end if;
 update public.teacher_commission_payouts set status='paid',paid_at=now(),admin_note=coalesce(nullif(btrim(p_admin_note),''),admin_note) where id=p_payout_id returning * into result;
 update public.teacher_commission_earnings set status='paid',paid_at=result.paid_at where teacher_id=result.teacher_id and status='payable' and earned_at::date between result.period_start and result.period_end;
 insert into public.teacher_partner_audit(teacher_id,actor_user_id,action,entity_type,entity_id,new_values) values(result.teacher_id,auth.uid(),'payout_paid','commission_payout',result.id,to_jsonb(result));return result;
end $$;

revoke all on function public.validate_partner_code(text),public.register_my_teacher_partner(),public.get_my_partner_summary(),
 public.get_my_partner_access(),public.list_my_partner_referrals(),public.list_my_commission_history(),
 public.create_payment_request(text,text,text,text,text,date,text),public.admin_upsert_teacher_partner(uuid,text,text,numeric,timestamptz,text),
 public.list_admin_teacher_partners(),public.admin_create_commission_payout(uuid,date,date,text),public.admin_mark_commission_payout_paid(uuid,text)
 from public,anon,authenticated;
grant execute on function public.validate_partner_code(text),public.register_my_teacher_partner(),public.get_my_partner_summary(),
 public.get_my_partner_access(),public.list_my_partner_referrals(),public.list_my_commission_history(),
 public.create_payment_request(text,text,text,text,text,date,text),public.admin_upsert_teacher_partner(uuid,text,text,numeric,timestamptz,text),
 public.list_admin_teacher_partners(),public.admin_create_commission_payout(uuid,date,date,text),public.admin_mark_commission_payout_paid(uuid,text) to authenticated;
