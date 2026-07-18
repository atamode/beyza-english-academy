import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const migration=fs.readFileSync(new URL("../supabase/migrations/20260719000100_unified_admin_audit_log.sql",import.meta.url),"utf8");
const service=fs.readFileSync(new URL("../js/teacher-partner-service.js",import.meta.url),"utf8");
const entry=fs.readFileSync(new URL("../js/teacher-partner-entry.js",import.meta.url),"utf8");
const view=fs.readFileSync(new URL("../js/admin-audit-view.js",import.meta.url),"utf8");
const e2e=fs.readFileSync(new URL("../scripts/live-partner-payment-e2e.mjs",import.meta.url),"utf8");
const matrix=fs.readFileSync(new URL("../docs/security/SECURITY_DEFINER_MATRIX_2026-07-18.md",import.meta.url),"utf8");
const build=fs.readFileSync(new URL("../scripts/build.js",import.meta.url),"utf8");

test("common admin audit is locked down and instruments critical mutations",()=>{
  assert.match(migration,/create table public\.admin_audit_log/);
  assert.match(migration,/enable row level security/);
  assert.match(migration,/revoke all on table public\.admin_audit_log from public, anon, authenticated, service_role/);
  assert.match(migration,/record_admin_audit[\s\S]*security invoker[\s\S]*set search_path = ''/);
  assert.match(migration,/list_admin_audit_log[\s\S]*security definer[\s\S]*set search_path = ''/);
  assert.match(migration,/p_limit < 1 or p_limit > 200/);
  assert.match(migration,/revoke all on function public\.list_admin_audit_log\(text,text,integer\) from public, anon, authenticated, service_role/);
  assert.match(migration,/grant execute on function public\.list_admin_audit_log\(text,text,integer\) to authenticated/);
  for(const action of ["teacher_approval_changed","teacher_partner_upserted","payment_approved","payment_rejected","commission_payout_created","commission_payout_cancelled","commission_payout_paid"]){assert.match(migration,new RegExp(`record_admin_audit\\('${action}'|record_admin_audit\\(case[\\s\\S]*'${action}'`))}
  for(const forbiddenKey of ["email","password","jwt","api_key","receipt_path","original_filename","instagram_username","student_code","class_code","payment_code","raw_user_meta_data","raw_app_meta_data"]){assert.doesNotMatch(migration,new RegExp(`jsonb_build_object\\([^;]*'${forbiddenKey}'`,"i"))}
  assert.match(migration,/delete from public\.admin_audit_log[\s\S]*entity_id=any\(v_teacher_ids\)[\s\S]*entity_id=any\(v_payment_ids\)[\s\S]*entity_id=any\(v_payout_ids\)/);
});

test("admin audit UI is read-only, filtered, and limited to recent records",()=>{
  assert.match(service,/list_admin_audit_log/);
  assert.match(entry,/limit:100/);
  assert.match(view,/Yönetici İşlem Geçmişi/);
  assert.match(build,/js\/admin-audit-view\.js/);
  for(const filter of ["all","payments","teachers","partners","payouts"])assert.match(view,new RegExp(`\\["${filter}"`));
  assert.doesNotMatch(view,/data-action=.*(?:delete|edit|save)/i);
});

test("live E2E and security matrix cover audit counts and cleanup",()=>{
  assert.match(e2e,/admin_audit_log_remaining, 0/);
  assert.match(e2e,/auditRows[\s\S]*teacher_approval_changed[\s\S]*commission_payout_paid/);
  assert.match(matrix,/SECURITY DEFINER toplamı \| 52/);
  assert.match(matrix,/authenticated execute \| 39/);
  assert.match(matrix,/`list_admin_audit_log`/);
});
