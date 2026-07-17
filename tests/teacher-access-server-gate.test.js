import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = path => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const sql = read("supabase/migrations/20260717081217_teacher_access_server_gate.sql");
const entry = read("js/teacher-partner-entry.js");
const views = read("js/teacher-partner-views.js");

test("central active teacher access function checks approval, partner status and expiry", () => {
  assert.match(sql, /function public\.has_active_teacher_access\(\)/);
  assert.match(sql, /stable[\s\S]*security definer[\s\S]*set search_path = ''/i);
  assert.match(sql, /tp\.id = \(select auth\.uid\(\)\)/);
  assert.match(sql, /tp\.approval_status = 'approved'/);
  assert.match(sql, /pp\.status = 'active'/);
  assert.match(sql, /pp\.access_ends_at > now\(\)/);
  assert.doesNotMatch(sql, /has_active_teacher_access\([^)]*uuid/);
});

test("missing, pending, suspended and expired partner access fail closed", () => {
  assert.match(sql, /join public\.teacher_partner_profiles/);
  assert.match(sql, /pp\.status = 'active'/);
  assert.match(sql, /pp\.access_ends_at > now\(\)/);
});

test("all teacher classroom mutation policies use the central gate", () => {
  for (const [table, policies] of Object.entries({
    classes: ["insert_own", "update_own", "delete_own"],
    assignments: ["insert_teacher", "update_teacher", "delete_teacher"],
    teacher_notes: ["insert_own", "update_own", "delete_own"]
  })) for (const suffix of policies) {
    const start = sql.indexOf(`create policy \"${table}_${suffix}\"`);
    const end = sql.indexOf(";", start);
    assert.ok(start >= 0, `${table}_${suffix} policy missing`);
    assert.match(sql.slice(start, end), /has_active_teacher_access\(\)/);
  }
});

test("class student teacher removal is gated while child management remains available", () => {
  const policy = sql.match(/create policy "class_students_delete_allowed"[\s\S]*?;/)?.[0] || "";
  assert.match(policy, /is_teacher_of_class\(class_id\)[\s\S]*has_active_teacher_access\(\)/);
  assert.match(policy, /or public\.can_manage_child\(child_id\)/);
});

test("read policies and partner finance access are not replaced", () => {
  assert.doesNotMatch(sql, /drop policy[^;]*(select|reads own)/i);
  for (const table of ["teacher_partner_profiles", "teacher_referrals", "teacher_access_credits", "teacher_commission_earnings", "teacher_commission_payouts"])
    assert.doesNotMatch(sql, new RegExp(`(?:revoke|drop policy)[^;]*${table}`, "i"));
});

test("function ACLs expose only the teacher gate to authenticated users", () => {
  assert.match(sql, /revoke all on function public\.has_active_teacher_access\(\) from public, anon, authenticated;/i);
  assert.match(sql, /grant execute on function public\.has_active_teacher_access\(\) to authenticated;/i);
  assert.match(sql, /revoke all on function public\.rls_auto_enable\(\) from public, anon, authenticated;/i);
});

test("teachers without a partner profile see registration, purchase and classroom lock actions", () => {
  assert.match(entry, /summary\?\.status\|\|"unregistered"/);
  assert.match(entry, /if\(!access\?\.has_full_access\)/);
  assert.match(views, /register-teacher-partner/);
  assert.match(views, /buy-teacher-monthly/);
});

test("free game and story routes and Turkish text remain untouched", () => {
  assert.doesNotMatch(sql + entry + views, /Ã|Ä|Å|â€/);
  assert.doesNotMatch(sql, /games|stories|football|volleyball/i);
});
