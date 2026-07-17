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
  assert.match(script, /replaceAll\(env\.SUPABASE_SERVICE_ROLE_KEY, "\[SECRET\]"\)/);
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

test("cleanup is mandatory, ID-scoped and verifies no remnants", () => {
  assert.match(script, /finally\s*\{[\s\S]*await cleanup\(\)/);
  assert.match(script, /in\.\(\$\{values\.join\(\",\"\)\}\)/);
  assert.doesNotMatch(script, /created_at=(?:lt|lte)|email=(?:like|ilike)|\/auth\/v1\/admin\/users\?page/);
  for (const table of ["payment_requests", "subscriptions", "teacher_referrals", "teacher_access_credits", "teacher_commission_earnings", "teacher_commission_payouts", "classes", "children"]) assert.match(script, new RegExp(`\\[\\"${table}\\", \\"id\\"`));
});

test("local E2E secret file is ignored and example is non-permissive", () => {
  assert.match(read(".gitignore"), /^\.env\.e2e\.local$/m);
  const example = read(".env.e2e.example");
  assert.match(example, /POMA_E2E_EXPECTED_PROJECT_REF=gzsrcjovhhlfpvvpucri/);
  assert.match(example, /POMA_E2E_ALLOW_PRODUCTION=false/);
  assert.match(example, /SUPABASE_SERVICE_ROLE_KEY=\s*$/m);
});
