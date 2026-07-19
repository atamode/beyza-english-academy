import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {renderMembershipExpiryReminder} from "../supabase/functions/_shared/membership-expiry-reminder-template.mjs";

const read=file=>fs.readFileSync(new URL(`../${file}`,import.meta.url),"utf8");
const sql=read("supabase/migrations/20260719000400_membership_expiry_reminders.sql");
const fn=read("supabase/functions/send-membership-expiry-reminders/index.ts");
const config=read("supabase/config.toml");
const matrix=read("docs/security/SECURITY_DEFINER_MATRIX_2026-07-18.md");
const sources=["supabase/functions/send-membership-expiry-reminders/index.ts","supabase/functions/_shared/membership-expiry-reminder-template.mjs"];

test("reminder and token tables are locked down",()=>{
  assert.match(sql,/create table public\.membership_expiry_reminder_deliveries/);
  assert.match(sql,/create table public\.membership_reminder_job_tokens/);
  assert.match(sql,/unique\(entitlement_type,recipient_user_id,reminder_kind,entitlement_ends_at\)/);
  assert.match(sql,/references auth\.users\(id\) on delete restrict/);
  assert.match(sql,/enable row level security/g);
  assert.match(sql,/revoke all on table public\.membership_expiry_reminder_deliveries from public,anon,authenticated,service_role/);
  assert.match(sql,/grant select,update on table public\.membership_expiry_reminder_deliveries to service_role/);
  assert.match(sql,/revoke all on table public\.membership_reminder_job_tokens from public,anon,authenticated,service_role/);
  assert.doesNotMatch(sql,/create policy/i);
});

test("enqueue covers family and teacher windows without backfill",()=>{
  assert.match(sql,/function public\.enqueue_membership_expiry_reminders/);
  assert.match(sql,/security invoker set search_path=''/);
  assert.match(sql,/distinct on\(s\.user_id\)/);
  assert.match(sql,/order by s\.user_id,s\.ends_at desc,s\.created_at desc,s\.id desc/);
  assert.match(sql,/p\.code not in\('FREE_STARTER','TEACHER_MONTHLY'\)/);
  assert.match(sql,/tp\.approval_status='approved' and pp\.status='active'/);
  assert.match(sql,/when 7 then 'days_7' when 1 then 'days_1'/g);
  assert.match(sql,/at time zone 'Europe\/Istanbul'/g);
  assert.match(sql,/on conflict\(entitlement_type,recipient_user_id,reminder_kind,entitlement_ends_at\) do nothing/g);
});

test("claim uses one-time token locking retries and entitlement revalidation",()=>{
  assert.match(sql,/function public\.service_claim_membership_reminder_job/);
  assert.match(sql,/security definer set search_path=''/);
  assert.match(sql,/auth\.jwt\(\)->>'role'.*service_role/);
  assert.match(sql,/used_at is null and expires_at>now\(\)/);
  assert.match(sql,/Geçersiz veya kullanılmış iş tokenı/);
  assert.match(sql,/for update skip locked limit p_limit/);
  assert.match(sql,/where x\.status='pending' or \(x\.status='failed' and x\.attempt_count<3\)/);
  assert.doesNotMatch(sql,/x\.status='sent'/);
  assert.match(sql,/attempt_count<3/g);
  assert.match(sql,/processing_started_at<now\(\)-interval '15 minutes'/);
  for(const reason of ["entitlement_changed","entitlement_inactive","reminder_window_expired","teacher_not_approved"])assert.match(sql,new RegExp(reason));
  assert.match(sql,/grant execute on function public\.service_claim_membership_reminder_job\(uuid,integer\) to service_role/);
  assert.match(matrix,/SECURITY DEFINER toplamı \| 53/);
});

test("second enqueue and sent delivery remain idempotent",()=>{
  assert.match(sql,/unique\(entitlement_type,recipient_user_id,reminder_kind,entitlement_ends_at\)/);
  assert.equal((sql.match(/on conflict\(entitlement_type,recipient_user_id,reminder_kind,entitlement_ends_at\) do nothing/g)||[]).length,2);
  assert.match(fn,/"Idempotency-Key":`membership-reminder\/\$\{delivery\.id\}`/);
  assert.match(fn,/\.eq\("status","processing"\)\.eq\("attempt_count",delivery\.attempt_count\)/);
});

