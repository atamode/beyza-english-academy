-- Monthly parent progress reports reuse learning events, weekly snapshots and the existing email worker.
create table public.monthly_parent_report_settings(
  key text primary key check(key='monthly_parent_reports_enabled'),
  enabled boolean not null default false,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);
insert into public.monthly_parent_report_settings(key,enabled) values('monthly_parent_reports_enabled',false);
alter table public.monthly_parent_report_settings enable row level security;
revoke all on table public.monthly_parent_report_settings from public,anon,authenticated,service_role;

alter table public.weekly_parent_report_preferences add column monthly_progress_email_enabled boolean not null default true;

create table public.student_monthly_reports(
  id uuid primary key default gen_random_uuid(),
  parent_user_id uuid not null references auth.users(id) on delete restrict,
  child_id uuid not null references public.children(id) on delete restrict,
  child_name text not null check(char_length(btrim(child_name)) between 1 and 50),
  period_start timestamptz not null,
  period_end timestamptz not null,
  status text not null check(status in('ready','insufficient_data','cancelled')),
  report_version integer not null default 1 check(report_version>0),
  metrics jsonb not null,
  topics_studied jsonb not null default '[]',
  improved_topics jsonb not null default '[]',
  review_topics jsonb not null default '[]',
  comparison jsonb,
  generated_at timestamptz not null default now(),created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
  unique(child_id,period_start,report_version),check(period_end>period_start)
);
create index student_monthly_reports_parent_period_idx on public.student_monthly_reports(parent_user_id,period_start desc);
alter table public.student_monthly_reports enable row level security;
create policy "parents read own monthly reports" on public.student_monthly_reports for select to authenticated using(parent_user_id=(select auth.uid()) and exists(select 1 from public.guardian_students g where g.guardian_id=(select auth.uid()) and g.child_id=student_monthly_reports.child_id));
revoke all on table public.student_monthly_reports from public,anon,authenticated,service_role;
grant select on table public.student_monthly_reports to authenticated;

create table public.monthly_parent_report_deliveries(
 id uuid primary key default gen_random_uuid(),parent_user_id uuid not null references auth.users(id) on delete restrict,
 period_start timestamptz not null,period_end timestamptz not null,report_ids uuid[] not null check(cardinality(report_ids)>0),
 reports jsonb not null check(jsonb_typeof(reports)='array' and jsonb_array_length(reports)>0),recipient_email text,
 status text not null default 'pending' check(status in('pending','processing','sent','failed','skipped')),
 attempt_count integer not null default 0 check(attempt_count between 0 and 3),scheduled_at timestamptz not null default now(),
 processing_started_at timestamptz,sent_at timestamptz,skipped_at timestamptz,provider_message_id text,
 last_error_code text check(last_error_code is null or last_error_code~'^[a-z0-9_]{1,80}$'),last_error_at timestamptz,
 skip_reason text check(skip_reason is null or skip_reason in('parent_opted_out','recipient_missing','recipient_invalid','feature_disabled')),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(parent_user_id,period_start),
 check((status='sent' and sent_at is not null and provider_message_id is not null) or status<>'sent'),
 check((status='processing' and processing_started_at is not null) or (status<>'processing' and processing_started_at is null)),
 check((status='skipped' and skipped_at is not null and skip_reason is not null) or status<>'skipped')
);
create index monthly_parent_report_delivery_claim_idx on public.monthly_parent_report_deliveries(status,scheduled_at);
alter table public.monthly_parent_report_deliveries enable row level security;
create policy "parents read own monthly deliveries" on public.monthly_parent_report_deliveries for select to authenticated using(parent_user_id=(select auth.uid()));
revoke all on table public.monthly_parent_report_deliveries from public,anon,authenticated,service_role;
grant select on table public.monthly_parent_report_deliveries to authenticated;
grant select,update on table public.monthly_parent_report_deliveries to service_role;

create table public.monthly_parent_report_job_tokens(id uuid primary key default gen_random_uuid(),created_at timestamptz not null default now(),expires_at timestamptz not null,used_at timestamptz,net_request_id bigint,check(expires_at>created_at));
alter table public.monthly_parent_report_job_tokens enable row level security;
revoke all on table public.monthly_parent_report_job_tokens from public,anon,authenticated,service_role;

create function public.monthly_report_period(p_reference timestamptz default now()) returns table(period_start timestamptz,period_end timestamptz)
language sql immutable set search_path='' as $$select ((date_trunc('month',p_reference at time zone 'Europe/Istanbul')-interval '1 month') at time zone 'Europe/Istanbul'),(date_trunc('month',p_reference at time zone 'Europe/Istanbul') at time zone 'Europe/Istanbul')$$;
revoke all on function public.monthly_report_period(timestamptz) from public,anon,authenticated,service_role;

