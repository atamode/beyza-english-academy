-- Poma Academy membership/payments phase 1. Apply with the Supabase CLI.
create extension if not exists pgcrypto;

create or replace function public.is_poma_admin()
returns boolean language sql stable security definer set search_path = public
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false)
      or coalesce((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean, false);
$$;
revoke all on function public.is_poma_admin() from public;
grant execute on function public.is_poma_admin() to authenticated;

create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(), code text not null unique,
  name text not null, price numeric(12,2) not null check (price >= 0),
  duration_days integer check (duration_days is null or duration_days > 0),
  child_limit integer not null check (child_limit > 0), active boolean not null default true,
  version integer not null default 1 check (version > 0), created_at timestamptz not null default now()
);
insert into public.plans(code,name,price,duration_days,child_limit,active,version) values
 ('FREE_STARTER','Ücretsiz Başlangıç',0,null,1,true,1),
 ('FAMILY_MONTHLY','Aile Aylık',299,30,5,true,1),
 ('FAMILY_YEARLY','Aile Yıllık',1990,365,5,true,1)
on conflict (code) do update set name=excluded.name, price=excluded.price,
 duration_days=excluded.duration_days, child_limit=excluded.child_limit, active=excluded.active;

create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(), code text not null unique check (code = upper(code)),
  discount_type text not null check (discount_type in ('percent','fixed','grant')),
  discount_value numeric(12,2) not null default 0 check (discount_value >= 0),
  valid_plan_codes text[] not null default '{}', max_redemptions integer check (max_redemptions is null or max_redemptions > 0),
  per_user_limit integer not null default 1 check (per_user_limit > 0), starts_at timestamptz,
  ends_at timestamptz, active boolean not null default true, grants_plan_code text references public.plans(code),
  grants_duration_days integer check (grants_duration_days is null or grants_duration_days > 0),
  created_at timestamptz not null default now(), check (ends_at is null or starts_at is null or ends_at > starts_at),
  check ((discount_type='grant' and grants_plan_code is not null) or (discount_type<>'grant' and grants_plan_code is null))
);

create sequence if not exists public.payment_code_seq minvalue 1;
create or replace function public.generate_payment_code()
returns text language plpgsql volatile security definer set search_path = public
as $$ declare token text; begin
  token := upper(substr(encode(extensions.digest(nextval('public.payment_code_seq')::text || clock_timestamp()::text || gen_random_uuid()::text,'sha256'),'hex'),1,6));
  return 'POMA-' || token;
end $$;
revoke all on function public.generate_payment_code() from public, anon, authenticated;

create table if not exists public.payment_requests (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete restrict,
  plan_id uuid not null references public.plans(id), payment_code text not null unique default public.generate_payment_code()
    check (payment_code ~ '^POMA-[A-F0-9]{6}$'),
  list_price numeric(12,2) not null check (list_price >= 0), discount_amount numeric(12,2) not null default 0,
  payable_amount numeric(12,2) not null, payment_method text not null check (payment_method in ('bank_transfer','instagram')),
  instagram_username text, sender_name text, transfer_date date,
  status text not null default 'pending' check (status in ('pending','receipt_sent','approved','rejected')),
  admin_note text, created_at timestamptz not null default now(), reviewed_at timestamptz, reviewed_by uuid references auth.users(id),
  check (discount_amount >= 0 and discount_amount <= list_price and payable_amount = list_price-discount_amount)
);

create table if not exists public.payment_receipts (
  id uuid primary key default gen_random_uuid(), payment_request_id uuid not null references public.payment_requests(id) on delete cascade,
  storage_path text not null unique, original_filename text not null, mime_type text not null
    check (mime_type in ('application/pdf','image/jpeg','image/png')),
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 10485760), uploaded_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete restrict,
  plan_id uuid not null references public.plans(id), starts_at timestamptz not null, ends_at timestamptz,
  status text not null check (status in ('active','expired','cancelled')),
  source_payment_request_id uuid unique references public.payment_requests(id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check (ends_at is null or ends_at > starts_at)
);
create index if not exists subscriptions_user_status_idx on public.subscriptions(user_id,status,ends_at);

