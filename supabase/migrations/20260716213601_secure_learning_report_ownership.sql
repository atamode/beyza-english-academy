-- Forward-only hardening for parent-owned learning report snapshots.
alter table public.learning_report_snapshots
  drop constraint if exists learning_report_snapshots_child_id_period_type_period_start_period_end_report_version_key;

alter table public.learning_report_snapshots
  add constraint learning_report_snapshots_parent_child_period_key
  unique(parent_user_id,child_id,period_type,period_start,period_end);

create or replace function public.is_current_learning_report_guardian(p_child_id uuid)
returns boolean
language sql
stable
security definer
set search_path=public
as $$
  select auth.uid() is not null
    and exists(
      select 1 from public.parent_profiles p
      where p.id=auth.uid() and p.account_type in ('parent','both')
    )
    and exists(
      select 1 from public.guardian_students g
      join public.children c on c.id=g.child_id
      where g.guardian_id=auth.uid()
        and g.child_id=p_child_id
        and coalesce(c.is_active,true)
    );
$$;
revoke all on function public.is_current_learning_report_guardian(uuid) from public,anon,authenticated;

create or replace function public.learning_report_period(p_period_type text,p_period_start date)
returns table(period_start timestamptz,period_end timestamptz)
language plpgsql
immutable
set search_path=public
as $$
begin
  if p_period_type not in ('weekly','monthly') then raise exception 'Geçersiz rapor dönemi'; end if;
  if p_period_type='weekly' and extract(isodow from p_period_start)<>1 then raise exception 'Haftalık dönem Pazartesi başlamalı'; end if;
  if p_period_type='monthly' and p_period_start<>date_trunc('month',p_period_start)::date then raise exception 'Aylık dönem ayın ilk günü başlamalı'; end if;
  period_start:=p_period_start::timestamp at time zone 'Europe/Istanbul';
  period_end:=(case when p_period_type='weekly' then p_period_start+7 else (p_period_start+interval '1 month')::date end)::timestamp at time zone 'Europe/Istanbul';
  return next;
end $$;
revoke all on function public.learning_report_period(text,date) from public,anon,authenticated;

create or replace function public.secure_learning_report_payload(p_child_id uuid,p_period_type text,p_period_start date)
returns jsonb
language plpgsql
stable
security definer
set search_path=public
as $$
declare payload jsonb; completed_count int; accuracy int; difficult_words int;
begin
  if auth.uid() is null or not public.is_current_learning_report_guardian(p_child_id) then
    raise exception 'Bu çocuk için rapor yetkiniz yok';
  end if;
  payload:=public.build_learning_report_payload(p_child_id,p_period_type,p_period_start);
  completed_count:=coalesce((payload#>>'{summary,completed_lessons}')::int,0);
  accuracy:=(payload#>>'{summary,accuracy_percent}')::int;
  difficult_words:=coalesce((payload#>>'{vocabulary,difficult}')::int,0);
  return jsonb_set(payload,'{parent_comment}',to_jsonb(case
    when not coalesce((payload->>'has_data')::boolean,false) then 'Bu dönemde rapor oluşturacak yeterli çalışma kaydı bulunmuyor.'
    when accuracy>=80 and completed_count>0 then format('Bu dönemde %s ders tamamlandı ve başarı oranı güçlü ilerledi.',completed_count)
    when difficult_words>0 then 'Bu dönemde bazı kelimeler tekrar gerektiriyor. Kelime Ligi ve kısa tekrar oturumları yararlı olacaktır.'
    else 'Düzenli kısa çalışmalar, mevcut ilerlemenin kalıcı olmasını destekleyecektir.' end));
end $$;
revoke all on function public.secure_learning_report_payload(uuid,text,date) from public,anon,authenticated;

create or replace function public.preview_learning_report(p_child_id uuid,p_period_type text,p_period_start date)
returns jsonb
language sql
stable
security definer
set search_path=public
as $$ select public.secure_learning_report_payload(p_child_id,p_period_type,p_period_start) $$;

drop policy if exists "parents read own child learning reports" on public.learning_report_snapshots;
revoke all on public.learning_report_snapshots from public,anon,authenticated;

create or replace function public.generate_learning_report(p_child_id uuid,p_period_type text,p_period_start date)
returns public.learning_report_snapshots
language plpgsql
security definer
set search_path=public
as $$
declare bounds record; result public.learning_report_snapshots; owner_id uuid:=auth.uid();
begin
  if owner_id is null or not public.is_current_learning_report_guardian(p_child_id) then
    raise exception 'Bu çocuk için rapor yetkiniz yok';
  end if;
  select * into bounds from public.learning_report_period(p_period_type,p_period_start);
  if bounds.period_end>now() then raise exception 'Aktif dönem yalnız ön izlenebilir'; end if;
  insert into public.learning_report_snapshots(parent_user_id,child_id,period_type,period_start,period_end,report_version,payload)
  values(owner_id,p_child_id,p_period_type,bounds.period_start,bounds.period_end,1,public.secure_learning_report_payload(p_child_id,p_period_type,p_period_start))
  on conflict(parent_user_id,child_id,period_type,period_start,period_end)
  do update set parent_user_id=excluded.parent_user_id
  returning * into result;
  return result;
end $$;

create or replace function public.list_my_learning_reports(p_child_id uuid)
returns setof public.learning_report_snapshots
language plpgsql
stable
security definer
set search_path=public
as $$
begin
  if auth.uid() is null or not public.is_current_learning_report_guardian(p_child_id) then
    raise exception 'Bu çocuk için rapor yetkiniz yok';
  end if;
  return query
    select r.* from public.learning_report_snapshots r
    where r.parent_user_id=auth.uid() and r.child_id=p_child_id
    order by r.period_start desc;
end $$;

create or replace function public.get_learning_report(p_report_id uuid)
returns public.learning_report_snapshots
language plpgsql
stable
security definer
set search_path=public
as $$
declare result public.learning_report_snapshots;
begin
  if auth.uid() is null then raise exception 'Oturum gerekli'; end if;
  select r.* into result from public.learning_report_snapshots r
  where r.id=p_report_id
    and r.parent_user_id=auth.uid()
    and public.is_current_learning_report_guardian(r.child_id);
  return result;
end $$;

revoke all on function public.preview_learning_report(uuid,text,date) from public,anon,authenticated;
revoke all on function public.generate_learning_report(uuid,text,date) from public,anon,authenticated;
revoke all on function public.list_my_learning_reports(uuid) from public,anon,authenticated;
revoke all on function public.get_learning_report(uuid) from public,anon,authenticated;
grant execute on function public.generate_learning_report(uuid,text,date) to authenticated;
grant execute on function public.list_my_learning_reports(uuid) to authenticated;
grant execute on function public.get_learning_report(uuid) to authenticated;
grant execute on function public.preview_learning_report(uuid,text,date) to authenticated;
