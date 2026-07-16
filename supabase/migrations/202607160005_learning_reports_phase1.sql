-- Poma Academy Faz 4A: immutable, server-generated parent learning reports.
create table if not exists public.learning_report_snapshots (
  id uuid primary key default gen_random_uuid(),
  parent_user_id uuid not null references auth.users(id) on delete restrict,
  child_id uuid not null references public.children(id) on delete restrict,
  period_type text not null check (period_type in ('weekly','monthly')),
  period_start timestamptz not null,
  period_end timestamptz not null check (period_end > period_start),
  generated_at timestamptz not null default now(),
  report_version integer not null default 1 check (report_version > 0),
  payload jsonb not null,
  created_at timestamptz not null default now(),
  unique(child_id,period_type,period_start,period_end,report_version)
);
create index if not exists learning_reports_parent_child_idx on public.learning_report_snapshots(parent_user_id,child_id,period_start desc);
alter table public.learning_report_snapshots enable row level security;

create or replace function public.can_parent_access_learning_report_child(p_child_id uuid)
returns boolean language sql stable security definer set search_path=public as $$
  select public.is_poma_admin() or (
    exists(select 1 from public.parent_profiles p where p.id=auth.uid() and p.account_type in ('parent','both'))
    and exists(select 1 from public.guardian_students g where g.guardian_id=auth.uid() and g.child_id=p_child_id)
    and exists(select 1 from public.children c where c.id=p_child_id and coalesce(c.is_active,true))
  );
$$;
revoke all on function public.can_parent_access_learning_report_child(uuid) from public,anon,authenticated;

drop policy if exists "parents read own child learning reports" on public.learning_report_snapshots;
create policy "parents read own child learning reports" on public.learning_report_snapshots for select to authenticated
using (public.is_poma_admin() or (parent_user_id=auth.uid() and public.can_parent_access_learning_report_child(child_id)));
revoke all on public.learning_report_snapshots from public,anon,authenticated;
grant select on public.learning_report_snapshots to authenticated;

create or replace function public.learning_report_period(p_period_type text,p_period_start date)
returns table(period_start timestamptz,period_end timestamptz)
language plpgsql immutable set search_path=public as $$
begin
  if p_period_type not in ('weekly','monthly') then raise exception 'Geçersiz rapor dönemi'; end if;
  if p_period_type='weekly' and extract(isodow from p_period_start)<>1 then raise exception 'Haftalık dönem Pazartesi başlamalı'; end if;
  if p_period_type='monthly' and p_period_start<>date_trunc('month',p_period_start)::date then raise exception 'Aylık dönem ayın ilk günü başlamalı'; end if;
  period_start:=p_period_start::timestamp at time zone 'Europe/Istanbul';
  period_end:=(case when p_period_type='weekly' then p_period_start+7 else (p_period_start+interval '1 month')::date end)::timestamp at time zone 'Europe/Istanbul';
  return next;
end $$;
revoke all on function public.learning_report_period(text,date) from public,anon,authenticated;

create or replace function public.learning_report_safe_timestamptz(p_value text)
returns timestamptz language plpgsql immutable set search_path=public as $$
begin return nullif(p_value,'')::timestamptz; exception when others then return null; end $$;
revoke all on function public.learning_report_safe_timestamptz(text) from public,anon,authenticated;

create or replace function public.build_learning_report_payload(p_child_id uuid,p_period_type text,p_period_start date)
returns jsonb language plpgsql stable security definer set search_path=public as $$
declare s jsonb:='{}'::jsonb; bounds record; lesson record; answer record; word record;
  completed_count int:=0; started_count int:=0; total_answers int:=0; correct_answers int:=0; wrong_answers int:=0;
  seen_words int:=0; mastered_words int:=0; due_words int:=0; difficult_words int:=0;
  strong jsonb:='[]'::jsonb; review jsonb:='[]'::jsonb; accuracy int:=null; comment text;
