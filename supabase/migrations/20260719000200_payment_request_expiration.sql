alter table public.payment_requests
  add column expires_at timestamptz,
  add column expired_at timestamptz;

alter table public.payment_requests
  drop constraint payment_requests_status_check,
  add constraint payment_requests_status_check
    check (status in ('pending','receipt_sent','approved','rejected','expired'));

update public.payment_requests
set expires_at = created_at + interval '72 hours';

with expired_requests as (
  update public.payment_requests
  set status = 'expired', expired_at = now()
  where status = 'pending'
    and expires_at <= now()
  returning id
)
delete from public.coupon_redemptions cr
using expired_requests e
where cr.payment_request_id = e.id;

alter table public.payment_requests
  alter column expires_at set default (now() + interval '72 hours'),
  alter column expires_at set not null,
  add constraint payment_requests_expiry_order_check
    check (expires_at >= created_at),
  add constraint payment_requests_expired_at_check
    check ((status = 'expired' and expired_at is not null)
      or (status <> 'expired' and expired_at is null));

create index payment_requests_pending_expiry_idx
on public.payment_requests(expires_at)
where status = 'pending';

create or replace function public.expire_stale_payment_requests(p_user_id uuid default null)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_ids uuid[];
  v_count integer := 0;
begin
  select coalesce(array_agg(locked.id order by locked.id), '{}'::uuid[])
  into v_ids
  from (
    select pr.id
    from public.payment_requests pr
    where pr.status = 'pending'
      and pr.expires_at <= now()
      and (p_user_id is null or pr.user_id = p_user_id)
    order by pr.id
    for update
  ) locked;

  update public.payment_requests pr
  set status = 'expired', expired_at = now()
  where pr.id = any(v_ids)
    and pr.status = 'pending';
  get diagnostics v_count = row_count;

  delete from public.coupon_redemptions cr
  where cr.payment_request_id = any(v_ids);

  return v_count;
end
$$;

alter function public.expire_stale_payment_requests(uuid) owner to postgres;
revoke all on function public.expire_stale_payment_requests(uuid)
from public, anon, authenticated, service_role;

create or replace function public.create_payment_request(
  p_plan_code text,
  p_payment_method text,
  p_coupon_code text default null,
  p_instagram_username text default null,
  p_sender_name text default null,
  p_transfer_date date default null,
  p_partner_code text default null
)
returns public.payment_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  p public.plans;
  v_coupon_id uuid;
  v_discount numeric(12,2) := 0;
  result public.payment_requests;
  partner public.teacher_partner_profiles;
begin
  if auth.uid() is null then raise exception 'Oturum gerekli'; end if;
  perform public.expire_stale_payment_requests(auth.uid());
  select * into p from public.plans where code=p_plan_code and active and price>0;
  if not found then raise exception 'Ücretli aktif plan bulunamadı'; end if;
  if p.code='TEACHER_MONTHLY' and not exists(select 1 from public.teacher_profiles where id=auth.uid()) then raise exception 'Bu plan yalnız öğretmen hesapları içindir'; end if;
  if p_payment_method not in('bank_transfer','instagram') then raise exception 'Geçersiz ödeme yöntemi'; end if;
  if nullif(btrim(p_coupon_code),'') is not null then
    select coupon_id,discount_amount into v_coupon_id,v_discount from public.quote_coupon(p_plan_code,p_coupon_code);
  end if;
  if p.code<>'TEACHER_MONTHLY' and nullif(btrim(p_partner_code),'') is not null then
    select pp.* into partner from public.teacher_partner_profiles pp join public.teacher_profiles tp on tp.id=pp.teacher_id
    where pp.partner_code=upper(btrim(p_partner_code)) and pp.status='active' and tp.approval_status='approved';
    if not found then raise exception 'Öğretmen kodu geçersiz veya aktif değil'; end if;
    if partner.teacher_id=auth.uid() then raise exception 'Kendi partner kodunuzu kullanamazsınız'; end if;
  end if;
  insert into public.payment_requests(user_id,plan_id,list_price,discount_amount,payable_amount,payment_method,instagram_username,sender_name,transfer_date,partner_teacher_id,partner_code,expires_at)
  values(auth.uid(),p.id,p.price,v_discount,p.price-v_discount,p_payment_method,nullif(btrim(p_instagram_username),''),nullif(btrim(p_sender_name),''),p_transfer_date,partner.teacher_id,partner.partner_code,now()+interval '72 hours')
  returning * into result;
  if v_coupon_id is not null then
    insert into public.coupon_redemptions(coupon_id,user_id,payment_request_id,discount_amount)
    values(v_coupon_id,auth.uid(),result.id,v_discount);
  end if;
  return result;
end
$$;

