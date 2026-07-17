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

const runId = `poma-e2e-${new Date().toISOString().replace(/[-:]/g, "").slice(0, 8)}-${new Date().toISOString().replace(/[-:]/g, "").slice(9, 15)}-${crypto.randomBytes(4).toString("hex")}`;
const marker = `POMA E2E ${runId}`;
const domain = "e2e.invalid";
const password = crypto.randomBytes(32).toString("base64url") + "aA1!";
const emails = {
  admin: `e2e-admin+${runId}@${domain}`,
  teacher: `e2e-teacher+${runId}@${domain}`,
  parent: `e2e-parent+${runId}@${domain}`
};
const ids = Object.fromEntries(["users", "classes", "payments", "subscriptions", "referrals", "credits", "commissions", "payouts", "audits", "children"].map(k => [k, []]));
const counts = {};

function logStep(name, result = "GEÇTİ") { console.log(`[${result}] ${name}`); }
function redactedError(error) { return String(error?.message || error).replaceAll(env.SUPABASE_SERVICE_ROLE_KEY, "[SECRET]").replaceAll(env.SUPABASE_ANON_KEY, "[KEY]").replace(/Bearer\s+\S+/gi, "Bearer [TOKEN]"); }
function query(filters = {}) { return Object.entries(filters).map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join("&"); }

