import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";

const EXPECTED_REF = "gzsrcjovhhlfpvvpucri";
const DAY = 86400000;
const root = new URL("../", import.meta.url);

function loadEnvFile(name) {
  const file = new URL(name, root);
  if (!fs.existsSync(file)) return {};
  return Object.fromEntries(fs.readFileSync(file, "utf8").split(/\r?\n/).flatMap(raw => {
    const line = raw.trim();
    if (!line || line.startsWith("#") || !line.includes("=")) return [];
    const at = line.indexOf("=");
    let value = line.slice(at + 1).trim();
    if (/^(['"]).*\1$/.test(value)) value = value.slice(1, -1);
    return [[line.slice(0, at).trim(), value]];
  }));
}

const env = { ...loadEnvFile(".env.rls.local"), ...loadEnvFile(".env.e2e.local"), ...process.env };
const required = ["SUPABASE_URL", "SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY", "POMA_E2E_EXPECTED_PROJECT_REF", "POMA_E2E_ALLOW_PRODUCTION"];
const missing = required.filter(key => !env[key]);
if (missing.length) throw new Error(`Eksik E2E environment değişkenleri: ${missing.join(", ")}`);

const base = new URL(env.SUPABASE_URL);
const projectRef = base.hostname.split(".")[0];
if (env.POMA_E2E_EXPECTED_PROJECT_REF !== EXPECTED_REF || projectRef !== EXPECTED_REF)
  throw new Error("Production guard: Supabase proje ref eşleşmedi; hiçbir mutasyon yapılmadı.");
if (env.POMA_E2E_ALLOW_PRODUCTION !== "true")
  throw new Error("Production guard: POMA_E2E_ALLOW_PRODUCTION=true olmadan mutasyon yapılmaz.");

const stamp = new Date().toISOString().replace(/[-:]/g, "");
const runId = `poma-e2e-${stamp.slice(0, 8)}-${stamp.slice(9, 15)}-${crypto.randomBytes(4).toString("hex")}`;
const marker = `POMA E2E ${runId}`;
const password = crypto.randomBytes(32).toString("base64url") + "aA1!";
const emails = Object.fromEntries(["admin", "teacher", "parent"].map(kind => [kind, `e2e-${kind}+${runId}@e2e.invalid`]));
const userIds = [];

function logStep(name, result = "GEÇTİ") { console.log(`[${result}] ${name}`); }
function redactedError(error) {
  let message = String(error?.message || error).replace(/Bearer\s+\S+/gi, "Bearer [TOKEN]");
  for (const secret of [env.SUPABASE_SERVICE_ROLE_KEY, env.SUPABASE_ANON_KEY, password, ...Object.values(emails)])
    if (secret) message = message.replaceAll(secret, "[REDACTED]");
  return message;
}
function query(filters = {}) { return Object.entries(filters).map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`).join("&"); }

async function request(path, { key = env.SUPABASE_ANON_KEY, token = key, method = "GET", body, headers = {} } = {}) {
  let response;
  try {
    response = await fetch(`${base.origin}${path}`, {
      method,
      headers: { apikey: key, Authorization: `Bearer ${token}`, ...(body === undefined ? {} : { "Content-Type": "application/json" }), ...headers },
      body: body === undefined ? undefined : JSON.stringify(body)
    });
  } catch {
    return { ok: false, status: 0, data: { code: "FETCH_ERROR" } };
  }
  const text = await response.text();
  let data = null;
  if (text) { try { data = JSON.parse(text); } catch { data = text; } }
  return { ok: response.ok, status: response.status, data };
}

async function must(resultOrPromise, label) {
  const result = await resultOrPromise;
  if (!result.ok) throw new Error(`${label} başarısız (HTTP ${result.status}, kod ${result.data?.code || "yok"})`);
  return Array.isArray(result.data) && result.data.length === 1 ? result.data[0] : result.data;
}
const service = (path, options = {}) => request(path, { ...options, key: env.SUPABASE_SERVICE_ROLE_KEY, token: env.SUPABASE_SERVICE_ROLE_KEY });
const actor = (path, token, options = {}) => request(path, { ...options, token });
const rpc = (name, token, body = {}) => actor(`/rest/v1/rpc/${name}`, token, { method: "POST", body });
const rpcMust = (name, token, body = {}) => must(rpc(name, token, body), name);
async function rpcListMust(name, token, body = {}) {
  const result = await rpc(name, token, body);
  if (!result.ok) throw new Error(`${name} başarısız (HTTP ${result.status}, kod ${result.data?.code || "yok"})`);
  assert.ok(Array.isArray(result.data), `${name} satır listesi döndürmeliydi`);
  return result.data;
}

async function createUser(kind, appMetadata = {}) {
  const accountType = kind === "teacher" ? "teacher" : "parent";
  const user = await must(service("/auth/v1/admin/users", {
    method: "POST",
    body: {
      email: emails[kind], password, email_confirm: true, app_metadata: appMetadata,
      user_metadata: { display_name: marker, account_type: accountType, e2e_run_id: runId }
    }
  }), `create ${kind}`);
  userIds.push(user.id);
  return user;
}
async function login(kind) {
  const session = await must(request("/auth/v1/token?grant_type=password", { method: "POST", body: { email: emails[kind], password } }), `login ${kind}`);
  assert.ok(session.access_token);
  return session.access_token;
}
async function actorSelect(table, token, filters, columns = "*") {
  const suffix = query(filters);
  const result = await actor(`/rest/v1/${table}?select=${encodeURIComponent(columns)}${suffix ? `&${suffix}` : ""}`, token);
  if (!result.ok) throw new Error(`actor select ${table} başarısız (HTTP ${result.status}, kod ${result.data?.code || "yok"})`);
  assert.ok(Array.isArray(result.data), `${table} satır listesi döndürmeliydi`);
  return result.data;
}
async function expectRpcFailure(name, token, body) {
  const result = await rpc(name, token, body);
  assert.equal(result.ok, false, `${name} kontrollü biçimde reddedilmeliydi`);
}

async function cleanup() {
  const result = await rpcMust("service_cleanup_partner_e2e_run", env.SUPABASE_SERVICE_ROLE_KEY, { p_run_id: runId });
  assert.equal(result.matched_auth_users, userIds.length);
  assert.equal(result.admin_audit_log_remaining, 0);
  assert.equal(result.remaining_total, 0);
  for (const userId of [...userIds].reverse()) {
    const deletion = await service(`/auth/v1/admin/users/${userId}`, { method: "DELETE" });
    if (!deletion.ok && deletion.status !== 404) throw new Error(`auth cleanup başarısız (HTTP ${deletion.status})`);
  }
  let authRemaining = 0;
  for (const userId of userIds) {
    const verification = await service(`/auth/v1/admin/users/${userId}`);
    if (verification.ok) authRemaining += 1;
    else assert.equal(verification.status, 404);
  }
  assert.equal(authRemaining, 0);
  logStep(`cleanup doğrulandı; audit kalan=${result.admin_audit_log_remaining}, public kalan=${result.remaining_total}, auth kalan=${authRemaining}`);
}

console.log(`Poma partner E2E run: ${runId}`);
let flowError;
try {
  const admin = await createUser("admin", { role: "admin", is_admin: true });
  const teacher = await createUser("teacher");
  const parent = await createUser("parent");
  assert.equal(userIds.length, 3);
  const adminToken = await login("admin"), teacherToken = await login("teacher"), parentToken = await login("parent");
  logStep("geçici admin, öğretmen ve veli oluşturuldu");

  const teacherProfile = await actorSelect("teacher_profiles", teacherToken, { id: `eq.${teacher.id}` }, "id,display_name,approval_status");
  assert.equal(teacherProfile.length, 1);
  assert.equal(teacherProfile[0].approval_status, "pending");
  assert.equal(teacherProfile[0].display_name, marker);
  const selfApproval = await actor(`/rest/v1/teacher_profiles?id=eq.${teacher.id}`, teacherToken, {
    method: "PATCH", body: { approval_status: "approved" }, headers: { Prefer: "return=representation" }
  });
  assert.equal(selfApproval.ok, false);
  const approved = await rpcMust("admin_set_teacher_approval", adminToken, { p_teacher_id: teacher.id, p_status: "approved", p_admin_note: marker });
  assert.equal(approved.approval_status, "approved");
  assert.equal(approved.approved_by, admin.id);
  logStep("trigger pending profili ve admin öğretmen onayı doğrulandı");

  const registered = await rpcMust("register_my_teacher_partner", teacherToken);
  const partnerCode = `E2E${crypto.randomBytes(7).toString("hex").toUpperCase()}`;
  const partner = await rpcMust("admin_upsert_teacher_partner", adminToken, {
    p_teacher_id: teacher.id, p_partner_code: partnerCode, p_status: "active", p_commission_rate: 0.10,
    p_access_ends_at: new Date().toISOString(), p_admin_note: marker
  });
  assert.equal(partner.status, "active");
  assert.notEqual(registered.partner_code, partnerCode);
  logStep("öğretmen partner profili oluşturuldu ve admin tarafından aktifleştirildi");

  const makePayment = code => rpcMust("create_payment_request", parentToken, {
    p_plan_code: "FAMILY_MONTHLY", p_payment_method: "bank_transfer", p_coupon_code: null,
    p_instagram_username: null, p_sender_name: marker, p_transfer_date: new Date().toISOString().slice(0, 10), p_partner_code: code
  });
  const first = await makePayment(partnerCode);
  assert.ok(first.created_at && first.expires_at);
  assert.ok(Math.abs(new Date(first.expires_at) - new Date(first.created_at) - 72 * 60 * 60 * 1000) < 5000);
  await rpcMust("approve_payment", adminToken, { p_payment_request_id: first.id, p_admin_note: marker });
  const firstPayment = await actorSelect("payment_requests", parentToken, { id: `eq.${first.id}` }, "id,status,payable_amount");
  const firstSubscription = await actorSelect("subscriptions", parentToken, { source_payment_request_id: `eq.${first.id}` }, "id,starts_at,ends_at,status,source_payment_request_id");
  const firstReferrals = await rpcListMust("list_my_partner_referrals", teacherToken);
  let earnings = await rpcListMust("list_my_commission_history", teacherToken);
  const firstSummary = await rpcMust("get_my_partner_summary", teacherToken);
  const firstAccess = await rpcMust("get_my_partner_access", teacherToken);
  assert.equal(firstPayment[0].status, "approved");
  assert.equal(firstSubscription.length, 1);
  assert.equal(firstReferrals.length, 1);
  assert.equal(earnings.length, 1);
  assert.equal(Number(firstSummary.earned_access_days), 30);
  assert.equal(firstAccess.has_full_access, true);
  assert.equal(Number(earnings[0].commission_amount), Number((Number(first.payable_amount) * 0.10).toFixed(2)));
  logStep("ilk ödeme, abonelik, referral, 30 gün kredi ve ilk komisyon doğrulandı");

  const firstEnd = new Date(firstSubscription[0].ends_at);
  const second = await makePayment(null);
  await rpcMust("approve_payment", adminToken, { p_payment_request_id: second.id, p_admin_note: marker });
  const renewalPayment = await actorSelect("payment_requests", parentToken, { id: `eq.${second.id}` }, "id,status");
  const renewalSubscription = await actorSelect("subscriptions", parentToken, { source_payment_request_id: `eq.${second.id}` }, "id,ends_at,status");
  const renewalReferrals = await rpcListMust("list_my_partner_referrals", teacherToken);
  earnings = await rpcListMust("list_my_commission_history", teacherToken);
  const renewalSummary = await rpcMust("get_my_partner_summary", teacherToken);
  assert.equal(renewalPayment[0].status, "approved");
  assert.equal(renewalSubscription.length, 1);
  assert.ok(Math.abs(new Date(renewalSubscription[0].ends_at) - firstEnd - 30 * DAY) < 5000);
  assert.equal(renewalReferrals.length, 1);
  assert.equal(Number(renewalSummary.earned_access_days), 30);
  assert.equal(earnings.length, 2);
  await expectRpcFailure("approve_payment", adminToken, { p_payment_request_id: second.id, p_admin_note: marker });
  assert.equal((await rpcListMust("list_my_commission_history", teacherToken)).length, 2);
  logStep("yenileme ikinci kredi oluşturmadan ikinci komisyonu ve süre uzatımını oluşturdu");

  const dates = earnings.map(row => row.earned_at.slice(0, 10)).sort();
  const payout1 = await rpcMust("admin_create_commission_payout", adminToken, {
    p_teacher_id: teacher.id, p_period_start: dates[0], p_period_end: dates.at(-1), p_admin_note: marker
  });
  assert.equal((await rpcListMust("list_admin_commission_payouts", adminToken, { p_status: "pending" })).filter(row => row.id === payout1.id).length, 1);
  await expectRpcFailure("admin_create_commission_payout", adminToken, { p_teacher_id: teacher.id, p_period_start: dates[0], p_period_end: dates.at(-1), p_admin_note: marker });
  await rpcMust("admin_cancel_commission_payout", adminToken, { p_payout_id: payout1.id, p_admin_note: marker });
  assert.equal((await rpcListMust("list_admin_commission_payouts", adminToken, { p_status: "cancelled" })).filter(row => row.id === payout1.id).length, 1);
  const payout2 = await rpcMust("admin_create_commission_payout", adminToken, {
    p_teacher_id: teacher.id, p_period_start: dates[0], p_period_end: dates.at(-1), p_admin_note: marker
  });
  await rpcMust("admin_mark_commission_payout_paid", adminToken, { p_payout_id: payout2.id, p_admin_note: marker });
  const paidPayouts = await rpcListMust("list_admin_commission_payouts", adminToken, { p_status: "paid" });
  assert.equal(paidPayouts.filter(row => row.id === payout2.id && Number(row.earning_count) === 2).length, 1);
  await expectRpcFailure("admin_mark_commission_payout_paid", adminToken, { p_payout_id: payout2.id, p_admin_note: marker });
  logStep("payout create, çift payout reddi, cancel, tekrar create ve paid doğrulandı");

  const auditRows = await rpcListMust("list_admin_audit_log", adminToken, { p_action: null, p_entity_type: null, p_limit: 100 });
  const auditCount = (action, entityId) => auditRows.filter(row => row.action === action && row.entity_id === entityId).length;
  assert.equal(auditCount("teacher_approval_changed", teacher.id), 1);
  assert.equal(auditCount("teacher_partner_upserted", teacher.id), 1);
  assert.equal(auditCount("payment_approved", first.id), 1);
  assert.equal(auditCount("payment_approved", second.id), 1);
  assert.equal(auditCount("commission_payout_created", payout1.id), 1);
  assert.equal(auditCount("commission_payout_cancelled", payout1.id), 1);
  assert.equal(auditCount("commission_payout_created", payout2.id), 1);
  assert.equal(auditCount("commission_payout_paid", payout2.id), 1);
  assert.equal(auditRows.filter(row => [teacher.id, first.id, second.id, payout1.id, payout2.id].includes(row.entity_id)).length, 8);
  logStep("ortak admin audit kayıtları ve yinelenmeyen kritik aksiyonlar doğrulandı");

  await rpcMust("admin_upsert_teacher_partner", adminToken, {
    p_teacher_id: teacher.id, p_partner_code: partnerCode, p_status: "active", p_commission_rate: 0.10,
    p_access_ends_at: new Date(Date.now() - DAY).toISOString(), p_admin_note: marker
  });
  assert.equal((await rpcListMust("list_admin_audit_log", adminToken, { p_action: "teacher_partner_upserted", p_entity_type: "teacher_partner_profile", p_limit: 100 })).filter(row => row.entity_id === teacher.id).length, 2);
  const deniedClass = await actor(`/rest/v1/classes`, teacherToken, {
    method: "POST", body: { teacher_id: teacher.id, name: `Expired ${runId.slice(-8)}` }, headers: { Prefer: "return=representation" }
  });
  assert.equal(deniedClass.ok, false);
  assert.equal((await actorSelect("classes", teacherToken, { teacher_id: `eq.${teacher.id}` }, "id")).length, 0);
  assert.equal((await rpcMust("get_my_partner_access", teacherToken)).has_full_access, false);
  assert.equal((await rpcListMust("list_my_commission_history", teacherToken)).length, 2);
  assert.ok(await rpcMust("get_my_partner_summary", teacherToken));
  logStep("süresi biten öğretmenin sınıf RLS reddi ve finans okuma devamlılığı doğrulandı");
} catch (error) {
  flowError = error;
  console.log(`[KALDI] E2E akışı: ${redactedError(error)}`);
} finally {
  try { await cleanup(); } catch (error) { flowError ||= error; console.log(`[KALDI] ${redactedError(error)}`); }
}
if (flowError) throw flowError;
logStep("canlı partner–ödeme–komisyon–payout E2E tamamlandı");