create table if not exists public.coupon_redemptions (
  id uuid primary key default gen_random_uuid(), coupon_id uuid not null references public.coupons(id),
  user_id uuid not null references auth.users(id), payment_request_id uuid not null unique references public.payment_requests(id) on delete cascade,
  discount_amount numeric(12,2) not null check (discount_amount >= 0), redeemed_at timestamptz not null default now()
);

alter table public.plans enable row level security; alter table public.payment_requests enable row level security;
alter table public.payment_receipts enable row level security; alter table public.subscriptions enable row level security;
alter table public.coupons enable row level security; alter table public.coupon_redemptions enable row level security;
grant select on public.plans,public.payment_requests,public.payment_receipts,
 public.subscriptions,public.coupons,public.coupon_redemptions to authenticated;
drop policy if exists "active plans are readable" on public.plans;
drop policy if exists "own payments readable" on public.payment_requests;
drop policy if exists "own receipts readable" on public.payment_receipts;
drop policy if exists "own subscriptions readable" on public.subscriptions;
drop policy if exists "admin coupons readable" on public.coupons;
drop policy if exists "own redemptions readable" on public.coupon_redemptions;
create policy "active plans are readable" on public.plans for select to authenticated using (active or public.is_poma_admin());
create policy "own payments readable" on public.payment_requests for select to authenticated using (user_id=auth.uid() or public.is_poma_admin());
create policy "own receipts readable" on public.payment_receipts for select to authenticated using
 (uploaded_by=auth.uid() or public.is_poma_admin());
create policy "own subscriptions readable" on public.subscriptions for select to authenticated using
 (user_id=auth.uid() or public.is_poma_admin());
create policy "admin coupons readable" on public.coupons for select to authenticated using (public.is_poma_admin());
create policy "own redemptions readable" on public.coupon_redemptions for select to authenticated using
 (user_id=auth.uid() or public.is_poma_admin());

-- All writes pass through functions so callers cannot submit prices, owners or review state.
create or replace function public.quote_coupon(p_plan_code text, p_coupon_code text)
returns table(coupon_id uuid, discount_amount numeric, grants_plan_code text, grants_duration_days integer)
language plpgsql security definer set search_path=public as $$
declare c public.coupons; p public.plans; total_count int; user_count int;
begin
 if auth.uid() is null then raise exception 'Oturum gerekli'; end if;
 select * into p from public.plans where code=p_plan_code and active for share;
 if not found then raise exception 'Plan bulunamadı veya aktif değil'; end if;
 select * into c from public.coupons where code=upper(trim(p_coupon_code)) for update;
 if not found or not c.active or (c.starts_at is not null and now()<c.starts_at) or (c.ends_at is not null and now()>=c.ends_at)
 then raise exception 'Kupon geçersiz veya süresi dolmuş'; end if;
 if cardinality(c.valid_plan_codes)>0 and not p.code=any(c.valid_plan_codes) then raise exception 'Kupon bu planda geçerli değil'; end if;
 select count(*) into total_count from public.coupon_redemptions where coupon_redemptions.coupon_id=c.id;
 select count(*) into user_count from public.coupon_redemptions where coupon_redemptions.coupon_id=c.id and user_id=auth.uid();
 if c.max_redemptions is not null and total_count>=c.max_redemptions then raise exception 'Kupon kullanım limiti doldu'; end if;
 if user_count>=c.per_user_limit then raise exception 'Kullanıcı kupon limiti doldu'; end if;
 return query select c.id, case c.discount_type when 'percent' then least(p.price,round(p.price*c.discount_value/100,2))
   when 'fixed' then least(p.price,c.discount_value) else p.price end, c.grants_plan_code,c.grants_duration_days;
end $$;

create or replace function public.validate_coupon(p_plan_code text,p_coupon_code text)
returns table(discount_amount numeric,payable_amount numeric,grants_plan_code text,grants_duration_days integer)
language sql security definer set search_path=public as $$
 select q.discount_amount,p.price-q.discount_amount,q.grants_plan_code,q.grants_duration_days
 from public.quote_coupon(p_plan_code,p_coupon_code) q join public.plans p on p.code=p_plan_code;
