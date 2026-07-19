import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read=file=>fs.readFileSync(new URL(`../${file}`,import.meta.url),"utf8");
const migration=read("supabase/migrations/20260719000300_payment_decision_email_delivery.sql");
const fn=read("supabase/functions/send-payment-decision-email/index.ts");
const config=read("supabase/config.toml");
const service=read("js/payment-service.js"),entry=read("js/payment-entry.js"),views=read("js/payment-views.js"),e2e=read("scripts/live-partner-payment-e2e.mjs"),matrix=read("docs/security/SECURITY_DEFINER_MATRIX_2026-07-18.md");

test("delivery table is a locked service-update-only outbox",()=>{
  assert.match(migration,/alter table public\.payment_email_deliveries enable row level security/i);
  assert.match(migration,/revoke all on table public\.payment_email_deliveries from public,anon,authenticated,service_role/i);
  assert.match(migration,/grant select,update on table public\.payment_email_deliveries to service_role/i);
  assert.doesNotMatch(migration,/grant[^;]*(insert|delete)[^;]*payment_email_deliveries/i);
  assert.match(migration,/unique\(payment_request_id,decision\)/i);for(const statement of migration.split(";"))if(/insert into public\.payment_email_deliveries/i.test(statement))assert.doesNotMatch(statement,/\bselect\b[\s\S]*from public\.payment_requests/i);
});

test("review transaction creates only decided delivery snapshots and cleanup is exact",()=>{
  assert.equal((migration.match(/insert into public\.payment_email_deliveries/g)||[]).length,3);
  assert.match(migration,/if p_decision='rejected'[\s\S]*'rejected'[\s\S]*return r/i);assert.match(migration,/p\.code='TEACHER_MONTHLY'[\s\S]*credit_end[\s\S]*on conflict/i);assert.match(migration,/'approved'[\s\S]*finish[\s\S]*on conflict/i);
  assert.match(migration,/if oldrow\.status='expired' then raise exception[\s\S]*if oldrow\.status not in\('pending','receipt_sent'\)[\s\S]*update public\.payment_requests set status=p_decision/i);
  assert.match(migration,/delete from public\.payment_email_deliveries d where d\.payment_request_id=any\(v_payment_ids\)/i);assert.match(e2e,/payment_email_deliveries_remaining, 0/);assert.match(e2e,/deliveries\.length, 3/);
});

test("Edge Function keeps JWT, admin, CORS, claim and Resend secrets safe",()=>{
  assert.match(config,/\[functions\.send-payment-decision-email\][\s\S]*verify_jwt\s*=\s*true/);assert.match(fn,/auth\.getUser\(token\)/);assert.match(fn,/rpc\("is_poma_admin"\)/);assert.match(fn,/isAdmin!==true[\s\S]*403/);
  assert.match(fn,/SUPABASE_SERVICE_ROLE_KEY/);assert.doesNotMatch(`${service}\n${entry}\n${views}`,/SUPABASE_SERVICE_ROLE_KEY|RESEND_API_KEY/);
  assert.match(fn,/Idempotency-Key.*payment-decision\/\$\{claimed\.id\}/s);assert.match(fn,/attempt_count.*delivery\.attempt_count\+1/s);assert.match(fn,/eq\("status",delivery\.status\).*eq\("attempt_count",delivery\.attempt_count\)/s);
  assert.doesNotMatch(migration,/recipient_email|email_address/i);assert.doesNotMatch(fn,/console\.(log|error)|recipient\.user\.email\s*[,)]/);
  for(const name of ["RESEND_API_KEY","EMAIL_FROM","EMAIL_REPLY_TO"])assert.match(fn,new RegExp(`Deno\\.env\\.get\\("${name}"\\)`));
});

test("admin retry states and SECURITY DEFINER count remain constrained",()=>{
  assert.match(service,/functions\.invoke\("send-payment-decision-email"/);assert.match(entry,/payments\.sendPaymentDecisionEmail/);assert.match(views,/\["pending","failed"\]\.includes\(row\.email_delivery_status\)/);assert.doesNotMatch(views,/processing[^\n]*retry-payment-email/);
  assert.match(matrix,/SECURITY DEFINER toplamı \| 52/);assert.match(matrix,/transactional e-posta outbox/);assert.match(matrix,/yeni bir SECURITY DEFINER fonksiyon eklemez/);
});
