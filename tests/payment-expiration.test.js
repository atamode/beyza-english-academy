import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const migration=fs.readFileSync(new URL("../supabase/migrations/20260719000200_payment_request_expiration.sql",import.meta.url),"utf8");
const views=fs.readFileSync(new URL("../js/payment-views.js",import.meta.url),"utf8");
const entry=fs.readFileSync(new URL("../js/payment-entry.js",import.meta.url),"utf8");
const e2e=fs.readFileSync(new URL("../scripts/live-partner-payment-e2e.mjs",import.meta.url),"utf8");
const matrix=fs.readFileSync(new URL("../docs/security/SECURITY_DEFINER_MATRIX_2026-07-18.md",import.meta.url),"utf8");

test("payment requests expire after 72 hours and release only their coupon reservations",()=>{
  assert.match(migration,/add column expires_at timestamptz/);
  assert.match(migration,/add column expired_at timestamptz/);
  assert.match(migration,/drop constraint payment_requests_status_check/);
  assert.match(migration,/status in \('pending','receipt_sent','approved','rejected','expired'\)/);
  assert.match(migration,/expires_at >= created_at/);
  assert.match(migration,/now\(\) \+ interval '72 hours'/);
  assert.match(migration,/create index payment_requests_pending_expiry_idx[\s\S]*on public\.payment_requests\(expires_at\)[\s\S]*where status = 'pending'/);
  assert.match(migration,/where status = 'pending'[\s\S]*expires_at <= now\(\)[\s\S]*returning id[\s\S]*delete from public\.coupon_redemptions/);
  assert.doesNotMatch(migration,/status in \('pending','receipt_sent'\)[\s\S]*set status = 'expired'/);
});

test("expiration helper is internal invoker and all payment RPC gates are wired",()=>{
  assert.match(migration,/expire_stale_payment_requests\(p_user_id uuid default null\)[\s\S]*security invoker[\s\S]*set search_path = ''/);
  assert.match(migration,/alter function public\.expire_stale_payment_requests\(uuid\) owner to postgres/);
  assert.match(migration,/revoke all on function public\.expire_stale_payment_requests\(uuid\)[\s\S]*public, anon, authenticated, service_role/);
  assert.match(migration,/create_payment_request[\s\S]*expire_stale_payment_requests\(auth\.uid\(\)\)[\s\S]*expires_at/);
  assert.match(migration,/list_admin_payments[\s\S]*expire_stale_payment_requests\(null\)[\s\S]*pr\.expires_at,pr\.expired_at/);
  assert.match(migration,/review_payment[\s\S]*expire_stale_payment_requests\(null\)[\s\S]*oldrow\.status='expired'[\s\S]*Ödeme talebinin süresi dolmuş\./);
  assert.match(migration,/register_payment_receipt[\s\S]*v_payment\.status='expired'[\s\S]*Yeni talep oluşturun/);
  assert.match(migration,/mark_instagram_receipt_sent[\s\S]*expires_at>now\(\)/);
  assert.match(migration,/oldrow\.status not in\('pending','receipt_sent'\)/);
  assert.doesNotMatch(migration,/record_admin_audit\([^;]*expired/);
});

test("user and admin payment UI present expiry without expired mutations",()=>{
  assert.match(views,/effectivePaymentStatus/);
  assert.match(views,/expired:\["⌛","Süresi doldu"\]/);
  assert.match(views,/Son geçerlilik tarihi/);
  assert.match(views,/Talep süresi[\s\S]*72 saat/);
  assert.match(views,/Kalan süre/);
  assert.match(views,/Yeni ödeme talebi oluştur/);
  assert.match(entry,/new-payment-request/);
  assert.match(views,/value="expired"[\s\S]*Süresi doldu/);
  assert.match(views,/Süresi dolan talep için yönetici işlemi yoktur/);
  assert.match(views,/\["pending","receipt_sent"\]\.includes\(row\.status\)/);
});

test("E2E and security matrix retain the 53-function baseline",()=>{
  assert.match(e2e,/first\.created_at && first\.expires_at/);
  assert.match(e2e,/72 \* 60 \* 60 \* 1000/);
  assert.match(matrix,/SECURITY DEFINER toplamı \| 53/);
  assert.match(matrix,/`expire_stale_payment_requests\(uuid\)`[\s\S]*SECURITY INVOKER/);
});