$$;

create or replace function public.create_payment_request(p_plan_code text,p_payment_method text,p_coupon_code text default null,
 p_instagram_username text default null,p_sender_name text default null,p_transfer_date date default null)
returns public.payment_requests language plpgsql security definer set search_path=public as $$
declare p public.plans; v_coupon_id uuid; v_discount numeric(12,2):=0; result public.payment_requests;
begin
 if auth.uid() is null then raise exception 'Oturum gerekli'; end if;
 select * into p from public.plans where code=p_plan_code and active and price>0;
 if not found then raise exception 'Ücretli aktif plan bulunamadı'; end if;
 if p_payment_method not in ('bank_transfer','instagram') then raise exception 'Geçersiz ödeme yöntemi'; end if;
 if nullif(trim(p_coupon_code),'') is not null then
   select coupon_id,discount_amount into v_coupon_id,v_discount from public.quote_coupon(p_plan_code,p_coupon_code);
 end if;
 insert into public.payment_requests(user_id,plan_id,list_price,discount_amount,payable_amount,payment_method,instagram_username,sender_name,transfer_date)
 values(auth.uid(),p.id,p.price,v_discount,p.price-v_discount,p_payment_method,
 nullif(trim(p_instagram_username),''),nullif(trim(p_sender_name),''),p_transfer_date) returning * into result;
 if v_coupon_id is not null then insert into public.coupon_redemptions(coupon_id,user_id,payment_request_id,discount_amount)
 values(v_coupon_id,auth.uid(),result.id,v_discount); end if;
 return result;
end $$;

create or replace function public.mark_instagram_receipt_sent(p_payment_request_id uuid,p_instagram_username text)
returns public.payment_requests language plpgsql security definer set search_path=public as $$ declare r public.payment_requests; begin
 update public.payment_requests set status='receipt_sent',instagram_username=nullif(trim(p_instagram_username),'')
 where id=p_payment_request_id and user_id=auth.uid() and status='pending' and payment_method='instagram' returning * into r;
 if not found then raise exception 'Ödeme talebi güncellenemedi'; end if; return r; end $$;

create or replace function public.review_payment(p_payment_request_id uuid,p_decision text,p_admin_note text default null)
returns public.payment_requests language plpgsql security definer set search_path=public as $$
declare r public.payment_requests; p public.plans; base timestamptz; finish timestamptz; grant_days int; grant_plan_id uuid;
begin
 if not public.is_poma_admin() then raise exception 'Yönetici yetkisi gerekli'; end if;
 if p_decision not in ('approved','rejected') then raise exception 'Geçersiz karar'; end if;
 if p_decision='rejected' and nullif(trim(p_admin_note),'') is null then raise exception 'Red notu zorunlu'; end if;
 select * into r from public.payment_requests where id=p_payment_request_id for update;
 if not found or r.status not in ('pending','receipt_sent') then raise exception 'Ödeme daha önce incelendi veya bulunamadı'; end if;
 update public.payment_requests set status=p_decision,admin_note=nullif(trim(p_admin_note),''),reviewed_at=now(),reviewed_by=auth.uid()
 where id=r.id returning * into r;
 if p_decision='approved' then
   select * into p from public.plans where id=r.plan_id;
   select coalesce(max(ends_at),now()) into base from public.subscriptions where user_id=r.user_id and status='active' and ends_at>now();
   base:=greatest(base,now()); grant_days:=p.duration_days; grant_plan_id:=p.id;
   select coalesce(c.grants_duration_days,gp.duration_days),gp.id into grant_days,grant_plan_id
   from public.coupon_redemptions cr join public.coupons c on c.id=cr.coupon_id left join public.plans gp on gp.code=c.grants_plan_code
   where cr.payment_request_id=r.id and c.discount_type='grant';
   if not found then grant_days:=p.duration_days; grant_plan_id:=p.id; end if;
   if p.code='FAMILY_YEARLY' and grant_plan_id=p.id then finish:=base+interval '12 months';
   else finish:=base+make_interval(days=>grant_days); end if;
   insert into public.subscriptions(user_id,plan_id,starts_at,ends_at,status,source_payment_request_id)
   values(r.user_id,grant_plan_id,now(),finish,'active',r.id);
 end if; return r;
