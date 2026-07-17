-- Reserve each commission earning to exactly one payout (live migration 20260717083904).
do $$
begin
  if exists (select 1 from public.teacher_commission_payouts) then
    raise exception 'Existing commission payouts require a manual payout_id backfill';
  end if;
end
$$;

alter table public.teacher_commission_earnings
  add column payout_id uuid null
  references public.teacher_commission_payouts(id) on delete restrict;

create index teacher_commission_earnings_payout_id_idx
  on public.teacher_commission_earnings(payout_id);

alter table public.teacher_commission_earnings
  drop constraint teacher_commission_earnings_status_check;
alter table public.teacher_commission_earnings
  add constraint teacher_commission_earnings_status_check
  check (status in ('pending','payable','pending_payout','paid','cancelled'));
alter table public.teacher_commission_earnings
  add constraint teacher_commission_earnings_payout_state_check
  check (
    (status in ('pending','payable') and payout_id is null)
    or (status in ('pending_payout','paid') and payout_id is not null)
    or status = 'cancelled'
  );

alter table public.teacher_commission_payouts
  add column cancelled_at timestamptz;

create or replace function public.admin_create_commission_payout(
  p_teacher_id uuid,
  p_period_start date,
  p_period_end date,
  p_admin_note text default null
)
returns public.teacher_commission_payouts
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_earning_ids uuid[];
  v_earning_count integer;
  v_amount numeric(12,2);
  v_reserved_count integer;
  v_reserved_amount numeric(12,2);
  v_result public.teacher_commission_payouts;
begin
  if not public.is_poma_admin() then
    raise exception 'Yönetici yetkisi gerekli';
  end if;
  if p_teacher_id is null or p_period_start is null or p_period_end is null or p_period_end < p_period_start then
    raise exception 'Geçerli öğretmen ve payout tarihleri gerekli';
  end if;

  select array_agg(locked.id order by locked.id), count(*)::integer, sum(locked.commission_amount)::numeric(12,2)
    into v_earning_ids, v_earning_count, v_amount
  from (
    select e.id, e.commission_amount
    from public.teacher_commission_earnings e
    where e.teacher_id = p_teacher_id
      and e.status = 'payable'
      and e.payout_id is null
      and e.earned_at::date between p_period_start and p_period_end
    order by e.id
    for update
  ) locked;

  if coalesce(v_earning_count, 0) = 0 or coalesce(v_amount, 0) <= 0 then
    raise exception 'Ödenecek yeni komisyon bulunamadı';
  end if;

  insert into public.teacher_commission_payouts(
    teacher_id, amount, period_start, period_end, admin_note, created_by
  ) values (
    p_teacher_id, v_amount, p_period_start, p_period_end,
    nullif(btrim(p_admin_note), ''), (select auth.uid())
  ) returning * into v_result;

  update public.teacher_commission_earnings e
  set status = 'pending_payout', payout_id = v_result.id
  where e.id = any(v_earning_ids)
    and e.status = 'payable'
    and e.payout_id is null;
  get diagnostics v_reserved_count = row_count;

  select coalesce(sum(e.commission_amount), 0)::numeric(12,2)
    into v_reserved_amount
  from public.teacher_commission_earnings e
  where e.payout_id = v_result.id and e.status = 'pending_payout';

  if v_reserved_count <> v_earning_count or v_reserved_amount <> v_result.amount then
    raise exception 'Payout rezervasyon toplamı doğrulanamadı';
  end if;

  insert into public.teacher_partner_audit(
    teacher_id, actor_user_id, action, entity_type, entity_id, new_values
  ) values (
    p_teacher_id, (select auth.uid()), 'payout_created', 'commission_payout', v_result.id,
    jsonb_build_object('payout_id',v_result.id,'teacher_id',p_teacher_id,'earning_count',v_earning_count,
      'amount',v_result.amount,'period_start',p_period_start,'period_end',p_period_end)
  );
  return v_result;
end
$$;

create or replace function public.admin_mark_commission_payout_paid(
  p_payout_id uuid,
  p_admin_note text default null
)
returns public.teacher_commission_payouts
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_result public.teacher_commission_payouts;
  v_earning_ids uuid[];
  v_earning_count integer;
  v_amount numeric(12,2);
begin
  if not public.is_poma_admin() then
    raise exception 'Yönetici yetkisi gerekli';
  end if;
  select * into v_result
  from public.teacher_commission_payouts p
  where p.id = p_payout_id
  for update;
  if not found or v_result.status <> 'pending' then
    raise exception 'Payout bulunamadı veya pending durumda değil';
  end if;

  select array_agg(locked.id order by locked.id), count(*)::integer,
      coalesce(sum(locked.commission_amount),0)::numeric(12,2)
    into v_earning_ids, v_earning_count, v_amount
  from (
    select e.id,e.commission_amount
    from public.teacher_commission_earnings e
    where e.payout_id = p_payout_id and e.status = 'pending_payout'
    order by e.id
    for update
  ) locked;
  if v_earning_count = 0 then
    raise exception 'Payout için rezerve edilmiş komisyon bulunamadı';
  end if;
  if v_amount <> v_result.amount then
    raise exception 'Payout ve bağlı komisyon toplamı eşleşmiyor';
  end if;

  update public.teacher_commission_payouts p
  set status = 'paid', paid_at = now(),
      admin_note = coalesce(nullif(btrim(p_admin_note),''), p.admin_note)
  where p.id = p_payout_id
  returning * into v_result;
  update public.teacher_commission_earnings e
  set status = 'paid', paid_at = v_result.paid_at
  where e.id = any(v_earning_ids)
    and e.payout_id = p_payout_id and e.status = 'pending_payout';

  insert into public.teacher_partner_audit(
    teacher_id, actor_user_id, action, entity_type, entity_id, new_values
  ) values (
    v_result.teacher_id, (select auth.uid()), 'payout_paid', 'commission_payout', v_result.id,
    jsonb_build_object('payout_id',v_result.id,'teacher_id',v_result.teacher_id,
      'earning_count',v_earning_count,'amount',v_result.amount,'paid_at',v_result.paid_at)
  );
  return v_result;