begin
  if not public.can_parent_access_learning_report_child(p_child_id) then raise exception 'Bu çocuk için rapor yetkiniz yok'; end if;
  select * into bounds from public.learning_report_period(p_period_type,p_period_start);
  select coalesce(state,'{}'::jsonb) into s from public.student_state where child_id=p_child_id;
  s:=coalesce(s,'{}'::jsonb);
  for lesson in select key,value from jsonb_each(coalesce(s->'lessonProgress','{}'::jsonb)) loop
    if coalesce((lesson.value->>'completed')::boolean,false) and public.learning_report_safe_timestamptz(lesson.value->>'completedAt')>=bounds.period_start and public.learning_report_safe_timestamptz(lesson.value->>'completedAt')<bounds.period_end then
      completed_count:=completed_count+1;
      for answer in select key,value from jsonb_each(coalesce(lesson.value->'answers','{}'::jsonb)) loop
        if coalesce((answer.value->>'completed')::boolean,false) then
          total_answers:=total_answers+1;
          if coalesce((answer.value->>'wrongCount')::int,0)+coalesce((answer.value->>'wrongAttempts')::int,0)>0 then wrong_answers:=wrong_answers+1; else correct_answers:=correct_answers+1; end if;
        end if;
      end loop;
    elsif not coalesce((lesson.value->>'completed')::boolean,false) and public.learning_report_safe_timestamptz(lesson.value->>'startedAt')>=bounds.period_start and public.learning_report_safe_timestamptz(lesson.value->>'startedAt')<bounds.period_end then started_count:=started_count+1;
    end if;
  end loop;
  for word in select key,value from jsonb_each(coalesce(s->'vocabularyProgress','{}'::jsonb)) loop
    if public.learning_report_safe_timestamptz(word.value->>'lastSeen')>=bounds.period_start and public.learning_report_safe_timestamptz(word.value->>'lastSeen')<bounds.period_end then
      seen_words:=seen_words+1;
      if word.value->>'status'='learned' then mastered_words:=mastered_words+1; end if;
      if word.value->>'status'='difficult' then difficult_words:=difficult_words+1; end if;
      if public.learning_report_safe_timestamptz(word.value->>'dueAt')<=now() then due_words:=due_words+1; end if;
    end if;
  end loop;
  if total_answers>0 then accuracy:=least(100,greatest(0,round(correct_answers*100.0/total_answers)::int)); end if;
  if public.learning_report_safe_timestamptz(s#>>'{diagnostic,completedAt}')>=bounds.period_start and public.learning_report_safe_timestamptz(s#>>'{diagnostic,completedAt}')<bounds.period_end then
    select coalesce(jsonb_agg(jsonb_build_object('label',x->>'label','percent',least(100,greatest(0,(x->>'percent')::int))) order by (x->>'percent')::int desc) filter(where (x->>'percent')::int>=75),'[]'::jsonb),
           coalesce(jsonb_agg(jsonb_build_object('label',x->>'label','percent',least(100,greatest(0,(x->>'percent')::int))) order by (x->>'percent')::int asc) filter(where (x->>'percent')::int<60),'[]'::jsonb)
      into strong,review from jsonb_array_elements(coalesce(s#>'{diagnostic,skillGroups}','[]'::jsonb)) x;
  end if;
  comment:=case when completed_count=0 and total_answers=0 and seen_words=0 then 'Bu dönemde rapor oluşturacak yeterli çalışma kaydı bulunmuyor.'
    when accuracy>=80 and completed_count>0 then format('Bu dönemde %s ders tamamlandı ve başarı oranı güçlü ilerledi.',completed_count)
    when difficult_words>0 then 'Bu dönemde bazı kelimeler tekrar gerektiriyor. Kelime Ligi ve kısa tekrar oturumları yararlı olacaktır.'
    else 'Düzenli kısa çalışmalar, mevcut ilerlemenin kalıcı olmasını destekleyecektir.' end;
  return jsonb_build_object('schema_version',1,'period',jsonb_build_object('type',p_period_type,'start',bounds.period_start,'end',bounds.period_end),
    'summary',jsonb_build_object('completed_lessons',completed_count,'started_lessons',started_count,'total_answers',total_answers,'correct_answers',correct_answers,'wrong_answers',wrong_answers,'accuracy_percent',accuracy),
    'topics',jsonb_build_object('strong',coalesce((select jsonb_agg(v) from (select value v from jsonb_array_elements(strong) limit 3) q),'[]'::jsonb),'review',coalesce((select jsonb_agg(v) from (select value v from jsonb_array_elements(review) limit 3) q),'[]'::jsonb)),
    'vocabulary',jsonb_build_object('seen',seen_words,'mastered',mastered_words,'due',due_words,'difficult',difficult_words),
    'games',null,'stories',null,'habits',null,'parent_comment',comment,'has_data',(completed_count+started_count+total_answers+seen_words)>0);
end $$;
revoke all on function public.build_learning_report_payload(uuid,text,date) from public,anon,authenticated;

create or replace function public.preview_learning_report(p_child_id uuid,p_period_type text,p_period_start date)
returns jsonb language sql stable security definer set search_path=public as $$ select public.build_learning_report_payload(p_child_id,p_period_type,p_period_start) $$;
revoke all on function public.preview_learning_report(uuid,text,date) from public,anon;
grant execute on function public.preview_learning_report(uuid,text,date) to authenticated;

create or replace function public.generate_learning_report(p_child_id uuid,p_period_type text,p_period_start date)
returns public.learning_report_snapshots language plpgsql security definer set search_path=public as $$
declare bounds record; result public.learning_report_snapshots; owner_id uuid;
begin
  if not public.can_parent_access_learning_report_child(p_child_id) then raise exception 'Bu çocuk için rapor yetkiniz yok'; end if;
  select * into bounds from public.learning_report_period(p_period_type,p_period_start);
  if bounds.period_end>now() then raise exception 'Aktif dönem yalnız ön izlenebilir'; end if;
  owner_id:=case when public.is_poma_admin() then (select guardian_id from public.guardian_students where child_id=p_child_id limit 1) else auth.uid() end;
  insert into public.learning_report_snapshots(parent_user_id,child_id,period_type,period_start,period_end,report_version,payload)
  values(owner_id,p_child_id,p_period_type,bounds.period_start,bounds.period_end,1,public.build_learning_report_payload(p_child_id,p_period_type,p_period_start))
  on conflict(child_id,period_type,period_start,period_end,report_version) do nothing;
  select * into result from public.learning_report_snapshots where parent_user_id=owner_id and child_id=p_child_id and period_type=p_period_type and period_start=bounds.period_start and period_end=bounds.period_end and report_version=1;
  if result.id is null then raise exception 'Bu dönem başka bir veli snapshotına ait'; end if;
  return result;
end $$;
revoke all on function public.generate_learning_report(uuid,text,date) from public,anon;
grant execute on function public.generate_learning_report(uuid,text,date) to authenticated;

create or replace function public.list_my_learning_reports(p_child_id uuid)
returns setof public.learning_report_snapshots language sql stable security definer set search_path=public as $$
  select r.* from public.learning_report_snapshots r where r.child_id=p_child_id and public.can_parent_access_learning_report_child(p_child_id) order by r.period_start desc;
$$;
revoke all on function public.list_my_learning_reports(uuid) from public,anon;
grant execute on function public.list_my_learning_reports(uuid) to authenticated;

create or replace function public.get_learning_report(p_report_id uuid)
returns public.learning_report_snapshots language sql stable security definer set search_path=public as $$
  select r.* from public.learning_report_snapshots r where r.id=p_report_id and (public.is_poma_admin() or (r.parent_user_id=auth.uid() and public.can_parent_access_learning_report_child(r.child_id)));
$$;
revoke all on function public.get_learning_report(uuid) from public,anon;
grant execute on function public.get_learning_report(uuid) to authenticated;
