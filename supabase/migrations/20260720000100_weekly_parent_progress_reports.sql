-- Weekly parent progress reports. Feature ships disabled; no historical backfill is created.
create extension if not exists pg_cron;
create extension if not exists pg_net;

create table public.weekly_parent_report_settings(
  key text primary key check(key='weekly_parent_reports_enabled'),
  enabled boolean not null default false,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);
insert into public.weekly_parent_report_settings(key,enabled) values('weekly_parent_reports_enabled',false) on conflict(key) do nothing;
alter table public.weekly_parent_report_settings enable row level security;
revoke all on table public.weekly_parent_report_settings from public,anon,authenticated,service_role;

create table public.weekly_parent_report_preferences(
  parent_user_id uuid primary key references auth.users(id) on delete cascade,
  weekly_progress_email_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.weekly_parent_report_preferences enable row level security;
create policy "parents read own weekly report preference" on public.weekly_parent_report_preferences for select to authenticated using(parent_user_id=auth.uid());
revoke all on table public.weekly_parent_report_preferences from public,anon,authenticated,service_role;
grant select on table public.weekly_parent_report_preferences to authenticated;

create table public.student_learning_events(
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children(id) on delete restrict,
  parent_user_id uuid not null references auth.users(id) on delete restrict,
  event_type text not null check(event_type in('lesson_started','lesson_completed','question_answered','word_practiced','game_completed','story_completed','review_completed')),
  content_type text check(content_type is null or content_type in('lesson','question','word','game','story','review')),
  content_id text check(content_id is null or char_length(content_id) between 1 and 160),
  lesson_id text check(lesson_id is null or char_length(lesson_id) between 1 and 160),
  topic_key text check(topic_key is null or char_length(topic_key) between 1 and 120),
  is_correct boolean,
  score_delta integer not null default 0 check(score_delta between 0 and 20),
  duration_seconds integer,
  metadata jsonb not null default '{}'::jsonb check(jsonb_typeof(metadata)='object' and pg_column_size(metadata)<=2048),
  idempotency_key text not null check(idempotency_key~'^[A-Za-z0-9:_-]{8,160}$'),
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique(child_id,idempotency_key),
  check(duration_seconds is null),
  check((event_type='question_answered' and is_correct is not null) or (event_type<>'question_answered' and is_correct is null))
);
create index student_learning_events_child_period_idx on public.student_learning_events(child_id,occurred_at);
create index student_learning_events_parent_period_idx on public.student_learning_events(parent_user_id,occurred_at);
alter table public.student_learning_events enable row level security;
create policy "parents read own child learning events" on public.student_learning_events for select to authenticated using(parent_user_id=auth.uid() and exists(select 1 from public.guardian_students g where g.guardian_id=auth.uid() and g.child_id=student_learning_events.child_id));
revoke all on table public.student_learning_events from public,anon,authenticated,service_role;
grant select on table public.student_learning_events to authenticated;

create table public.student_weekly_reports(
  id uuid primary key default gen_random_uuid(),
  parent_user_id uuid not null references auth.users(id) on delete restrict,
  child_id uuid not null references public.children(id) on delete restrict,
  child_name text not null check(char_length(btrim(child_name)) between 1 and 50),
  period_start timestamptz not null,
  period_end timestamptz not null check(period_end=period_start+interval '7 days'),
  status text not null check(status in('draft','ready','insufficient_data','cancelled')),
  report_version integer not null default 1 check(report_version>0),
  metrics jsonb not null,
  strengths jsonb not null default '[]'::jsonb,
  practice_recommendations jsonb not null default '[]'::jsonb,
  difficult_topics jsonb not null default '[]'::jsonb,
  generated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(child_id,period_start,report_version)
);
create index student_weekly_reports_parent_period_idx on public.student_weekly_reports(parent_user_id,period_start desc);
alter table public.student_weekly_reports enable row level security;
create policy "parents read own weekly reports" on public.student_weekly_reports for select to authenticated using(parent_user_id=auth.uid() and exists(select 1 from public.guardian_students g where g.guardian_id=auth.uid() and g.child_id=student_weekly_reports.child_id));
revoke all on table public.student_weekly_reports from public,anon,authenticated,service_role;
grant select on table public.student_weekly_reports to authenticated;

create table public.weekly_parent_report_deliveries(
  id uuid primary key default gen_random_uuid(),
  parent_user_id uuid not null references auth.users(id) on delete restrict,
  period_start timestamptz not null,
  period_end timestamptz not null check(period_end=period_start+interval '7 days'),
  report_ids uuid[] not null check(cardinality(report_ids)>0),
  reports jsonb not null check(jsonb_typeof(reports)='array' and jsonb_array_length(reports)>0),
  recipient_email text,
  status text not null default 'pending' check(status in('pending','processing','sent','failed','skipped')),
  attempt_count integer not null default 0 check(attempt_count between 0 and 3),
  scheduled_at timestamptz not null default now(),
  processing_started_at timestamptz,
  sent_at timestamptz,
  skipped_at timestamptz,
  provider_message_id text,
  last_error_code text check(last_error_code is null or last_error_code~'^[a-z0-9_]{1,80}$'),
  last_error_at timestamptz,
  skip_reason text check(skip_reason is null or skip_reason in('parent_opted_out','recipient_missing','recipient_invalid','feature_disabled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(parent_user_id,period_start),
  check((status='sent' and sent_at is not null and provider_message_id is not null) or status<>'sent'),
  check((status='processing' and processing_started_at is not null) or (status<>'processing' and processing_started_at is null)),
  check((status='skipped' and skipped_at is not null and skip_reason is not null) or status<>'skipped')
);
create unique index weekly_parent_report_sent_once_idx on public.weekly_parent_report_deliveries(parent_user_id,period_start) where status='sent';
create index weekly_parent_report_delivery_claim_idx on public.weekly_parent_report_deliveries(status,scheduled_at);
alter table public.weekly_parent_report_deliveries enable row level security;
create policy "parents read own weekly deliveries" on public.weekly_parent_report_deliveries for select to authenticated using(parent_user_id=auth.uid());
revoke all on table public.weekly_parent_report_deliveries from public,anon,authenticated,service_role;
grant select on table public.weekly_parent_report_deliveries to authenticated;
grant select,update on table public.weekly_parent_report_deliveries to service_role;

create table public.weekly_parent_report_job_tokens(
  id uuid primary key default gen_random_uuid(),created_at timestamptz not null default now(),expires_at timestamptz not null,used_at timestamptz,net_request_id bigint,
  check(expires_at>created_at),check(used_at is null or used_at>=created_at)
);
alter table public.weekly_parent_report_job_tokens enable row level security;
revoke all on table public.weekly_parent_report_job_tokens from public,anon,authenticated,service_role;

create function public.weekly_report_period(p_reference timestamptz default now())
returns table(period_start timestamptz,period_end timestamptz) language sql immutable set search_path='' as $$
 select ((date_trunc('week',p_reference at time zone 'Europe/Istanbul')-interval '7 days') at time zone 'Europe/Istanbul'),
        (date_trunc('week',p_reference at time zone 'Europe/Istanbul') at time zone 'Europe/Istanbul')
$$;
revoke all on function public.weekly_report_period(timestamptz) from public,anon,authenticated,service_role;

create function public.record_student_learning_event(p_child_id uuid,p_event_type text,p_idempotency_key text,p_content_type text default null,p_content_id text default null,p_lesson_id text default null,p_topic_key text default null,p_is_correct boolean default null)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_id uuid;v_actor uuid:=auth.uid();v_score integer:=0;
begin
 if v_actor is null or not exists(select 1 from public.parent_profiles p where p.id=v_actor and p.account_type in('parent','both')) then raise exception 'Veli oturumu gerekli';end if;
 if not exists(select 1 from public.guardian_students g join public.children c on c.id=g.child_id where g.guardian_id=v_actor and g.child_id=p_child_id and c.is_active) then raise exception 'Çocuk erişimi yok';end if;
 if p_event_type not in('lesson_started','lesson_completed','question_answered','word_practiced','game_completed','story_completed','review_completed') then raise exception 'Geçersiz öğrenme olayı';end if;
 if (p_event_type='question_answered')<>(p_is_correct is not null) then raise exception 'Cevap doğruluğu geçersiz';end if;
 v_score:=case when p_event_type='question_answered' and p_is_correct then 10 when p_event_type in('lesson_completed','review_completed') then 10 when p_event_type in('game_completed','story_completed') then 5 else 0 end;
 insert into public.student_learning_events(child_id,parent_user_id,event_type,content_type,content_id,lesson_id,topic_key,is_correct,score_delta,duration_seconds,idempotency_key)
 values(p_child_id,v_actor,p_event_type,p_content_type,p_content_id,p_lesson_id,p_topic_key,p_is_correct,v_score,null,p_idempotency_key)
 on conflict(child_id,idempotency_key) do update set idempotency_key=excluded.idempotency_key returning id into v_id;
 return v_id;
end $$;
revoke all on function public.record_student_learning_event(uuid,text,text,text,text,text,text,boolean) from public,anon,authenticated,service_role;
grant execute on function public.record_student_learning_event(uuid,text,text,text,text,text,text,boolean) to authenticated;

create function public.generate_weekly_parent_report_for(p_parent_user_id uuid,p_child_id uuid,p_period_start date)
returns public.student_weekly_reports language plpgsql security definer set search_path='' as $$
declare v_start timestamptz:=p_period_start::timestamp at time zone 'Europe/Istanbul';v_end timestamptz;v_child_name text;v_metrics jsonb;v_strengths jsonb;v_difficult jsonb;v_recommendations jsonb;v_result public.student_weekly_reports;
begin
 if extract(isodow from p_period_start)<>1 then raise exception 'Hafta Pazartesi başlamalı';end if;v_end:=v_start+interval '7 days';
 if v_end>now() then raise exception 'Yalnız tamamlanmış hafta raporlanabilir';end if;
 select c.name into v_child_name from public.children c join public.guardian_students g on g.child_id=c.id where c.id=p_child_id and g.guardian_id=p_parent_user_id and c.is_active;
 if v_child_name is null then raise exception 'Çocuk erişimi yok';end if;
 with e as(select * from public.student_learning_events x where x.child_id=p_child_id and x.parent_user_id=p_parent_user_id and x.occurred_at>=v_start and x.occurred_at<v_end),
 t as(select topic_key,count(*)::int answers,count(*) filter(where is_correct)::int correct,round(count(*) filter(where is_correct)*100.0/count(*))::int accuracy from e where event_type='question_answered' and topic_key is not null group by topic_key)
 select jsonb_build_object('active_days',(select count(distinct (occurred_at at time zone 'Europe/Istanbul')::date) from e),'lessons_started',(select count(*) from e where event_type='lesson_started'),'lessons_completed',(select count(*) from e where event_type='lesson_completed'),'questions_answered',(select count(*) from e where event_type='question_answered'),'correct_answers',(select count(*) from e where event_type='question_answered' and is_correct),'wrong_answers',(select count(*) from e where event_type='question_answered' and not is_correct),'accuracy_percent',(select case when count(*)=0 then null else round(count(*) filter(where is_correct)*100.0/count(*))::int end from e where event_type='question_answered'),'words_practiced',(select count(*) from e where event_type='word_practiced'),'games_completed',(select count(*) from e where event_type='game_completed'),'stories_completed',(select count(*) from e where event_type='story_completed'),'score_earned',(select coalesce(sum(score_delta),0) from e),'duration_seconds',null,'has_data',exists(select 1 from e)),
 coalesce((select jsonb_agg(jsonb_build_object('topic_key',topic_key,'answers',answers,'accuracy_percent',accuracy) order by accuracy desc,topic_key) from (select * from t where answers>=3 and accuracy>=80 order by accuracy desc,topic_key limit 3)s),'[]'),
 coalesce((select jsonb_agg(jsonb_build_object('topic_key',topic_key,'answers',answers,'accuracy_percent',accuracy) order by accuracy,topic_key) from (select * from t where answers>=3 and accuracy<70 order by accuracy,topic_key limit 3)s),'[]') into v_metrics,v_strengths,v_difficult;
 v_recommendations:='[]'::jsonb;
 if jsonb_array_length(v_difficult)>0 then v_recommendations:=v_recommendations||jsonb_build_array(format('%s konusu için kısa bir tekrar faydalı olabilir.',v_difficult->0->>'topic_key'));end if;
 if (v_metrics->>'words_practiced')::int=0 then v_recommendations:=v_recommendations||jsonb_build_array('Kısa bir kelime tekrarı önerilir.');end if;
 if (v_metrics->>'lessons_completed')::int>0 and (v_metrics->>'questions_answered')::int=0 then v_recommendations:=v_recommendations||jsonb_build_array('Tamamlanan derslerin mini quizleriyle pratik yapılabilir.');end if;
 insert into public.student_weekly_reports(parent_user_id,child_id,child_name,period_start,period_end,status,metrics,strengths,practice_recommendations,difficult_topics)
 values(p_parent_user_id,p_child_id,v_child_name,v_start,v_end,case when (v_metrics->>'has_data')::boolean then 'ready' else 'insufficient_data' end,v_metrics,v_strengths,(select coalesce(jsonb_agg(value),'[]') from (select value from jsonb_array_elements(v_recommendations) limit 3)q),v_difficult)
 on conflict(child_id,period_start,report_version) do nothing;
 select * into v_result from public.student_weekly_reports r where r.child_id=p_child_id and r.parent_user_id=p_parent_user_id and r.period_start=v_start and r.report_version=1;
 if v_result.id is null then raise exception 'Rapor başka veliye ait';end if;return v_result;
end $$;
revoke all on function public.generate_weekly_parent_report_for(uuid,uuid,date) from public,anon,authenticated,service_role;

create function public.generate_weekly_parent_report(p_child_id uuid,p_period_start date)
returns public.student_weekly_reports language plpgsql security definer set search_path='' as $$
declare v_actor uuid:=auth.uid();begin
 if v_actor is null or (not public.is_poma_admin() and not exists(select 1 from public.guardian_students g where g.guardian_id=v_actor and g.child_id=p_child_id)) then raise exception 'Rapor yetkisi yok';end if;
 if public.is_poma_admin() then select guardian_id into v_actor from public.guardian_students where child_id=p_child_id order by is_primary desc,created_at limit 1;end if;
 return public.generate_weekly_parent_report_for(v_actor,p_child_id,p_period_start);
end $$;
revoke all on function public.generate_weekly_parent_report(uuid,date) from public,anon,authenticated,service_role;
grant execute on function public.generate_weekly_parent_report(uuid,date) to authenticated;

create function public.list_my_weekly_parent_reports(p_child_id uuid default null)
returns setof public.student_weekly_reports language sql stable security definer set search_path='' as $$
 select r.* from public.student_weekly_reports r where r.parent_user_id=auth.uid() and (p_child_id is null or r.child_id=p_child_id) and exists(select 1 from public.guardian_students g where g.guardian_id=auth.uid() and g.child_id=r.child_id) order by r.period_start desc,r.child_name
$$;
revoke all on function public.list_my_weekly_parent_reports(uuid) from public,anon,authenticated,service_role;
grant execute on function public.list_my_weekly_parent_reports(uuid) to authenticated;

create function public.update_weekly_progress_email_preference(p_enabled boolean)
returns boolean language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or not exists(select 1 from public.parent_profiles p where p.id=auth.uid() and p.account_type in('parent','both')) then raise exception 'Veli oturumu gerekli';end if;
 insert into public.weekly_parent_report_preferences(parent_user_id,weekly_progress_email_enabled) values(auth.uid(),p_enabled) on conflict(parent_user_id) do update set weekly_progress_email_enabled=excluded.weekly_progress_email_enabled,updated_at=now();return p_enabled;
end $$;
revoke all on function public.update_weekly_progress_email_preference(boolean) from public,anon,authenticated,service_role;
grant execute on function public.update_weekly_progress_email_preference(boolean) to authenticated;

create function public.enqueue_weekly_parent_reports(p_reference timestamptz default now())
returns jsonb language plpgsql security invoker set search_path='' as $$
declare b record;r record;v_reports jsonb;v_ids uuid[];v_email text;v_enabled boolean;v_opt_in boolean;v_inserted integer:=0;v_skipped integer:=0;
begin
 select enabled into v_enabled from public.weekly_parent_report_settings where key='weekly_parent_reports_enabled';if not coalesce(v_enabled,false) then return jsonb_build_object('feature_enabled',false,'inserted',0);end if;
 select * into b from public.weekly_report_period(p_reference);
 for r in select distinct g.guardian_id from public.guardian_students g join public.children c on c.id=g.child_id where c.is_active loop
   perform public.generate_weekly_parent_report_for(r.guardian_id,g.child_id,b.period_start::date) from public.guardian_students g join public.children c on c.id=g.child_id where g.guardian_id=r.guardian_id and c.is_active;
   select array_agg(x.id order by x.child_name),jsonb_agg(jsonb_build_object('id',x.id,'child_name',x.child_name,'metrics',x.metrics,'strengths',x.strengths,'practice_recommendations',x.practice_recommendations,'difficult_topics',x.difficult_topics) order by x.child_name) into v_ids,v_reports from public.student_weekly_reports x where x.parent_user_id=r.guardian_id and x.period_start=b.period_start and x.status<>'cancelled';
   select email into v_email from auth.users where id=r.guardian_id;select coalesce(weekly_progress_email_enabled,true) into v_opt_in from public.weekly_parent_report_preferences where parent_user_id=r.guardian_id;if v_opt_in is null then v_opt_in:=true;end if;
   insert into public.weekly_parent_report_deliveries(parent_user_id,period_start,period_end,report_ids,reports,recipient_email,status,skipped_at,skip_reason)
   values(r.guardian_id,b.period_start,b.period_end,v_ids,v_reports,v_email,case when not v_opt_in or v_email is null or v_email!~*'^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$' then 'skipped' else 'pending' end,case when not v_opt_in or v_email is null or v_email!~*'^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$' then now() end,case when not v_opt_in then 'parent_opted_out' when v_email is null then 'recipient_missing' when v_email!~*'^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$' then 'recipient_invalid' end)
   on conflict(parent_user_id,period_start) do nothing;
   if found then v_inserted:=v_inserted+1;if not v_opt_in or v_email is null or v_email!~*'^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$' then v_skipped:=v_skipped+1;end if;end if;
 end loop;return jsonb_build_object('feature_enabled',true,'inserted',v_inserted,'skipped',v_skipped,'period_start',b.period_start);
end $$;
revoke all on function public.enqueue_weekly_parent_reports(timestamptz) from public,anon,authenticated,service_role;

create function public.service_claim_weekly_parent_report_job(p_job_token uuid,p_limit integer default 50)
returns table(id uuid,recipient_email text,period_start timestamptz,period_end timestamptz,reports jsonb,attempt_count integer)
language plpgsql security definer set search_path='' as $$
declare d public.weekly_parent_report_deliveries;v_token uuid;v_enabled boolean;
begin
 if coalesce(auth.jwt()->>'role','')<>'service_role' then raise exception 'service_role gerekli';end if;if p_limit not between 1 and 100 then raise exception 'Geçersiz limit';end if;
 update public.weekly_parent_report_job_tokens set used_at=now() where weekly_parent_report_job_tokens.id=p_job_token and used_at is null and expires_at>now() returning weekly_parent_report_job_tokens.id into v_token;if v_token is null then raise exception 'Geçersiz iş tokenı';end if;
 select enabled into v_enabled from public.weekly_parent_report_settings where key='weekly_parent_reports_enabled';if not coalesce(v_enabled,false) then return;end if;
 for d in select x.* from public.weekly_parent_report_deliveries x where (x.status='pending' or (x.status='failed' and x.attempt_count<3) or (x.status='processing' and x.processing_started_at<now()-interval '15 minutes' and x.attempt_count<3)) and x.scheduled_at<=now() order by x.created_at,x.id for update skip locked limit p_limit loop
  update public.weekly_parent_report_deliveries set status='processing',processing_started_at=now(),attempt_count=weekly_parent_report_deliveries.attempt_count+1,last_error_code=null,last_error_at=null,updated_at=now() where weekly_parent_report_deliveries.id=d.id returning * into d;
  return query select d.id,d.recipient_email,d.period_start,d.period_end,d.reports,d.attempt_count;
 end loop;
end $$;
revoke all on function public.service_claim_weekly_parent_report_job(uuid,integer) from public,anon,authenticated,service_role;
grant execute on function public.service_claim_weekly_parent_report_job(uuid,integer) to service_role;

create function public.admin_set_weekly_parent_reports_enabled(p_enabled boolean)
returns boolean language plpgsql security definer set search_path='' as $$begin if not public.is_poma_admin() then raise exception 'Admin yetkisi gerekli';end if;update public.weekly_parent_report_settings set enabled=p_enabled,updated_at=now(),updated_by=auth.uid() where key='weekly_parent_reports_enabled';return p_enabled;end$$;
revoke all on function public.admin_set_weekly_parent_reports_enabled(boolean) from public,anon,authenticated,service_role;grant execute on function public.admin_set_weekly_parent_reports_enabled(boolean) to authenticated;

create function public.list_admin_weekly_report_deliveries(p_limit integer default 100)
returns setof public.weekly_parent_report_deliveries language plpgsql stable security definer set search_path='' as $$begin if not public.is_poma_admin() then raise exception 'Admin yetkisi gerekli';end if;return query select d.* from public.weekly_parent_report_deliveries d order by d.created_at desc limit least(greatest(p_limit,1),200);end$$;
revoke all on function public.list_admin_weekly_report_deliveries(integer) from public,anon,authenticated,service_role;grant execute on function public.list_admin_weekly_report_deliveries(integer) to authenticated;

create function public.admin_retry_weekly_report_delivery(p_delivery_id uuid)
returns boolean language plpgsql security definer set search_path='' as $$begin if not public.is_poma_admin() then raise exception 'Admin yetkisi gerekli';end if;update public.weekly_parent_report_deliveries set status='pending',scheduled_at=now(),processing_started_at=null,last_error_code=null,last_error_at=null,updated_at=now() where id=p_delivery_id and status='failed' and attempt_count<3;return found;end$$;
revoke all on function public.admin_retry_weekly_report_delivery(uuid) from public,anon,authenticated,service_role;grant execute on function public.admin_retry_weekly_report_delivery(uuid) to authenticated;

create function public.run_weekly_parent_report_job()
returns jsonb language plpgsql security invoker set search_path='' as $$
declare v_enabled boolean;v_enqueue jsonb;v_token uuid;v_request bigint;begin select enabled into v_enabled from public.weekly_parent_report_settings where key='weekly_parent_reports_enabled';if not coalesce(v_enabled,false) then return jsonb_build_object('feature_enabled',false,'request_queued',false);end if;v_enqueue:=public.enqueue_weekly_parent_reports(now());delete from public.weekly_parent_report_job_tokens where created_at<now()-interval '7 days';insert into public.weekly_parent_report_job_tokens(expires_at) values(now()+interval '15 minutes') returning id into v_token;select net.http_post(url:='https://gzsrcjovhhlfpvvpucri.supabase.co/functions/v1/send-weekly-parent-reports',headers:='{"Content-Type":"application/json"}'::jsonb,body:=jsonb_build_object('job_token',v_token)) into v_request;update public.weekly_parent_report_job_tokens set net_request_id=v_request where id=v_token;return v_enqueue||jsonb_build_object('request_queued',v_request is not null);end$$;
revoke all on function public.run_weekly_parent_report_job() from public,anon,authenticated,service_role;

do $$declare v_job_id bigint;begin for v_job_id in select jobid from cron.job where jobname='weekly-parent-reports-v1' loop perform cron.unschedule(v_job_id);end loop;perform cron.schedule('weekly-parent-reports-v1','0 6 * * 1','select public.run_weekly_parent_report_job();');end$$;