drop function public.list_admin_payments();

create function public.list_admin_payments()
returns table(
  id uuid, user_id uuid, user_email text, plan_code text, plan_name text,
  payment_code text, list_price numeric, discount_amount numeric, payable_amount numeric,
  payment_method text, instagram_username text, sender_name text, transfer_date date,
  status text, admin_note text, created_at timestamptz, reviewed_at timestamptz,
  expires_at timestamptz, expired_at timestamptz,
  current_subscription_ends_at timestamptz, receipts jsonb
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_poma_admin() then raise exception 'Yönetici yetkisi gerekli'; end if;
  perform public.expire_stale_payment_requests(null);
  return query
  select pr.id,pr.user_id,u.email::text,p.code,p.name,pr.payment_code,pr.list_price,
    pr.discount_amount,pr.payable_amount,pr.payment_method,pr.instagram_username,
    pr.sender_name,pr.transfer_date,pr.status,pr.admin_note,pr.created_at,pr.reviewed_at,
    pr.expires_at,pr.expired_at,
    (select max(s.ends_at) from public.subscriptions s where s.user_id=pr.user_id and s.status='active' and s.ends_at>now()),
    coalesce((select jsonb_agg(jsonb_build_object(
      'id',r.id,'storage_path',r.storage_path,'original_filename',r.original_filename,
      'mime_type',r.mime_type,'size_bytes',r.size_bytes,'created_at',r.created_at
    ) order by r.created_at desc) from public.payment_receipts r where r.payment_request_id=pr.id),'[]'::jsonb)
  from public.payment_requests pr
  join public.plans p on p.id=pr.plan_id
  join auth.users u on u.id=pr.user_id
  order by pr.created_at desc;
end
$$;

revoke all on function public.list_admin_payments() from public, anon, authenticated, service_role;
grant execute on function public.list_admin_payments() to authenticated;

create or replace function public.register_payment_receipt(p_payment_request_id uuid,p_storage_path text,p_original_filename text,p_mime_type text,p_size_bytes bigint)
returns public.payment_receipts language plpgsql security definer set search_path=public as $$
declare r public.payment_receipts;v_payment public.payment_requests;
begin
  if auth.uid() is null then raise exception 'Oturum gerekli'; end if;
  perform public.expire_stale_payment_requests(auth.uid());
  select * into v_payment from public.payment_requests where id=p_payment_request_id and user_id=auth.uid() for update;
  if not found then raise exception 'Ödeme talebine erişim yok'; end if;
  if v_payment.status='expired' then raise exception 'Ödeme talebinin süresi dolmuş. Yeni talep oluşturun.'; end if;
  if v_payment.status not in('pending','receipt_sent') then raise exception 'Ödeme talebine erişim yok'; end if;
  if v_payment.status='pending' and v_payment.expires_at<=now() then raise exception 'Ödeme talebinin süresi dolmuş. Yeni talep oluşturun.'; end if;
  if p_storage_path not like auth.uid()::text||'/'||p_payment_request_id::text||'/%' then raise exception 'Geçersiz dosya yolu'; end if;
  if not exists(select 1 from storage.objects where bucket_id='payment-receipts' and name=p_storage_path and owner_id=auth.uid()::text) then raise exception 'Yüklenen dekont bulunamadı'; end if;
  insert into public.payment_receipts(payment_request_id,storage_path,original_filename,mime_type,size_bytes,uploaded_by)
  values(p_payment_request_id,p_storage_path,p_original_filename,p_mime_type,p_size_bytes,auth.uid()) returning * into r;
  update public.payment_requests set status='receipt_sent' where id=p_payment_request_id and status='pending';
  return r;
end $$;

create or replace function public.mark_instagram_receipt_sent(p_payment_request_id uuid,p_instagram_username text)
returns public.payment_requests language plpgsql security definer set search_path=public as $$
declare r public.payment_requests;v_payment public.payment_requests;
begin
  perform public.expire_stale_payment_requests(auth.uid());
  select * into v_payment from public.payment_requests where id=p_payment_request_id and user_id=auth.uid() for update;
  if not found then raise exception 'Ödeme talebi güncellenemedi'; end if;
  if v_payment.status='expired' or (v_payment.status='pending' and v_payment.expires_at<=now()) then
    raise exception 'Ödeme talebinin süresi dolmuş. Yeni talep oluşturun.';
  end if;
  update public.payment_requests set status='receipt_sent',instagram_username=nullif(trim(p_instagram_username),'')
  where id=p_payment_request_id and user_id=auth.uid() and status='pending' and expires_at>now() and payment_method='instagram' returning * into r;
  if not found then raise exception 'Ödeme talebi güncellenemedi'; end if;
  return r;
end $$;

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