end
$$;

create or replace function public.admin_cancel_commission_payout(
  p_payout_id uuid,
  p_admin_note text
)
returns public.teacher_commission_payouts
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_result public.teacher_commission_payouts;
  v_earning_count integer;
begin
  if not public.is_poma_admin() then
    raise exception 'Yönetici yetkisi gerekli';
  end if;
  if nullif(btrim(p_admin_note),'') is null then
    raise exception 'Payout iptal notu gerekli';
  end if;
  select * into v_result
  from public.teacher_commission_payouts p
  where p.id = p_payout_id
  for update;
  if not found or v_result.status <> 'pending' then
    raise exception 'Yalnız pending payout iptal edilebilir';
  end if;

  update public.teacher_commission_earnings e
  set status = 'payable', payout_id = null
  where e.payout_id = p_payout_id and e.status = 'pending_payout';
  get diagnostics v_earning_count = row_count;
  if v_earning_count = 0 then
    raise exception 'Payout için rezerve edilmiş komisyon bulunamadı';
  end if;

  update public.teacher_commission_payouts p
  set status = 'cancelled', cancelled_at = now(), admin_note = btrim(p_admin_note)
  where p.id = p_payout_id
  returning * into v_result;

  insert into public.teacher_partner_audit(
    teacher_id, actor_user_id, action, entity_type, entity_id, new_values
  ) values (
    v_result.teacher_id, (select auth.uid()), 'payout_cancelled', 'commission_payout', v_result.id,
    jsonb_build_object('payout_id',v_result.id,'teacher_id',v_result.teacher_id,
      'earning_count',v_earning_count,'amount',v_result.amount,'admin_note',v_result.admin_note)
  );
  return v_result;
end
$$;

create or replace function public.list_admin_commission_payouts(p_status text default null)
returns table(
  id uuid, teacher_id uuid, teacher_display_name text, amount numeric,
  period_start date, period_end date, status text, created_at timestamptz,
  paid_at timestamptz, cancelled_at timestamptz, admin_note text, earning_count bigint
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_poma_admin() then
    raise exception 'Yönetici yetkisi gerekli';
  end if;
  if p_status is not null and p_status not in ('pending','paid','cancelled') then
    raise exception 'Geçersiz payout durumu';
  end if;
  return query
  select p.id,p.teacher_id,t.display_name,p.amount,p.period_start,p.period_end,p.status,
    p.created_at,p.paid_at,p.cancelled_at,p.admin_note,count(e.id)
  from public.teacher_commission_payouts p
  join public.teacher_profiles t on t.id=p.teacher_id
  left join public.teacher_commission_earnings e on e.payout_id=p.id
  where p_status is null or p.status=p_status
  group by p.id,t.display_name
  order by p.created_at desc;
end
$$;

create or replace function public.get_my_partner_summary()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object('partner_code',p.partner_code,'status',p.status,'commission_rate',p.commission_rate,
    'monthly_access_price',p.monthly_access_price,'access_ends_at',p.access_ends_at,
    'has_full_access',t.approval_status='approved' and p.status='active' and p.access_ends_at>now(),
    'total_students',(select count(*) from public.teacher_referrals r where r.teacher_id=p.teacher_id),
    'students_this_month',(select count(*) from public.teacher_referrals r where r.teacher_id=p.teacher_id and r.qualified_at>=date_trunc('month',now())),
    'earned_access_days',(select coalesce(sum(c.days),0) from public.teacher_access_credits c where c.teacher_id=p.teacher_id),
    'remaining_access_days',greatest(0,ceil(extract(epoch from(p.access_ends_at-now()))/86400)),
    'total_commission',(select coalesce(sum(e.commission_amount),0) from public.teacher_commission_earnings e where e.teacher_id=p.teacher_id and e.status<>'cancelled'),
    'payable_commission',(select coalesce(sum(e.commission_amount),0) from public.teacher_commission_earnings e where e.teacher_id=p.teacher_id and e.status='payable'),
    'pending_payout_commission',(select coalesce(sum(e.commission_amount),0) from public.teacher_commission_earnings e where e.teacher_id=p.teacher_id and e.status='pending_payout'),
    'paid_commission',(select coalesce(sum(e.commission_amount),0) from public.teacher_commission_earnings e where e.teacher_id=p.teacher_id and e.status='paid'))
  from public.teacher_partner_profiles p
  join public.teacher_profiles t on t.id=p.teacher_id
  where p.teacher_id=(select auth.uid());
$$;

revoke all on function public.admin_create_commission_payout(uuid,date,date,text),
  public.admin_mark_commission_payout_paid(uuid,text),
  public.admin_cancel_commission_payout(uuid,text),
  public.list_admin_commission_payouts(text),
  public.get_my_partner_summary()
from public, anon, authenticated;
grant execute on function public.admin_create_commission_payout(uuid,date,date,text),
  public.admin_mark_commission_payout_paid(uuid,text),
  public.admin_cancel_commission_payout(uuid,text),
  public.list_admin_commission_payouts(text),
  public.get_my_partner_summary()
to authenticated;