test("cron uses pg_cron pg_net and a short-lived token without authorization secret",()=>{
  assert.match(sql,/create extension if not exists pg_cron/);
  assert.match(sql,/create extension if not exists pg_net/);
  assert.match(sql,/now\(\)\+interval '15 minutes'/);
  assert.match(sql,/created_at<now\(\)-interval '7 days'/);
  assert.match(sql,/net\.http_post/);
  assert.match(sql,/membership-expiry-reminders-v1','5 6,12 \* \* \*'/);
  assert.match(sql,/select public\.run_membership_expiry_reminder_job\(\);/);
  assert.doesNotMatch(sql,/Authorization|service.role.key|vault/i);
});

test("worker is a non-browser token endpoint with safe bounded output",()=>{
  assert.match(config,/\[functions\.send-payment-decision-email\][\s\S]*?verify_jwt\s*=\s*true/);
  assert.match(config,/\[functions\.send-membership-expiry-reminders\][\s\S]*?verify_jwt\s*=\s*false/);
  assert.match(fn,/req\.headers\.has\("Origin"\).*403/);
  assert.match(fn,/req\.method!=="POST".*405/);
  assert.match(fn,/length>256/);
  assert.match(fn,/service_claim_membership_reminder_job/);
  assert.match(fn,/Idempotency-Key.*membership-reminder\/\$\{delivery\.id\}/);
  assert.match(fn,/auth\.admin\.getUserById/);
  assert.match(fn,/recipient_missing/);
  assert.match(fn,/claimed,sent,failed,skipped/);
  assert.doesNotMatch(fn,/console\.|SUPABASE_SERVICE_ROLE_KEY\s*=|RESEND_API_KEY\s*=/);
});

const sample=(entitlement_type,reminder_kind)=>({entitlement_type,reminder_kind,plan_name:"Aile <Özel>",plan_code:'FAMILY_"MONTHLY"',entitlement_ends_at:"2026-07-26T09:30:00.000Z"});
test("template renders four exact Turkish subjects and safe content",()=>{
  const cases=[
    ["family_subscription","days_7","Üyeliğiniz 7 gün sonra sona eriyor — Poma Academy"],
    ["family_subscription","days_1","Üyeliğiniz yarın sona eriyor — Poma Academy"],
    ["teacher_access","days_7","Öğretmen erişiminiz 7 gün sonra sona eriyor — Poma Academy"],
    ["teacher_access","days_1","Öğretmen erişiminiz yarın sona eriyor — Poma Academy"]
  ];
  for(const [type,kind,subject] of cases){
    const message=renderMembershipExpiryReminder(sample(type,kind));
    assert.equal(message.subject,subject);
    assert.match(message.text,/otomatik olarak yenilenmez/);
    assert.match(message.text,/pomante\.com\.tr\/#\/membership/);
    assert.match(message.html,/<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport"/);
    assert.match(message.html,/Aile &lt;Özel&gt;/);
    assert.match(message.html,/FAMILY_&quot;MONTHLY&quot;/);
    assert.doesNotMatch(message.text,/kampanya|indirim/i);
  }
});

test("deployed reminder sources are byte-level ASCII only and mojibake-free",()=>{
  const bad=["Ãƒ","Ã„","Ã…","Ã‚","Ã¢â‚¬","ï¿½"];
  for(const source of sources){
    const buffer=fs.readFileSync(new URL(`../${source}`,import.meta.url));
    assert.equal([...buffer].every(byte=>byte<=127),true,source);
    const text=buffer.toString("utf8");for(const token of bad)assert.doesNotMatch(text,new RegExp(token));
  }
});

test("partner cleanup removes reminders only by exact E2E user ids",()=>{
  const cleanup=sql.slice(sql.indexOf("create or replace function public.service_cleanup_partner_e2e_run"),sql.indexOf("do $$declare v_job_id"));
  assert.match(sql,/delete from public\.membership_expiry_reminder_deliveries d where d\.recipient_user_id=any\(v_user_ids\)/);
  assert.match(sql,/membership_reminders_deleted/);
  assert.match(sql,/membership_reminders_remaining/);
  assert.doesNotMatch(cleanup,/delete from public\.membership_reminder_job_tokens/);
});
