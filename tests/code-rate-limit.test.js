import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = path => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const migration = read("supabase/migrations/20260718170535_code_attempt_rate_limits.sql");
const repository = read("js/student-repository.js");
const matrix = read("docs/security/SECURITY_DEFINER_MATRIX_2026-07-18.md");
const e2e = read("scripts/live-code-rate-limit-e2e.mjs");
const pkg = JSON.parse(read("package.json"));

test("rate-limit table is actor/action scoped, RLS closed and stores no code material", () => {
  assert.match(migration, /create table public\.code_attempt_limits/);
  assert.match(migration, /primary key \(actor_id, action\)/);
  assert.match(migration, /references auth\.users\(id\) on delete cascade/);
  assert.match(migration, /action in \('student_link', 'class_join'\)/);
  assert.match(migration, /alter table public\.code_attempt_limits enable row level security/);
  assert.match(migration, /revoke all on table public\.code_attempt_limits from public, anon, authenticated, service_role/);
  const tableBlock = migration.match(/create table public\.code_attempt_limits[\s\S]*?\);/)?.[0] || "";
  assert.doesNotMatch(tableBlock, /\b(?:raw_code|student_code|join_code|code_hash|ip_address|user_agent)\b/i);
  assert.doesNotMatch(migration, /create policy[\s\S]*code_attempt_limits/i);
});

test("five failures block for fifteen minutes and expired windows reset", () => {
  assert.match(migration, /interval '15 minutes'/);
  assert.match(migration, /failed_count \+ 1 >= 5/);
  assert.match(migration, /now\(\) \+ interval '15 minutes'/);
  assert.match(migration, /window_started_at <= now\(\) - interval '15 minutes'[\s\S]*then 1/);
  assert.match(migration, /U&'\\00C7ok fazla hatal\\0131 kod denemesi yapt\\0131n\\0131z\. 15 dakika sonra tekrar deneyin\.'/);
});

test("invalid codes commit null while successful actions clear their own counter", () => {
  const student = migration.match(/function public\.link_guardian_by_student_code[\s\S]*?\nend\n\$\$;/)?.[0] || "";
  const classJoin = migration.match(/function public\.join_class_by_code[\s\S]*?\nend\n\$\$;/)?.[0] || "";
  for (const body of [student, classJoin]) {
    assert.match(body, /code_attempt_assert_not_blocked/);
    assert.match(body, /code_attempt_record_failure/);
    assert.match(body, /return null/);
    assert.match(body, /code_attempt_clear/);
    assert.match(body, /security definer[\s\S]*set search_path = ''/);
  }
  assert.match(student, /'student_link'/);
  assert.match(classJoin, /'class_join'/);
  assert.match(classJoin, /can_manage_child\(p_child_id\)[\s\S]*code_attempt_assert_not_blocked/);
});

test("internal helpers stay SECURITY INVOKER and inaccessible to API roles", () => {
  for (const name of ["code_attempt_assert_not_blocked", "code_attempt_record_failure", "code_attempt_clear"]) {
    const body = migration.match(new RegExp(`function public\\.${name}[\\s\\S]*?\\$\\$;`))?.[0] || "";
    assert.match(body, /security invoker/);
    assert.doesNotMatch(body, /security definer/);
    assert.match(body, /set search_path = ''/);
    assert.match(migration, new RegExp(`alter function public\\.${name}[^;]+ owner to postgres`));
  }
  assert.match(migration, /revoke all on function public\.code_attempt_assert_not_blocked[\s\S]*from public, anon, authenticated, service_role/);
});

test("cleanup removes and reports rate-limit remnants", () => {
  assert.match(migration, /delete from public\.code_attempt_limits[\s\S]*actor_id = any\(v_user_ids\)/);
  assert.match(migration, /jsonb_build_object\('code_attempt_limits', v_count\)/);
  assert.match(migration, /'rate_limit_remaining', v_rate_limit_remaining/);
});

test("frontend maps null to generic messages and prevents repeated code submissions", () => {
  assert.match(repository, /data == null[^\n]+Öğrenci bağlantı kodu geçersiz\./);
  assert.match(repository, /data == null[^\n]+Sınıf kodu geçersiz veya kullanılamıyor\./);
  assert.match(repository, /pendingCodeActions\.has\("student_link"\)/);
  assert.match(repository, /pendingCodeActions\.has\("class_join"\)/);
  assert.match(repository, /finally[\s\S]*pendingCodeActions\.delete\("student_link"\)/);
  assert.match(repository, /finally[\s\S]*pendingCodeActions\.delete\("class_join"\)/);
});

test("live harness is explicit, guarded, narrow and cleanup verified", () => {
  assert.equal(pkg.scripts["test:e2e:code-rate-limit"], "node scripts/live-code-rate-limit-e2e.mjs");
  assert.doesNotMatch(pkg.scripts.test, /code-rate-limit-e2e/);
  assert.match(e2e, /POMA_E2E_ALLOW_PRODUCTION !== "true"/);
  assert.match(e2e, /service_cleanup_partner_e2e_run/);
  assert.match(e2e, /rate_limit_remaining, 0/);
  assert.doesNotMatch(e2e, /console\.log\([^\n]*(?:studentCode|joinCode|realStudentCode|invalidStudentCode|invalidClassCode)/);
});

test("security matrix documents both rate-limited RPCs without changing the 51-function baseline", () => {
  assert.match(matrix, /`join_class_by_code`[^\n]+rate limit/);
  assert.match(matrix, /`link_guardian_by_student_code`[^\n]+rate limit/);
  assert.match(matrix, /SECURITY DEFINER toplamı \| 51/);
});
