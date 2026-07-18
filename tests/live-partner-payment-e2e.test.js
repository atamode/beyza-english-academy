import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = path => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const script = read("scripts/live-partner-payment-e2e.mjs");
const pkg = JSON.parse(read("package.json"));

test("live partner E2E is explicitly invoked and production guarded", () => {
  assert.equal(pkg.scripts["test:e2e:partner-live"], "node scripts/live-partner-payment-e2e.mjs");
  assert.doesNotMatch(pkg.scripts.test, /live-partner-payment-e2e|test:e2e:partner-live/);
  assert.match(script, /POMA_E2E_EXPECTED_PROJECT_REF/);
  assert.match(script, /POMA_E2E_ALLOW_PRODUCTION !== "true"/);
  assert.match(script, /projectRef !== EXPECTED_REF/);
});

test("service role stays in the Node-only harness and secrets are redacted", () => {
  assert.match(script, /SUPABASE_SERVICE_ROLE_KEY/);
  assert.match(script, /env\.SUPABASE_SERVICE_ROLE_KEY, env\.SUPABASE_ANON_KEY, password/);
  assert.match(script, /message\.replaceAll\(secret, "\[REDACTED\]"\)/);
  assert.doesNotMatch(read("scripts/build.js"), /live-partner-payment-e2e/);
  for (const file of ["js/account-config.js", "js/supabase-client.js", "index.html"]) assert.doesNotMatch(read(file), /SUPABASE_SERVICE_ROLE_KEY/);
});

test("actors use unique IDs, real JWT sessions and role RPCs", () => {
  assert.match(script, /poma-e2e-/);
  assert.match(script, /crypto\.randomBytes/);
  assert.match(script, /\/auth\/v1\/admin\/users/);
  assert.match(script, /\/auth\/v1\/token\?grant_type=password/);
  for (const rpc of ["create_payment_request", "approve_payment", "admin_create_commission_payout", "admin_cancel_commission_payout", "admin_mark_commission_payout_paid", "get_my_partner_summary"]) assert.match(script, new RegExp(`rpc(?:Must|Failure)\\(\\"${rpc}`));
});

test("cleanup is mandatory, run-scoped and verifies public plus auth remnants", () => {
  assert.match(script, /finally\s*\{[\s\S]*await cleanup\(\)/);
  assert.match(script, /rpcMust\("service_cleanup_partner_e2e_run"/);
  assert.match(script, /remaining_total, 0/);
  assert.match(script, /authRemaining, 0/);
  assert.doesNotMatch(script, /created_at=(?:lt|lte)|email=(?:like|ilike)|\/auth\/v1\/admin\/users\?page/);
  assert.doesNotMatch(script, /function (?:select|insert|patch)\(/);
  assert.doesNotMatch(script, /service\(`?\/rest\/v1\//);
});

test("teacher onboarding and business assertions use actor JWTs and RPCs",()=>{
  assert.match(script,/account_type: accountType/);
  assert.match(script,/actorSelect\("teacher_profiles", teacherToken/);
  assert.match(script,/rpcMust\("admin_set_teacher_approval", adminToken/);
  assert.match(script,/rpcMust\("admin_upsert_teacher_partner", adminToken/);
  assert.match(script,/actorSelect\("payment_requests", parentToken/);
  assert.match(script,/actorSelect\("subscriptions", parentToken/);
  assert.match(script,/rpcListMust\("list_admin_commission_payouts", adminToken/);
});

test("local E2E secret file is ignored and example is non-permissive", () => {
  assert.match(read(".gitignore"), /^\.env\.e2e\.local$/m);
  const example = read(".env.e2e.example");
  assert.match(example, /POMA_E2E_EXPECTED_PROJECT_REF=gzsrcjovhhlfpvvpucri/);
  assert.match(example, /POMA_E2E_ALLOW_PRODUCTION=false/);
  assert.match(example, /SUPABASE_SERVICE_ROLE_KEY=\s*$/m);
});