end $$;
create or replace function public.approve_payment(p_payment_request_id uuid,p_admin_note text default null)
returns public.payment_requests language sql security definer set search_path=public as $$ select public.review_payment(p_payment_request_id,'approved',p_admin_note); $$;
create or replace function public.reject_payment(p_payment_request_id uuid,p_admin_note text)
returns public.payment_requests language sql security definer set search_path=public as $$ select public.review_payment(p_payment_request_id,'rejected',p_admin_note); $$;

revoke all on function public.quote_coupon(text,text) from public,anon,authenticated;
revoke all on function public.validate_coupon(text,text) from public,anon,authenticated;
revoke all on function public.create_payment_request(text,text,text,text,text,date) from public,anon,authenticated;
revoke all on function public.mark_instagram_receipt_sent(uuid,text) from public,anon,authenticated;
revoke all on function public.review_payment(uuid,text,text) from public,anon,authenticated;
revoke all on function public.approve_payment(uuid,text) from public,anon,authenticated;
revoke all on function public.reject_payment(uuid,text) from public,anon,authenticated;
grant execute on function public.validate_coupon(text,text),public.create_payment_request(text,text,text,text,text,date),
 public.mark_instagram_receipt_sent(uuid,text),public.approve_payment(uuid,text),public.reject_payment(uuid,text) to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
 ('payment-receipts','payment-receipts',false,10485760,array['application/pdf','image/jpeg','image/png'])
on conflict(id) do update set public=false,file_size_limit=10485760,allowed_mime_types=excluded.allowed_mime_types;
drop policy if exists "owners upload payment receipts" on storage.objects;
drop policy if exists "owners read payment receipts" on storage.objects;
create policy "owners upload payment receipts" on storage.objects for insert to authenticated with check
 (bucket_id='payment-receipts' and (storage.foldername(name))[1]=auth.uid()::text and exists
  (select 1 from public.payment_requests pr where pr.id::text=(storage.foldername(name))[2] and pr.user_id=auth.uid() and pr.status in ('pending','receipt_sent')));
create policy "owners read payment receipts" on storage.objects for select to authenticated using
 (bucket_id='payment-receipts' and ((storage.foldername(name))[1]=auth.uid()::text or public.is_poma_admin()));

create or replace function public.register_payment_receipt(p_payment_request_id uuid,p_storage_path text,p_original_filename text,p_mime_type text,p_size_bytes bigint)
returns public.payment_receipts language plpgsql security definer set search_path=public as $$ declare r public.payment_receipts; begin
 if auth.uid() is null then raise exception 'Oturum gerekli'; end if;
 if p_storage_path not like auth.uid()::text||'/'||p_payment_request_id::text||'/%' then raise exception 'Geçersiz dosya yolu'; end if;
 if not exists(select 1 from public.payment_requests where id=p_payment_request_id and user_id=auth.uid() and status in ('pending','receipt_sent')) then raise exception 'Ödeme talebine erişim yok'; end if;
 if not exists(select 1 from storage.objects where bucket_id='payment-receipts' and name=p_storage_path and owner_id=auth.uid()::text) then raise exception 'Yüklenen dekont bulunamadı'; end if;
 insert into public.payment_receipts(payment_request_id,storage_path,original_filename,mime_type,size_bytes,uploaded_by)
 values(p_payment_request_id,p_storage_path,p_original_filename,p_mime_type,p_size_bytes,auth.uid()) returning * into r;
 update public.payment_requests set status='receipt_sent' where id=p_payment_request_id and status='pending'; return r; end $$;
revoke all on function public.register_payment_receipt(uuid,text,text,text,bigint) from public,anon,authenticated;
grant execute on function public.register_payment_receipt(uuid,text,text,text,bigint) to authenticated;