create function public.generate_monthly_parent_report_for(p_parent_user_id uuid,p_child_id uuid,p_period_start date)
returns public.student_monthly_reports language plpgsql security definer set search_path='' as $$
declare v_start timestamptz:=p_period_start::timestamp at time zone 'Europe/Istanbul';v_end timestamptz;v_name text;v_metrics jsonb;v_topics jsonb;v_improved jsonb;v_review jsonb;v_comparison jsonb;v_result public.student_monthly_reports;
begin
 if extract(day from p_period_start)<>1 then raise exception 'Ay ilk gün başlamalı';end if;v_end:=(p_period_start+interval '1 month')::timestamp at time zone 'Europe/Istanbul';if v_end>now() then raise exception 'Yalnız tamamlanmış ay raporlanabilir';end if;
 select c.name into v_name from public.children c join public.guardian_students g on g.child_id=c.id where c.id=p_child_id and g.guardian_id=p_parent_user_id and c.is_active;if v_name is null then raise exception 'Çocuk erişimi yok';end if;
 with w as(select metrics from public.student_weekly_reports where child_id=p_child_id and parent_user_id=p_parent_user_id and period_start>=v_start and period_start<v_end and status='ready')
 select jsonb_build_object('active_weeks',count(*),'active_days',coalesce(sum((metrics->>'active_days')::int),0),'lessons_completed',coalesce(sum((metrics->>'lessons_completed')::int),0),'questions_answered',coalesce(sum((metrics->>'questions_answered')::int),0),'correct_answers',coalesce(sum((metrics->>'correct_answers')::int),0),'accuracy_percent',case when coalesce(sum((metrics->>'questions_answered')::int),0)>=5 then round(sum((metrics->>'correct_answers')::int)*100.0/sum((metrics->>'questions_answered')::int))::int end,'games_completed',coalesce(sum((metrics->>'games_completed')::int),0),'stories_completed',coalesce(sum((metrics->>'stories_completed')::int),0),'duration_seconds',null,'has_data',count(*)>0) into v_metrics from w;
 with t as(select topic_key,count(*)::int answers,count(*) filter(where is_correct)::int correct,round(count(*) filter(where is_correct)*100.0/count(*))::int accuracy from public.student_learning_events where child_id=p_child_id and parent_user_id=p_parent_user_id and event_type='question_answered' and topic_key is not null and occurred_at>=v_start and occurred_at<v_end group by topic_key),prev as(select topic_key,count(*)::int answers,round(count(*) filter(where is_correct)*100.0/count(*))::int accuracy from public.student_learning_events where child_id=p_child_id and parent_user_id=p_parent_user_id and event_type='question_answered' and topic_key is not null and occurred_at>=v_start-interval '1 month' and occurred_at<v_start group by topic_key)
 select coalesce((select jsonb_agg(topic_key order by topic_key) from t),'[]'),coalesce((select jsonb_agg(jsonb_build_object('topic_key',topic_key,'answers',answers,'change_points',change_points) order by change_points desc,topic_key) from (select t.topic_key,t.answers,t.accuracy-prev.accuracy change_points from t join prev using(topic_key) where t.answers>=5 and prev.answers>=5 and t.accuracy>prev.accuracy order by change_points desc,t.topic_key limit 3)s),'[]'),coalesce((select jsonb_agg(jsonb_build_object('topic_key',topic_key,'answers',answers,'accuracy_percent',accuracy) order by accuracy,topic_key) from (select * from t where answers>=5 and accuracy<70 order by accuracy,topic_key limit 3)s),'[]'),case when (select coalesce(sum(answers),0) from t)>=5 and (select coalesce(sum(answers),0) from prev)>=5 then jsonb_build_object('available',true,'current_answers',(select sum(answers) from t),'previous_answers',(select sum(answers) from prev)) else jsonb_build_object('available',false) end into v_topics,v_improved,v_review,v_comparison;
 insert into public.student_monthly_reports(parent_user_id,child_id,child_name,period_start,period_end,status,metrics,topics_studied,improved_topics,review_topics,comparison) values(p_parent_user_id,p_child_id,v_name,v_start,v_end,case when (v_metrics->>'has_data')::boolean then 'ready' else 'insufficient_data' end,v_metrics,v_topics,v_improved,v_review,v_comparison) on conflict(child_id,period_start,report_version) do nothing;
 select * into v_result from public.student_monthly_reports where parent_user_id=p_parent_user_id and child_id=p_child_id and period_start=v_start and report_version=1;if v_result.id is null then raise exception 'Rapor başka veliye ait';end if;return v_result;
