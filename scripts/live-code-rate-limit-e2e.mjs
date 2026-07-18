import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";

const EXPECTED_REF = "gzsrcjovhhlfpvvpucri";
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
const email = `e2e-parent+${runId}@e2e.invalid`;
const password = crypto.randomBytes(32).toString("base64url") + "aA1!";
const invalidStudentCode = `BAD${crypto.randomBytes(6).toString("hex").toUpperCase()}`;
const invalidClassCode = `NO${crypto.randomBytes(6).toString("hex").toUpperCase()}`;
let userId = null;

function logStep(message, status = "GEÇTİ") { console.log(`[${status}] ${message}`); }
function redactedError(error) {
  let message = String(error?.message || error).replace(/Bearer\s+\S+/gi, "Bearer [TOKEN]");
  for (const secret of [env.SUPABASE_SERVICE_ROLE_KEY, env.SUPABASE_ANON_KEY, password, email, invalidStudentCode, invalidClassCode])
    if (secret) message = message.replaceAll(secret, "[REDACTED]");
  return message;
}

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
  return result.data;
}
const service = (path, options = {}) => request(path, { ...options, key: env.SUPABASE_SERVICE_ROLE_KEY, token: env.SUPABASE_SERVICE_ROLE_KEY });
const actor = (path, token, options = {}) => request(path, { ...options, token });
const rpc = (name, token, body = {}) => actor(`/rest/v1/rpc/${name}`, token, { method: "POST", body });

async function cleanup() {
  const result = await must(rpc("service_cleanup_partner_e2e_run", env.SUPABASE_SERVICE_ROLE_KEY, { p_run_id: runId }), "cleanup RPC");
  assert.equal(result.matched_auth_users, userId ? 1 : 0);
  assert.equal(result.rate_limit_remaining, 0);
  assert.equal(result.remaining_total, 0);
  if (userId) {
    const deletion = await service(`/auth/v1/admin/users/${userId}`, { method: "DELETE" });
    if (!deletion.ok && deletion.status !== 404) throw new Error(`auth cleanup başarısız (HTTP ${deletion.status})`);
    const verification = await service(`/auth/v1/admin/users/${userId}`);
    assert.equal(verification.status, 404);
  }
  logStep("cleanup doğrulandı; public kalan=0, rate-limit kalan=0, auth kalan=0");
}

console.log(`Poma code rate-limit E2E run: ${runId}`);
let flowError;
try {
  const created = await must(service("/auth/v1/admin/users", {
    method: "POST",
    body: {
      email, password, email_confirm: true,
      user_metadata: { display_name: `POMA E2E ${runId}`, account_type: "parent", e2e_run_id: runId }
    }
  }), "create parent");
  userId = created.id;
  const session = await must(request("/auth/v1/token?grant_type=password", { method: "POST", body: { email, password } }), "login parent");
  const parentToken = session.access_token;
  assert.ok(parentToken);
  logStep("geçici veli oluşturuldu");

  const childId = await must(rpc("create_family_child", parentToken, { p_name: "POMA E2E", p_avatar_key: "sporty-poma", p_birth_year: 2015 }), "create child");
  assert.match(childId, /^[0-9a-f-]{36}$/i);
  const childRows = await must(actor(`/rest/v1/children?select=id,student_code&id=eq.${encodeURIComponent(childId)}`, parentToken), "read child code");
  assert.equal(childRows.length, 1);
  const realStudentCode = childRows[0].student_code;
  assert.ok(realStudentCode);

  for (let attempt = 1; attempt <= 4; attempt += 1)
    assert.equal(await must(rpc("link_guardian_by_student_code", parentToken, { p_student_code: invalidStudentCode, p_relationship: "parent" }), `student invalid ${attempt}`), null);
  assert.equal(await must(rpc("link_guardian_by_student_code", parentToken, { p_student_code: realStudentCode, p_relationship: "parent" }), "student valid"), childId);
  logStep("öğrenci kodunda dört hata sonrası başarı ve sayaç sıfırlama doğrulandı");

  for (let attempt = 1; attempt <= 5; attempt += 1)
    assert.equal(await must(rpc("link_guardian_by_student_code", parentToken, { p_student_code: invalidStudentCode, p_relationship: "parent" }), `student reset invalid ${attempt}`), null);
  const studentBlocked = await rpc("link_guardian_by_student_code", parentToken, { p_student_code: invalidStudentCode, p_relationship: "parent" });
  assert.equal(studentBlocked.ok, false);
  assert.equal(studentBlocked.data?.message, "Çok fazla hatalı kod denemesi yaptınız. 15 dakika sonra tekrar deneyin.");
  logStep("öğrenci kodu beş hata sonrası bloklandı");

  assert.equal(await must(rpc("join_class_by_code", parentToken, { p_child_id: childId, p_join_code: invalidClassCode }), "independent class invalid"), null);
  for (let attempt = 2; attempt <= 5; attempt += 1)
    assert.equal(await must(rpc("join_class_by_code", parentToken, { p_child_id: childId, p_join_code: invalidClassCode }), `class invalid ${attempt}`), null);
  const classBlocked = await rpc("join_class_by_code", parentToken, { p_child_id: childId, p_join_code: invalidClassCode });
  assert.equal(classBlocked.ok, false);
  assert.equal(classBlocked.data?.message, "Çok fazla hatalı kod denemesi yaptınız. 15 dakika sonra tekrar deneyin.");
  logStep("öğrenci ve sınıf sayaçlarının bağımsızlığı ile sınıf bloklaması doğrulandı");
} catch (error) {
  flowError = error;
  console.log(`[KALDI] rate-limit E2E: ${redactedError(error)}`);
} finally {
  try { await cleanup(); } catch (error) { flowError ||= error; console.log(`[KALDI] ${redactedError(error)}`); }
}
if (flowError) throw flowError;
logStep("canlı öğrenci ve sınıf kodu rate-limit E2E tamamlandı");
