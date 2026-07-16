import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import crypto from "node:crypto";
import { SUPABASE_CONFIG } from "../js/account-config.js";

function loadEnv(path) {
  const out = {};
  for (const raw of fs.readFileSync(path, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#") || !line.includes("=")) continue;
    const i = line.indexOf("=");
    let value = line.slice(i + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    out[line.slice(0, i).trim()] = value;
  }
  return out;
}

const env = loadEnv(new URL("../.env.rls.local", import.meta.url));
const required = ["RLS_USER_A_EMAIL","RLS_USER_A_PASSWORD","RLS_USER_B_EMAIL","RLS_USER_B_PASSWORD","RLS_ADMIN_EMAIL","RLS_ADMIN_PASSWORD"];
for (const key of required) assert.ok(env[key], `Eksik canlı test değişkeni: ${key}`);

const base = SUPABASE_CONFIG.url.replace(/\/$/, "");
const anonKey = SUPABASE_CONFIG.publishableKey;
const runId = `${Date.now().toString(36)}-${crypto.randomBytes(4).toString("hex")}`;
const marker = `RLS-${runId}`;
const resumeAfterPreflight = process.env.RLS_RESUME_AFTER_PREFLIGHT === "1";

async function raw(path, { token, method = "GET", body, headers = {} } = {}) {
  const response = await fetch(`${base}${path}`, {
    method,
    headers: { apikey: anonKey, Authorization: `Bearer ${token || anonKey}`, ...headers },
    body: body == null ? undefined : (body instanceof Uint8Array ? body : JSON.stringify(body))
  });
  let data = null;
  const text = await response.text();
  if (text) { try { data = JSON.parse(text); } catch { data = null; } }
  return { ok: response.ok, status: response.status, data };
}

async function login(email, password) {
  const r = await raw("/auth/v1/token?grant_type=password", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: { email, password }
  });
  assert.equal(r.ok, true, "Test hesabı oturum açamadı");
  return { token: r.data.access_token, user: r.data.user };
}

const rest = (table, token, query = "") => raw(`/rest/v1/${table}${query ? `?${query}` : ""}`, { token });
const rpc = (name, token, args = {}) => raw(`/rest/v1/rpc/${name}`, {
  token, method: "POST", headers: { "Content-Type": "application/json" }, body: args
});
const createPayment = (token, plan = "FAMILY_MONTHLY", method = "bank_transfer") => rpc("create_payment_request", token, {
  p_plan_code: plan, p_payment_method: method, p_coupon_code: null,
  p_instagram_username: method === "instagram" ? `rls_${runId.replace(/-/g, "")}` : null,
  p_sender_name: marker, p_transfer_date: new Date().toISOString().slice(0, 10)
});

async function upload(token, path, bytes, mime) {
  return raw(`/storage/v1/object/payment-receipts/${path.split("/").map(encodeURIComponent).join("/")}`, {
    token, method: "POST", headers: { "Content-Type": mime, "x-upsert": "false" }, body: bytes
  });
}

test("live Supabase RLS integration", async t => {
  const a = await login(env.RLS_USER_A_EMAIL, env.RLS_USER_A_PASSWORD);
  const b = await login(env.RLS_USER_B_EMAIL, env.RLS_USER_B_PASSWORD);
  const admin = await login(env.RLS_ADMIN_EMAIL, env.RLS_ADMIN_PASSWORD);
  let aPayment, aReceiptPath;

  await t.test("admin JWT app_metadata is server-authorized", { skip: resumeAfterPreflight }, () => {
    assert.equal(admin.user?.app_metadata?.role, "admin");
    assert.equal(admin.user?.app_metadata?.is_admin, true);
  });

  await t.test("anonymous cannot read personal tables or invoke write/coupon RPCs", { skip: resumeAfterPreflight }, async () => {
    for (const table of ["payment_requests","payment_receipts","subscriptions","coupon_redemptions"]) {
      const r = await rest(table, null, "select=id&limit=1");
      assert.equal(r.ok && Array.isArray(r.data) && r.data.length > 0, false, `${table} anon tarafından görünür`);
    }
    assert.equal((await createPayment(null)).ok, false);
    assert.equal((await rpc("validate_coupon", null, { p_plan_code: "FAMILY_MONTHLY", p_coupon_code: "NOPE" })).ok, false);
    assert.equal((await upload(null, `anonymous/${crypto.randomUUID()}/x.png`, new Uint8Array([1]), "image/png")).ok, false);
    assert.equal((await raw("/storage/v1/object/payment-receipts/no/such/file", {})).ok, false);
  });

  await t.test("user A creates server-priced monthly payment and FREE_STARTER is excluded", async () => {
    const r = await createPayment(a.token);
    assert.equal(r.ok, true, `create_payment_request başarısız: HTTP ${r.status}, kod ${r.data?.code || "yok"}`);
    aPayment = Array.isArray(r.data) ? r.data[0] : r.data;
    assert.equal(aPayment.user_id, a.user.id);
    assert.equal(Number(aPayment.list_price), 299);
    assert.equal(Number(aPayment.discount_amount), 0);
    assert.equal(Number(aPayment.payable_amount), 299);
    assert.equal(aPayment.status, "pending");
    assert.match(aPayment.payment_code, /^POMA-[A-F0-9]{6}$/);
    assert.equal((await createPayment(a.token, "FREE_STARTER")).ok, false);
    const forged = await raw("/rest/v1/payment_requests", { token: a.token, method: "POST", headers: { "Content-Type": "application/json" }, body: {
      user_id: b.user.id, plan_id: aPayment.plan_id, payment_code: "POMA-AAAAAA", list_price: 1,
      discount_amount: 1, payable_amount: 0, payment_method: "bank_transfer", status: "approved"
    }});
    assert.equal(forged.ok, false);
  });

  await t.test("user A uploads and registers a small PNG receipt on the required path", async () => {
    aReceiptPath = `${a.user.id}/${aPayment.id}/${crypto.randomUUID()}.png`;
    assert.equal((await upload(a.token, aReceiptPath, new Uint8Array([137,80,78,71,13,10,26,10]), "image/png")).ok, true);
    const reg = await rpc("register_payment_receipt", a.token, {
      p_payment_request_id: aPayment.id, p_storage_path: aReceiptPath,
      p_original_filename: "rls.png", p_mime_type: "image/png", p_size_bytes: 8
    });
    assert.equal(reg.ok, true);
    const own = await rest("payment_receipts", a.token, `select=id,storage_path&payment_request_id=eq.${aPayment.id}`);
    assert.equal(own.ok, true); assert.equal(own.data.length, 1); assert.equal(own.data[0].storage_path, aReceiptPath);
  });

  await t.test("user B cannot read or operate on user A records and storage", async () => {
    for (const table of ["payment_requests","payment_receipts","subscriptions"]) {
      const column = table === "payment_receipts" ? "payment_request_id" : table === "subscriptions" ? "user_id" : "id";
      const value = table === "subscriptions" ? a.user.id : aPayment.id;
      const r = await rest(table, b.token, `select=*&${column}=eq.${value}`);
      assert.equal(r.ok, true); assert.deepEqual(r.data, []);
    }
    assert.equal((await upload(b.token, aReceiptPath.replace(/\.png$/, "-b.png"), new Uint8Array([1]), "image/png")).ok, false);
    assert.equal((await raw(`/storage/v1/object/payment-receipts/${aReceiptPath}`, { token: b.token })).ok, false);
    assert.equal((await raw(`/storage/v1/object/sign/payment-receipts/${aReceiptPath}`, { token: b.token, method: "POST", headers: { "Content-Type": "application/json" }, body: { expiresIn: 60 } })).ok, false);
    const listed = await raw("/storage/v1/object/list/payment-receipts", { token: b.token, method: "POST", headers: { "Content-Type": "application/json" }, body: { prefix: `${a.user.id}/`, limit: 100 } });
    assert.equal(listed.ok, true); assert.deepEqual(listed.data, []);
    assert.equal((await rpc("register_payment_receipt", b.token, { p_payment_request_id: aPayment.id, p_storage_path: aReceiptPath, p_original_filename: "x.png", p_mime_type: "image/png", p_size_bytes: 8 })).ok, false);
  });

  await t.test("Instagram receipt only marks receipt_sent and creates no subscription", async () => {
    const made = await createPayment(a.token, "FAMILY_MONTHLY", "instagram");
    assert.equal(made.ok, true); const p = Array.isArray(made.data) ? made.data[0] : made.data;
    const marked = await rpc("mark_instagram_receipt_sent", a.token, { p_payment_request_id: p.id, p_instagram_username: `rls_${runId}` });
    assert.equal(marked.ok, true); assert.equal((Array.isArray(marked.data) ? marked.data[0] : marked.data).status, "receipt_sent");
    const subs = await rest("subscriptions", a.token, `select=id&source_payment_request_id=eq.${p.id}`);
    assert.deepEqual(subs.data, []);
  });

  await t.test("normal users cannot approve or reject", async () => {
    assert.equal((await rpc("approve_payment", a.token, { p_payment_request_id: aPayment.id, p_admin_note: null })).ok, false);
    assert.equal((await rpc("reject_payment", a.token, { p_payment_request_id: aPayment.id, p_admin_note: "no" })).ok, false);
  });

  await t.test("admin lists payments and creates a short signed receipt URL", async () => {
    const list = await rest("payment_requests", admin.token, `select=id&sender_name=eq.${encodeURIComponent(marker)}`);
    assert.equal(list.ok, true); assert.ok(list.data.length >= 1);
    const signed = await raw(`/storage/v1/object/sign/payment-receipts/${aReceiptPath}`, { token: admin.token, method: "POST", headers: { "Content-Type": "application/json" }, body: { expiresIn: 60 } });
    assert.equal(signed.ok, true); assert.ok(signed.data?.signedURL || signed.data?.signedUrl);
  });

  await t.test("rejection requires note and never creates subscription", async () => {
    const made = await createPayment(a.token); assert.equal(made.ok, true); const p = Array.isArray(made.data) ? made.data[0] : made.data;
    assert.equal((await rpc("reject_payment", admin.token, { p_payment_request_id: p.id, p_admin_note: "" })).ok, false);
    assert.equal((await rpc("reject_payment", admin.token, { p_payment_request_id: p.id, p_admin_note: `RLS ${runId}` })).ok, true);
    const subs = await rest("subscriptions", admin.token, `select=id&source_payment_request_id=eq.${p.id}`);
    assert.deepEqual(subs.data, []);
  });

  await t.test("monthly approval adds 30 days and cannot be repeated", async () => {
    const made = await createPayment(a.token); assert.equal(made.ok, true); const p = Array.isArray(made.data) ? made.data[0] : made.data;
    const before = await rest("subscriptions", admin.token, `select=ends_at&user_id=eq.${a.user.id}&status=eq.active&ends_at=gt.${encodeURIComponent(new Date().toISOString())}&order=ends_at.desc&limit=1`);
    const baseDate = before.data?.[0]?.ends_at ? new Date(before.data[0].ends_at) : new Date();
    assert.equal((await rpc("approve_payment", admin.token, { p_payment_request_id: p.id, p_admin_note: marker })).ok, true);
    assert.equal((await rpc("approve_payment", admin.token, { p_payment_request_id: p.id, p_admin_note: marker })).ok, false);
    const sub = await rest("subscriptions", admin.token, `select=ends_at&source_payment_request_id=eq.${p.id}`);
    assert.equal(sub.data.length, 1);
    const delta = new Date(sub.data[0].ends_at) - baseDate;
    assert.ok(Math.abs(delta - 30 * 86400000) < 5000, "Aylık üyelik 30 gün eklemedi");
  });

  await t.test("two concurrent approvals yield exactly one success", async () => {
    const made = await createPayment(a.token); assert.equal(made.ok, true); const p = Array.isArray(made.data) ? made.data[0] : made.data;
    const results = await Promise.all([
      rpc("approve_payment", admin.token, { p_payment_request_id: p.id, p_admin_note: marker }),
      rpc("approve_payment", admin.token, { p_payment_request_id: p.id, p_admin_note: marker })
    ]);
    assert.equal(results.filter(x => x.ok).length, 1);
  });

  await t.test("yearly approval preserves future time and adds calendar 12 months", async () => {
    const before = await rest("subscriptions", admin.token, `select=ends_at&user_id=eq.${a.user.id}&status=eq.active&ends_at=gt.${encodeURIComponent(new Date().toISOString())}&order=ends_at.desc&limit=1`);
    assert.ok(before.data?.[0]?.ends_at); const baseDate = new Date(before.data[0].ends_at);
    const made = await createPayment(a.token, "FAMILY_YEARLY"); assert.equal(made.ok, true); const p = Array.isArray(made.data) ? made.data[0] : made.data;
    assert.equal((await rpc("approve_payment", admin.token, { p_payment_request_id: p.id, p_admin_note: marker })).ok, true);
    const sub = await rest("subscriptions", admin.token, `select=ends_at&source_payment_request_id=eq.${p.id}`);
    const expected = new Date(baseDate); expected.setUTCMonth(expected.getUTCMonth() + 12);
    assert.ok(Math.abs(new Date(sub.data[0].ends_at) - expected) < 5000, "Yıllık üyelik takvimsel 12 ay eklemedi");
  });

  await t.test("Storage accepts PDF/JPEG/PNG and rejects MIME, oversize and invalid paths", async () => {
    const made = await createPayment(a.token); assert.equal(made.ok, true); const p = Array.isArray(made.data) ? made.data[0] : made.data;
    for (const [ext,mime,bytes] of [["pdf","application/pdf",[37,80,68,70]],["jpg","image/jpeg",[255,216,255]],["png","image/png",[137,80,78,71]]]) {
      const path = `${a.user.id}/${p.id}/${crypto.randomUUID()}.${ext}`;
      assert.equal((await upload(a.token, path, new Uint8Array(bytes), mime)).ok, true, `${mime} reddedildi`);
    }
    assert.equal((await upload(a.token, `${a.user.id}/${p.id}/${crypto.randomUUID()}.txt`, new Uint8Array([1]), "text/plain")).ok, false);
    assert.equal((await upload(a.token, `${a.user.id}/${p.id}/${crypto.randomUUID()}.png`, new Uint8Array(10 * 1024 * 1024 + 1), "image/png")).ok, false);
    assert.equal((await upload(a.token, `${a.user.id}/${crypto.randomUUID()}/bad.png`, new Uint8Array([1]), "image/png")).ok, false);
    assert.equal((await upload(a.token, `${b.user.id}/${p.id}/bad.png`, new Uint8Array([1]), "image/png")).ok, false);
  });
});