end$$;
revoke all on function public.generate_monthly_parent_report_for(uuid,uuid,date) from public,anon,authenticated,service_role;

create function public.generate_monthly_parent_report(p_child_id uuid,p_period_start date) returns public.student_monthly_reports language plpgsql security definer set search_path='' as $$declare v_actor uuid:=auth.uid();begin if v_actor is null or not exists(select 1 from public.guardian_students where guardian_id=v_actor and child_id=p_child_id) then raise exception 'Rapor yetkisi yok';end if;return public.generate_monthly_parent_report_for(v_actor,p_child_id,p_period_start);end$$;
revoke all on function public.generate_monthly_parent_report(uuid,date) from public,anon,authenticated,service_role;grant execute on function public.generate_monthly_parent_report(uuid,date) to authenticated;
create function public.list_my_monthly_parent_reports(p_child_id uuid default null) returns setof public.student_monthly_reports language sql stable security definer set search_path='' as $$select r.* from public.student_monthly_reports r where r.parent_user_id=auth.uid() and (p_child_id is null or r.child_id=p_child_id) and exists(select 1 from public.guardian_students g where g.guardian_id=auth.uid() and g.child_id=r.child_id) order by r.period_start desc,r.child_name$$;
revoke all on function public.list_my_monthly_parent_reports(uuid) from public,anon,authenticated,service_role;grant execute on function public.list_my_monthly_parent_reports(uuid) to authenticated;
create function public.update_monthly_progress_email_preference(p_enabled boolean) returns boolean language plpgsql security definer set search_path='' as $$begin if auth.uid() is null or not exists(select 1 from public.parent_profiles where id=auth.uid() and account_type in('parent','both')) then raise exception 'Veli oturumu gerekli';end if;insert into public.weekly_parent_report_preferences(parent_user_id,monthly_progress_email_enabled) values(auth.uid(),p_enabled) on conflict(parent_user_id) do update set monthly_progress_email_enabled=excluded.monthly_progress_email_enabled,updated_at=now();return p_enabled;end$$;
revoke all on function public.update_monthly_progress_email_preference(boolean) from public,anon,authenticated,service_role;grant execute on function public.update_monthly_progress_email_preference(boolean) to authenticated;

