import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {previousIstanbulWeek,summarizeWeeklyEvents,buildParentDigest,renderWeeklyParentReport} from "../supabase/functions/_shared/weekly-parent-report.mjs";

const sql=fs.readFileSync(new URL("../supabase/migrations/20260720000100_weekly_parent_progress_reports.sql",import.meta.url),"utf8");
const edgeFunction=fs.readFileSync(new URL("../supabase/functions/send-weekly-parent-reports/index.ts",import.meta.url),"utf8");
const sample=(parent="p1",child="c1",name="Ayşe",metrics={active_days:2,lessons_completed:1,accuracy_percent:75})=>({id:child,parent_user_id:parent,child_id:child,child_name:name,metrics,practice_recommendations:["Kısa bir kelime tekrarı önerilir."]});

test("önceki tamamlanmış hafta Europe/Istanbul Pazartesi sınırlarıyla hesaplanır",()=>{
  assert.deepEqual(previousIstanbulWeek(new Date("2026-07-20T06:00:00Z")),{start:"2026-07-12T21:00:00.000Z",end:"2026-07-19T21:00:00.000Z"});
  assert.match(sql,/date_trunc\('week',p_reference at time zone 'Europe\/Istanbul'\)/);
});

test("aynı çocuk ve hafta için ikinci snapshot oluşmaz",()=>{
  assert.match(sql,/unique\(child_id,period_start,report_version\)/);
  assert.match(sql,/on conflict\(child_id,period_start,report_version\) do nothing/);
});

test("aynı velinin çocukları tek digest içinde birleşir",()=>{
  const digest=buildParentDigest([sample("p1","c2","Bora"),sample("p1","c1","Ayşe")],"p1");
  assert.deepEqual(digest.map(x=>x.child_name),["Ayşe","Bora"]);assert.equal(renderWeeklyParentReport({period_start:"2026-07-12T21:00:00Z",period_end:"2026-07-19T21:00:00Z",reports:digest}).html.match(/<section/g).length,2);
});

test("başka velinin çocuğu digest raporuna karışmaz",()=>{
  const digest=buildParentDigest([sample("p1","c1","Ayşe"),sample("p2","c2","Deniz")],"p1");assert.deepEqual(digest.map(x=>x.child_name),["Ayşe"]);
});

test("metrikler yalnız zaman damgalı gerçek öğrenme olaylarından üretilir",()=>{
  const rows=[{event_type:"lesson_completed",occurred_at:"2026-07-14T09:00:00Z",score_delta:10},{event_type:"question_answered",occurred_at:"2026-07-14T09:01:00Z",topic_key:"am-is-are",is_correct:true,score_delta:10},{event_type:"question_answered",topic_key:"am-is-are",is_correct:false,score_delta:0}];
  const metrics=summarizeWeeklyEvents(rows);assert.equal(metrics.lessons_completed,1);assert.equal(metrics.questions_answered,1);assert.equal(metrics.score_earned,20);assert.doesNotMatch(sql,/student_state[^;]*updated_at/i);
});

test("veri yokken uydurma başarı oranı veya çalışma süresi gösterilmez",()=>{
  const metrics=summarizeWeeklyEvents([]);assert.equal(metrics.accuracy_percent,null);assert.equal(metrics.duration_seconds,null);assert.equal(metrics.has_data,false);
  const message=renderWeeklyParentReport({period_start:"2026-07-12T21:00:00Z",period_end:"2026-07-19T21:00:00Z",reports:[sample("p1","c1","Ayşe",metrics)]});assert.match(message.text,/henüz ölçülebilir soru etkinliği bulunmuyor/);assert.doesNotMatch(message.text,/%0/);
});

test("e-posta tercihi kapalıyken rapor sürer ve delivery skipped olur",()=>{
  assert.match(sql,/case when not v_opt_in[\s\S]*then 'skipped'/);assert.match(sql,/parent_opted_out/);assert.match(sql,/perform public\.generate_weekly_parent_report_for[\s\S]*select coalesce\(weekly_progress_email_enabled/);
});

test("özellik anahtarı kapalıyken toplu enqueue ve worker gönderimi yapmaz",()=>{
  assert.match(sql,/weekly_parent_reports_enabled',false/);assert.equal((sql.match(/if not coalesce\(v_enabled,false\) then/g)||[]).length>=2,true);
});

test("sent teslimat ikinci kez claim edilmez ve veli-hafta teslimatı tektir",()=>{
  const claim=/where \(x\.status='pending' or \(x\.status='failed'[\s\S]*?\) and x\.scheduled_at/.exec(sql)?.[0]||"";assert.doesNotMatch(claim,/status='sent'/);assert.match(sql,/unique\(parent_user_id,period_start\)/);assert.match(edgeFunction,/weekly-parent-report\/\$\{delivery\.id\}/);
});

test("veli sorgusu yalnız kendi güncel çocuk raporlarını döndürür",()=>{
  assert.match(sql,/r\.parent_user_id=auth\.uid\(\)[\s\S]*g\.guardian_id=auth\.uid\(\)[\s\S]*g\.child_id=r\.child_id/);
});

test("admin teslimat listesi normal kullanıcıya kapalıdır",()=>{
  assert.match(sql,/function public\.list_admin_weekly_report_deliveries[\s\S]*if not public\.is_poma_admin\(\) then raise exception/);
});

test("Türkçe HTML ve düz metin raporda teknik hata veya kimlik sızmaz",()=>{
  const message=renderWeeklyParentReport({period_start:"2026-07-12T21:00:00Z",period_end:"2026-07-19T21:00:00Z",reports:[sample()]});
  assert.equal(message.subject,"Poma Academy | Haftalık gelişim raporu");assert.match(message.html,/charset="utf-8"/);assert.match(message.text,/Haftalık gelişim raporu/);assert.doesNotMatch(message.html+message.text,/RPC|database|SQLSTATE|[0-9a-f]{8}-[0-9a-f]{4}/i);
});