async function request(path, { key = env.SUPABASE_ANON_KEY, token = key, method = "GET", body, headers = {} } = {}) {
  const response = await fetch(`${base.origin}${path}`, {
    method,
    headers: { apikey: key, Authorization: `Bearer ${token}`, ...(body === undefined ? {} : { "Content-Type": "application/json" }), ...headers },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const text = await response.text();
  let data = null;
  if (text) { try { data = JSON.parse(text); } catch { data = text; } }
  return { ok: response.ok, status: response.status, data };
}

async function must(result, label) {
  if (!result.ok) throw new Error(`${label} başarısız (HTTP ${result.status}, kod ${result.data?.code || "yok"})`);
  return Array.isArray(result.data) && result.data.length === 1 ? result.data[0] : result.data;
}
const service = (path, options = {}) => request(path, { ...options, key: env.SUPABASE_SERVICE_ROLE_KEY, token: env.SUPABASE_SERVICE_ROLE_KEY });
const actor = (path, token, options = {}) => request(path, { ...options, token });
const rpc = (name, token, body = {}) => actor(`/rest/v1/rpc/${name}`, token, { method: "POST", body });
const rpcMust = (name, token, body = {}) => must(rpc(name, token, body), name);

async function createUser(kind, appMetadata = {}) {
  const user = await must(service("/auth/v1/admin/users", { method: "POST", body: { email: emails[kind], password, email_confirm: true, app_metadata: appMetadata, user_metadata: { e2e_run_id: runId } } }), `create ${kind}`);
  ids.users.push(user.id);
  return user;
}
async function login(kind) {
  const session = await must(request("/auth/v1/token?grant_type=password", { method: "POST", body: { email: emails[kind], password } }), `login ${kind}`);
  assert.ok(session.access_token);
  return session.access_token;
}
async function select(table, filters, columns = "*") {
  return must(service(`/rest/v1/${table}?select=${encodeURIComponent(columns)}&${query(filters)}`), `select ${table}`);
}
async function insert(table, body) {
  return must(service(`/rest/v1/${table}`, { method: "POST", body, headers: { Prefer: "return=representation" } }), `insert ${table}`);
}
async function patch(table, filters, body) {
  return must(service(`/rest/v1/${table}?${query(filters)}`, { method: "PATCH", body, headers: { Prefer: "return=representation" } }), `patch ${table}`);
}
async function actorInsert(table, token, body) {
  return must(actor(`/rest/v1/${table}`, token, { method: "POST", body, headers: { Prefer: "return=representation" } }), `actor insert ${table}`);
}
async function expectRpcFailure(name, token, body) {
  const result = await rpc(name, token, body);
  assert.equal(result.ok, false, `${name} kontrollü biçimde reddedilmeliydi`);
}
async function captureIds() {
  const mappings = [
    ["subscriptions", "subscriptions", { source_payment_request_id: `in.(${ids.payments.join(",")})` }],
    ["referrals", "teacher_referrals", { teacher_id: `eq.${ids.users[1]}` }],
    ["credits", "teacher_access_credits", { teacher_id: `eq.${ids.users[1]}` }],
    ["commissions", "teacher_commission_earnings", { teacher_id: `eq.${ids.users[1]}` }],
    ["audits", "teacher_partner_audit", { teacher_id: `eq.${ids.users[1]}` }]
  ];
  for (const [bucket, table, filters] of mappings) ids[bucket] = (await select(table, filters, "id")).map(row => row.id);
}

async function cleanup() {
  const errors = [];
  const del = async (table, column, values) => {
    if (!values.length) return;
    const result = await service(`/rest/v1/${table}?${query({ [column]: `in.(${values.join(",")})` })}`, { method: "DELETE", headers: { Prefer: "return=minimal" } });
    if (!result.ok) errors.push(`${table}: HTTP ${result.status}`);
  };
  await captureIds().catch(error => errors.push(`ID capture: ${redactedError(error)}`));
  for (const [table, column, values] of [
    ["teacher_partner_audit", "id", ids.audits], ["teacher_commission_earnings", "id", ids.commissions],
    ["teacher_commission_payouts", "id", ids.payouts], ["teacher_access_credits", "id", ids.credits],
    ["teacher_referrals", "id", ids.referrals], ["subscriptions", "id", ids.subscriptions],
    ["payment_requests", "id", ids.payments], ["classes", "id", ids.classes],
    ["guardian_students", "child_id", ids.children], ["children", "id", ids.children],
    ["teacher_partner_profiles", "teacher_id", ids.users.slice(1, 2)], ["teacher_profiles", "id", ids.users.slice(1, 2)]
  ]) await del(table, column, values);
  for (const userId of [...ids.users].reverse()) {
    const result = await service(`/auth/v1/admin/users/${userId}`, { method: "DELETE" });
    if (!result.ok && result.status !== 404) errors.push(`auth user: HTTP ${result.status}`);
  }
  const remains = [];
  for (const [table, column, values] of [
    ["payment_requests", "id", ids.payments], ["subscriptions", "id", ids.subscriptions],
    ["teacher_referrals", "id", ids.referrals], ["teacher_access_credits", "id", ids.credits],
    ["teacher_commission_earnings", "id", ids.commissions], ["teacher_commission_payouts", "id", ids.payouts],
    ["classes", "id", ids.classes], ["children", "id", ids.children]
  ]) if (values.length) {
    const rows = await select(table, { [column]: `in.(${values.join(",")})` }, column).catch(error => (errors.push(`verify ${table}: ${redactedError(error)}`), []));
    if (rows.length) remains.push(`${table}:${rows.length}`);
  }
  for (const userId of ids.users) {
    const result = await service(`/auth/v1/admin/users/${userId}`);
    if (result.ok) remains.push("auth_users:1");
  }
  console.log(`[${errors.length || remains.length ? "KALDI" : "GEÇTİ"}] cleanup; kalan=${remains.length}`);
  if (errors.length || remains.length) throw new Error(`Cleanup tamamlanamadı: ${[...errors, ...remains].join("; ")}`);
}

console.log(`Poma partner E2E run: ${runId}`);
let flowError;
try {
  const admin = await createUser("admin", { role: "admin", is_admin: true });
  const teacher = await createUser("teacher");
  const parent = await createUser("parent");
  assert.equal(ids.users.length, 3);
  logStep("geçici test aktörleri oluşturuldu");

  await insert("teacher_profiles", { id: teacher.id, display_name: marker, school_name: marker, approval_status: "approved", approved_at: new Date().toISOString(), approved_by: admin.id });
  const adminToken = await login("admin"), teacherToken = await login("teacher"), parentToken = await login("parent");
  const registered = await rpcMust("register_my_teacher_partner", teacherToken);
  const partnerCode = `E2E${crypto.randomBytes(7).toString("hex").toUpperCase()}`;
  const partner = await rpcMust("admin_upsert_teacher_partner", adminToken, { p_teacher_id: teacher.id, p_partner_code: partnerCode, p_status: "active", p_commission_rate: 0.10, p_access_ends_at: null, p_admin_note: marker });
  assert.equal(partner.status, "active"); assert.notEqual(registered.partner_code, partnerCode);
  logStep("öğretmen onaylandı ve partner profili aktif edildi");

  const makePayment = code => rpcMust("create_payment_request", parentToken, { p_plan_code: "FAMILY_MONTHLY", p_payment_method: "bank_transfer", p_coupon_code: null, p_instagram_username: null, p_sender_name: marker, p_transfer_date: new Date().toISOString().slice(0, 10), p_partner_code: code });
  const first = await makePayment(partnerCode); ids.payments.push(first.id);
  await rpcMust("approve_payment", adminToken, { p_payment_request_id: first.id, p_admin_note: marker });
  await captureIds();
  const firstPayment = (await select("payment_requests", { id: `eq.${first.id}` }))[0];
  const firstSubs = await select("subscriptions", { source_payment_request_id: `eq.${first.id}` });
  const referrals = await select("teacher_referrals", { teacher_id: `eq.${teacher.id}` });
  const credits = await select("teacher_access_credits", { teacher_id: `eq.${teacher.id}` });
  let earnings = await select("teacher_commission_earnings", { teacher_id: `eq.${teacher.id}` });
  assert.equal(firstPayment.status, "approved"); assert.equal(firstSubs.length, 1); assert.equal(referrals.length, 1); assert.equal(credits.length, 1); assert.equal(credits[0].days, 30);
  assert.equal(credits[0].referred_user_id, parent.id); assert.equal(credits[0].source_payment_request_id, first.id); assert.equal(earnings.length, 1);
  assert.equal(Number(earnings[0].commission_rate), Number(partner.commission_rate)); assert.equal(Number(earnings[0].commission_amount), Number((Number(first.payable_amount) * Number(partner.commission_rate)).toFixed(2)));
  const access = await rpcMust("get_my_partner_access", teacherToken); assert.equal(access.has_full_access, true);
  assert.equal((await rpcMust("list_my_partner_referrals", teacherToken)).length, 1); assert.equal((await rpcMust("list_my_commission_history", teacherToken)).length, 1);
  const parentForeign = await actor(`/rest/v1/teacher_commission_earnings?select=id&id=eq.${earnings[0].id}`, parentToken); assert.deepEqual(parentForeign.data, []);
  const teacherForeign = await actor(`/rest/v1/payment_requests?select=id&id=eq.${first.id}`, teacherToken); assert.deepEqual(teacherForeign.data, []);
  logStep("ilk ödeme, abonelik, referral, 30 gün kredi ve komisyon doğrulandı");

  const activeClass = await actorInsert("classes", teacherToken, { teacher_id: teacher.id, name: `E2E ${runId.slice(-8)}`, grade_level: "E2E" }); ids.classes.push(activeClass[0]?.id || activeClass.id);
  await patch("teacher_partner_profiles", { teacher_id: `eq.${teacher.id}` }, { access_ends_at: new Date(Date.now() - DAY).toISOString() });
  const deniedClass = await actor(`/rest/v1/classes`, teacherToken, { method: "POST", body: { teacher_id: teacher.id, name: `Expired ${runId.slice(-8)}` }, headers: { Prefer: "return=representation" } });
  assert.equal(deniedClass.ok, false);
  assert.equal((await select("classes", { teacher_id: `eq.${teacher.id}` })).length, 1);
  assert.ok(await rpcMust("get_my_partner_summary", teacherToken)); assert.equal((await rpcMust("list_my_commission_history", teacherToken)).length, 1);
  const payoutHistory = await actor(`/rest/v1/teacher_commission_payouts?select=id&teacher_id=eq.${teacher.id}`, teacherToken); assert.equal(payoutHistory.ok, true);
  logStep("öğretmen erişim kapısı reddi ve finans okuma devamlılığı doğrulandı");

  const firstEnd = new Date(firstSubs[0].ends_at);
  const second = await makePayment(null); ids.payments.push(second.id);
  await rpcMust("approve_payment", adminToken, { p_payment_request_id: second.id, p_admin_note: marker });
  const beforeRepeat = { referrals: (await select("teacher_referrals", { teacher_id: `eq.${teacher.id}` })).length, credits: (await select("teacher_access_credits", { teacher_id: `eq.${teacher.id}` })).length, earnings: (await select("teacher_commission_earnings", { teacher_id: `eq.${teacher.id}` })).length, subs: (await select("subscriptions", { user_id: `eq.${parent.id}` })).length };
  await expectRpcFailure("approve_payment", adminToken, { p_payment_request_id: second.id, p_admin_note: marker });
  const afterRepeat = { referrals: (await select("teacher_referrals", { teacher_id: `eq.${teacher.id}` })).length, credits: (await select("teacher_access_credits", { teacher_id: `eq.${teacher.id}` })).length, earnings: (await select("teacher_commission_earnings", { teacher_id: `eq.${teacher.id}` })).length, subs: (await select("subscriptions", { user_id: `eq.${parent.id}` })).length };
  assert.deepEqual(afterRepeat, beforeRepeat); assert.deepEqual(afterRepeat, { referrals: 1, credits: 1, earnings: 2, subs: 2 });
  const secondSub = (await select("subscriptions", { source_payment_request_id: `eq.${second.id}` }))[0]; assert.ok(Math.abs(new Date(secondSub.ends_at) - firstEnd - 30 * DAY) < 5000);
  earnings = await select("teacher_commission_earnings", { teacher_id: `eq.${teacher.id}` }); ids.commissions = earnings.map(x => x.id); ids.subscriptions = (await select("subscriptions", { user_id: `eq.${parent.id}` }, "id")).map(x => x.id);
  logStep("yenileme kalıcı referral ile ikinci komisyonu ve süre uzatımını oluşturdu");

  const dates = earnings.map(x => x.earned_at.slice(0, 10)).sort();
  const payout1 = await rpcMust("admin_create_commission_payout", adminToken, { p_teacher_id: teacher.id, p_period_start: dates[0], p_period_end: dates.at(-1), p_admin_note: marker }); ids.payouts.push(payout1.id);
  let reserved = await select("teacher_commission_earnings", { payout_id: `eq.${payout1.id}` }); assert.equal(reserved.length, 2); assert.ok(reserved.every(x => x.status === "pending_payout")); assert.equal(Number(payout1.amount), reserved.reduce((sum, x) => sum + Number(x.commission_amount), 0));
  await expectRpcFailure("admin_create_commission_payout", adminToken, { p_teacher_id: teacher.id, p_period_start: dates[0], p_period_end: dates.at(-1), p_admin_note: marker });
  await rpcMust("admin_cancel_commission_payout", adminToken, { p_payout_id: payout1.id, p_admin_note: marker });
  reserved = await select("teacher_commission_earnings", { teacher_id: `eq.${teacher.id}` }); assert.ok(reserved.every(x => x.status === "payable" && x.payout_id === null));
  await expectRpcFailure("admin_cancel_commission_payout", adminToken, { p_payout_id: payout1.id, p_admin_note: marker }); await expectRpcFailure("admin_mark_commission_payout_paid", adminToken, { p_payout_id: payout1.id, p_admin_note: marker });
  const payout2 = await rpcMust("admin_create_commission_payout", adminToken, { p_teacher_id: teacher.id, p_period_start: dates[0], p_period_end: dates.at(-1), p_admin_note: marker }); ids.payouts.push(payout2.id);
  await rpcMust("admin_mark_commission_payout_paid", adminToken, { p_payout_id: payout2.id, p_admin_note: marker });
  const paid = await select("teacher_commission_earnings", { payout_id: `eq.${payout2.id}` }); assert.equal(paid.length, 2); assert.ok(paid.every(x => x.status === "paid"));
  await expectRpcFailure("admin_mark_commission_payout_paid", adminToken, { p_payout_id: payout2.id, p_admin_note: marker }); await expectRpcFailure("admin_cancel_commission_payout", adminToken, { p_payout_id: payout2.id, p_admin_note: marker });
  logStep("payout create, çift rezervasyon reddi, cancel, yeniden create ve paid doğrulandı");
  await captureIds();
  Object.assign(counts, Object.fromEntries(Object.entries(ids).map(([k, v]) => [k, v.length])));
  console.log(`Oluşturulan test kayıt sayıları: ${Object.entries(counts).map(([k, v]) => `${k}=${v}`).join(", ")}`);
} catch (error) {
  flowError = error;
  console.log(`[KALDI] E2E akışı: ${redactedError(error)}`);
} finally {
  try { await cleanup(); } catch (error) { flowError ||= error; console.log(`[KALDI] ${redactedError(error)}`); }
}
if (flowError) throw flowError;
logStep("canlı partner–ödeme–komisyon–payout E2E tamamlandı");
