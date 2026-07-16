import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { adminPaymentsView, isAdminUser, paymentCenterView, paymentHistory, paymentResult, planCards, validateReceiptFile } from "../js/payment-views.js";

const plans=[
  {code:"FREE_STARTER",name:"Ücretsiz",price:0,duration_days:null},
  {code:"FAMILY_MONTHLY",name:"Aylık",price:299,duration_days:30},
  {code:"FAMILY_YEARLY",name:"Yıllık",price:1990,duration_days:365}
];
const entry=fs.readFileSync(new URL("../js/payment-entry.js",import.meta.url),"utf8");
const service=fs.readFileSync(new URL("../js/payment-service.js",import.meta.url),"utf8");
const adminMigration=fs.readFileSync(new URL("../supabase/migrations/202607160004_admin_payment_list.sql",import.meta.url),"utf8");

test("plans render from supplied server rows and FREE_STARTER has no payment action",()=>{
  const html=planCards(plans);assert.match(html,/299,00/);assert.doesNotMatch(html,/data-plan-code="FREE_STARTER">Bu planı seç/);
});
test("payment UI does not hard-code paid prices",()=>{assert.doesNotMatch(entry,/299|1990|1\.990/);});
test("created payment displays server payment code and amount",()=>{assert.match(paymentResult({payment_code:"POMA-ABC123",payable_amount:250}),/POMA-ABC123/);});
test("coupon success and failure use server validation",()=>{assert.match(entry,/payments\.validateCoupon/);assert.match(entry,/Kupon geçersiz/);});
test("invalid receipt MIME is blocked",()=>assert.throws(()=>validateReceiptFile({type:"text/plain",size:2}),/PDF/));
test("receipt over 10 MB is blocked",()=>assert.throws(()=>validateReceiptFile({type:"image/png",size:10*1024*1024+1}),/10 MB/));
test("site receipt upload calls service",()=>assert.match(entry,/payments\.uploadPaymentReceipt/));
test("Instagram is shown as review pending, never approved",()=>{assert.match(entry,/Ödeme onaylanmadı; inceleme bekleniyor/);assert.doesNotMatch(entry,/markInstagramReceiptSent[\s\S]{0,120}approvePayment/);});
test("history loads only with current authenticated user id",()=>{assert.match(entry,/payments\.listMyPayments\(user\.id\)/);assert.doesNotMatch(entry,/dataset\.userId|URLSearchParams/);});
test("rejection admin note is visible in history",()=>assert.match(paymentHistory([{id:"1",status:"rejected",payment_code:"POMA-X",payable_amount:1,admin_note:"Eksik dekont",plans:{name:"A"}}]),/Eksik dekont/));
test("admin route requires JWT app metadata",()=>{assert.equal(isAdminUser({app_metadata:{role:"admin",is_admin:true}}),true);assert.equal(isAdminUser({app_metadata:{role:"parent"}}),false);assert.match(entry,/if \(!isAdminUser\(user\)\)/);});
test("admin defaults to pending list and supports search",()=>{const html=adminPaymentsView([],{});assert.match(html,/value="pending" selected/);assert.match(html,/data-admin-search/);});
test("signed URL is opened transiently and never persisted",()=>{assert.match(entry,/getReceiptSignedUrl\(path,60\)/);assert.doesNotMatch(entry,/localStorage[\s\S]*signed|signed[\s\S]*localStorage/i);});
test("approve and reject use RPC service, not direct update",()=>{assert.match(entry,/payments\.approvePayment/);assert.match(entry,/payments\.rejectPayment/);assert.doesNotMatch(entry,/from\("payment_requests"\)\.update/);assert.match(service,/rpc\("approve_payment"/);});
test("reject requires note before service call",()=>assert.match(entry,/action==="reject-payment"&&!note/));
test("busy set prevents double create and review",()=>{assert.match(entry,/screen\.busy\.has\(key\)/);assert.match(entry,/screen\.busy\.add\(key\)/);});
test("route changes clear sensitive payment state",()=>{assert.match(entry,/function clearSensitiveState/);assert.match(entry,/clearSensitiveState\(\);/);});
test("payment center exposes recommended storage and optional Instagram",()=>{const html=paymentCenterView({plans,subscription:null,payments:[]});assert.match(html,/güvenli dekont yükle \(önerilen\)/);assert.match(html,/Instagram’dan gönder/);});
test("bank config never displays invented details",()=>{const html=paymentResult({payment_code:"POMA-X",payable_amount:10});assert.match(html,/Banka bilgileri henüz tanımlanmadı/);assert.doesNotMatch(html,/TR\d{2}/);});
test("admin payment RPC is SECURITY DEFINER with fixed search_path and closed PUBLIC execution",()=>{
  assert.match(adminMigration,/security definer\s+set search_path = public/i);
  assert.match(adminMigration,/revoke all on function public\.list_admin_payments\(\) from public,anon,authenticated/i);
  assert.match(adminMigration,/if not public\.is_poma_admin\(\)/i);
});
