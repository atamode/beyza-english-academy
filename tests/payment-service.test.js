import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { createPaymentService, MAX_RECEIPT_BYTES } from "../js/payment-service.js";

function rpcClient(handler) {
  return { rpc: async (name, args) => handler(name, args) };
}

test("payment request sends no client-controlled price, owner or status", async () => {
  let call;
  const service = createPaymentService(rpcClient(async (name, args) => (call = { name, args }, { data: [{ id: "p1" }], error: null })));
  await service.createPaymentRequest({ planCode: "FAMILY_MONTHLY", paymentMethod: "bank_transfer", listPrice: 1, status: "approved", userId: "other" });
  assert.equal(call.name, "create_payment_request");
  assert.deepEqual(Object.keys(call.args).sort(), ["p_coupon_code","p_instagram_username","p_payment_method","p_plan_code","p_sender_name","p_transfer_date"].sort());
});

test("receipt upload validates type and size before storage", async () => {
  const service = createPaymentService({});
  await assert.rejects(() => service.uploadPaymentReceipt({ paymentRequestId: "p", userId: "u", file: { type: "text/html", size: 2 } }), /PDF, JPG veya PNG/);
  await assert.rejects(() => service.uploadPaymentReceipt({ paymentRequestId: "p", userId: "u", file: { type: "image/png", size: MAX_RECEIPT_BYTES + 1 } }), /10 MB/);
});

test("receipt path is scoped to authenticated user and payment request", async () => {
  let uploadedPath; let registered;
  const client = {
    storage: { from: () => ({ upload: async path => (uploadedPath = path, { data: {}, error: null }) }) },
    rpc: async (name, args) => (registered = { name, args }, { data: [{ id: "r1" }], error: null })
  };
  const oldCrypto = globalThis.crypto;
  Object.defineProperty(globalThis, "crypto", { configurable: true, value: { randomUUID: () => "random-id" } });
  try {
    await createPaymentService(client).uploadPaymentReceipt({ paymentRequestId: "pay-1", userId: "user-1", file: { type: "image/jpeg", size: 10, name: "x.jpg" } });
  } finally { Object.defineProperty(globalThis, "crypto", { configurable: true, value: oldCrypto }); }
  assert.equal(uploadedPath, "user-1/pay-1/random-id.jpg");
  assert.equal(registered.name, "register_payment_receipt");
  assert.equal(registered.args.p_storage_path, uploadedPath);
});

test("rejectPayment requires an admin note before RPC", async () => {
  let called = false;
  const service = createPaymentService(rpcClient(async () => (called = true, { data: [], error: null })));
  await assert.rejects(() => service.rejectPayment("p1", "  "), /zorunlu/);
  assert.equal(called, false);
});

test("membership migration contains DB-enforced payment and RLS invariants", () => {
  const sql = fs.readFileSync(new URL("../supabase/migrations/202607160001_membership_payments_phase1.sql", import.meta.url), "utf8");
  assert.match(sql, /payment_code text not null unique default public\.generate_payment_code/);
  assert.match(sql, /extensions\.digest/);
  assert.match(sql, /user_id=auth\.uid\(\) or public\.is_poma_admin\(\)/);
  assert.match(sql, /grant select on public\.plans,public\.payment_requests,public\.payment_receipts/);
  assert.match(sql, /if not public\.is_poma_admin\(\) then raise exception/);
  assert.match(sql, /r\.status not in \('pending','receipt_sent'\)/);
  assert.match(sql, /base:=greatest\(base,now\(\)\)/);
  assert.match(sql, /interval '12 months'/);
  assert.match(sql, /\('payment-receipts','payment-receipts',false,10485760/);
  assert.match(sql, /p_storage_path not like auth\.uid\(\)::text/);
  assert.match(sql, /discount_amount <= list_price and payable_amount = list_price-discount_amount/);
});