create function public.enqueue_monthly_parent_reports(p_reference timestamptz default now()) returns jsonb language plpgsql security invoker set search_path='' as $$declare b record;r record;v_reports jsonb;v_ids uuid[];v_email text;v_enabled boolean;v_opt boolean;v_inserted int:=0;begin select enabled into v_enabled from public.monthly_parent_report_settings where key='monthly_parent_reports_enabled';if not coalesce(v_enabled,false) then return jsonb_build_object('feature_enabled',false,'inserted',0);end if;select * into b from public.monthly_report_period(p_reference);for r in select distinct guardian_id from public.guardian_students loop perform public.generate_monthly_parent_report_for(r.guardian_id,g.child_id,b.period_start::date) from public.guardian_students g join public.children c on c.id=g.child_id where g.guardian_id=r.guardian_id and c.is_active;select array_agg(id order by child_name),jsonb_agg(jsonb_build_object('id',id,'child_name',child_name,'metrics',metrics,'topics_studied',topics_studied,'improved_topics',improved_topics,'review_topics',review_topics,'comparison',comparison) order by child_name) into v_ids,v_reports from public.student_monthly_reports where parent_user_id=r.guardian_id and period_start=b.period_start and status<>'cancelled';select email into v_email from auth.users where id=r.guardian_id;select coalesce(monthly_progress_email_enabled,true) into v_opt from public.weekly_parent_report_preferences where parent_user_id=r.guardian_id;if v_opt is null then v_opt:=true;end if;insert into public.monthly_parent_report_deliveries(parent_user_id,period_start,period_end,report_ids,reports,recipient_email,status,skipped_at,skip_reason) values(r.guardian_id,b.period_start,b.period_end,v_ids,v_reports,v_email,case when not v_opt or v_email is null or v_email!~*'^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$' then 'skipped' else 'pending' end,case when not v_opt or v_email is null or v_email!~*'^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$' then now() end,case when not v_opt then 'parent_opted_out' when v_email is null then 'recipient_missing' else 'recipient_invalid' end) on conflict(parent_user_id,period_start) do nothing;if found then v_inserted:=v_inserted+1;end if;end loop;return jsonb_build_object('feature_enabled',true,'inserted',v_inserted,'period_start',b.period_start);end$$;
revoke all on function public.enqueue_monthly_parent_reports(timestamptz) from public,anon,authenticated,service_role;
create function public.service_claim_monthly_parent_report_job(p_job_token uuid,p_limit integer default 50) returns table(id uuid,recipient_email text,period_start timestamptz,period_end timestamptz,reports jsonb,attempt_count integer) language plpgsql security definer set search_path='' as $$declare d public.monthly_parent_report_deliveries;v_token uuid;v_enabled boolean;begin if coalesce(auth.jwt()->>'role','')<>'service_role' then raise exception 'service_role gerekli';end if;update public.monthly_parent_report_job_tokens t set used_at=now() where t.id=p_job_token and t.used_at is null and t.expires_at>now() returning t.id into v_token;if v_token is null then raise exception 'Geçersiz iş tokenı';end if;select s.enabled into v_enabled from public.monthly_parent_report_settings s where s.key='monthly_parent_reports_enabled';if not coalesce(v_enabled,false) then return;end if;for d in select x.* from public.monthly_parent_report_deliveries x where (x.status='pending' or (x.status='failed' and x.attempt_count<3)) and x.scheduled_at<=now() order by x.created_at,x.id for update skip locked limit least(greatest(p_limit,1),100) loop update public.monthly_parent_report_deliveries x set status='processing',processing_started_at=now(),attempt_count=x.attempt_count+1,updated_at=now() where x.id=d.id returning * into d;return query select d.id,d.recipient_email,d.period_start,d.period_end,d.reports,d.attempt_count;end loop;end$$;
revoke all on function public.service_claim_monthly_parent_report_job(uuid,integer) from public,anon,authenticated,service_role;grant execute on function public.service_claim_monthly_parent_report_job(uuid,integer) to service_role;
create function public.list_admin_monthly_report_deliveries(p_limit integer default 100) returns setof public.monthly_parent_report_deliveries language plpgsql stable security definer set search_path='' as $$begin if not public.is_poma_admin() then raise exception 'Admin yetkisi gerekli';end if;return query select * from public.monthly_parent_report_deliveries order by created_at desc limit least(greatest(p_limit,1),200);end$$;
revoke all on function public.list_admin_monthly_report_deliveries(integer) from public,anon,authenticated,service_role;grant execute on function public.list_admin_monthly_report_deliveries(integer) to authenticated;
create function public.admin_retry_monthly_report_delivery(p_delivery_id uuid) returns boolean language plpgsql security definer set search_path='' as $$begin if not public.is_poma_admin() then raise exception 'Admin yetkisi gerekli';end if;update public.monthly_parent_report_deliveries set status='pending',scheduled_at=now(),processing_started_at=null,last_error_code=null,last_error_at=null,updated_at=now() where id=p_delivery_id and status='failed' and attempt_count<3;return found;end$$;
revoke all on function public.admin_retry_monthly_report_delivery(uuid) from public,anon,authenticated,service_role;grant execute on function public.admin_retry_monthly_report_delivery(uuid) to authenticated;
create function public.run_monthly_parent_report_job() returns jsonb language plpgsql security invoker set search_path='' as $$declare v_enabled boolean;v_token uuid;v_request bigint;v_result jsonb;begin select enabled into v_enabled from public.monthly_parent_report_settings where key='monthly_parent_reports_enabled';if not coalesce(v_enabled,false) or extract(day from now() at time zone 'Europe/Istanbul')>7 then return jsonb_build_object('feature_enabled',coalesce(v_enabled,false),'request_queued',false);end if;v_result:=public.enqueue_monthly_parent_reports(now());insert into public.monthly_parent_report_job_tokens(expires_at) values(now()+interval '15 minutes') returning id into v_token;select net.http_post(url:='https://gzsrcjovhhlfpvvpucri.supabase.co/functions/v1/send-weekly-parent-reports',headers:='{"Content-Type":"application/json"}'::jsonb,body:=jsonb_build_object('monthly_job_token',v_token)) into v_request;update public.monthly_parent_report_job_tokens set net_request_id=v_request where id=v_token;return v_result||jsonb_build_object('request_queued',v_request is not null);end$$;
revoke all on function public.run_monthly_parent_report_job() from public,anon,authenticated,service_role;
do $$begin perform cron.schedule('monthly-parent-reports-v1','0 7 * * 1','select public.run_monthly_parent_report_job();');end$$;
