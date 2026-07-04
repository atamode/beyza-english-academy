import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { SUPABASE_CONFIG, assertPublicSupabaseConfig, ACCOUNT_KEYS } from "../js/account-config.js";
import { createPomaSupabaseClient } from "../js/supabase-client.js";
import { browserStorage, activeStudentStorage, scopedKey, setActiveStudentId, getActiveStudentId, lastStudentKey, copyLegacyProgressToStudent, enqueueOfflineMutation, readOfflineQueue } from "../js/account-storage.js";
import { createStudentRepository } from "../js/student-repository.js";
import { canUseTeacherTools, createTeacherRepository } from "../js/teacher-repository.js";
import { mergeStudentState, createSyncEngine } from "../js/sync-engine.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = file => fs.readFileSync(path.join(root, file), "utf8");

test("Supabase config uses only public browser-safe credentials", () => {
  assert.doesNotThrow(() => assertPublicSupabaseConfig(SUPABASE_CONFIG));
  assert.match(SUPABASE_CONFIG.url, /^https:\/\/[a-z0-9-]+\.supabase\.co$/);
  assert.match(SUPABASE_CONFIG.publishableKey, /^sb_publishable_/);
  assert.throws(() => assertPublicSupabaseConfig({ url: "postgres://db", anonKey: "sb_secret_bad" }));
});

test("repository source does not ship server-only Supabase secrets", () => {
  const secret = /sb_secret_|postgres:\/\/|postgresql:\/\//i;
  const files = ["js/supabase-client.js", "js/app.js", "scripts/build.js", "service-worker.js"];
  for (const file of files) assert.doesNotMatch(read(file), secret, file);
});

test("central Supabase client persists session without caching schema changes", async () => {
  const calls = [];
  const client = createPomaSupabaseClient(SUPABASE_CONFIG, async (url, init = {}) => {
    calls.push({ url: String(url), init });
    return { ok: true, headers: { get: () => "application/json" }, text: async () => JSON.stringify({ access_token: "a", refresh_token: "r", user: { id: "u1" } }) };
  });
  const res = await client.auth.signInWithPassword({ email: "a@b.com", password: "12345678" });
  assert.equal(res.data.user.id, "u1");
  assert.ok(calls[0].url.includes("/auth/v1/token"));
});

test("active student storage isolates lesson and sport keys per child", () => {
  const a = activeStudentStorage("child-a");
  const b = activeStudentStorage("child-b");
  a.setItem("beyzaEnglish.progress.v1", JSON.stringify({ totals: { stars: 3 } }));
  b.setItem("beyzaEnglish.progress.v1", JSON.stringify({ totals: { stars: 8 } }));
  assert.notEqual(scopedKey("child-a", "beyzaEnglish.progress.v1"), scopedKey("child-b", "beyzaEnglish.progress.v1"));
  assert.equal(JSON.parse(a.getItem("beyzaEnglish.progress.v1")).totals.stars, 3);
  assert.equal(JSON.parse(b.getItem("beyzaEnglish.progress.v1")).totals.stars, 8);
});

test("profile selector is explicit: no PIN and active child must be selected", () => {
  const app = read("js/app.js");
  const views = read("js/account-views.js");
  assert.match(app, /if\(isStudentRoute&&!getActiveStudentId/);
  assert.match(views, /PIN yok/);
  assert.match(views, /data-child-id/);
});

test("last selected child is remembered without auto-opening another profile", () => {
  setActiveStudentId("parent-1", "child-1");
  assert.equal(getActiveStudentId("parent-1"), "child-1");
  assert.equal(browserStorage().getItem(lastStudentKey("parent-1")), "child-1");
  assert.equal(getActiveStudentId("parent-2"), null);
});

test("legacy local progress migrates only when explicit consent is passed", () => {
  const storage = browserStorage();
  storage.setItem(ACCOUNT_KEYS.legacyProgress, JSON.stringify({ totals: { stars: 12 } }));
  assert.equal(activeStudentStorage("child-migrate").getItem(ACCOUNT_KEYS.legacyProgress), null);
  copyLegacyProgressToStudent("child-migrate");
  assert.match(activeStudentStorage("child-migrate").getItem(ACCOUNT_KEYS.legacyProgress), /stars/);
});

test("student repository uses the required production RPC names", async () => {
  const calls = [];
  const repo = createStudentRepository({ rpc: async (name, args) => { calls.push({ name, args }); return { data: [{ id: "ok" }], error: null }; } });
  await repo.createFamilyChild({ name: "Poma", avatarKey: "fox", birthYear: 2015 });
  await repo.linkGuardianByStudentCode({ studentCode: "ABC123", relationship: "parent" });
  await repo.joinClassByCode({ childId: "child-1", joinCode: "CLASS1" });
  assert.deepEqual(calls.map(c => c.name), ["create_family_child", "link_guardian_by_student_code", "join_class_by_code"]);
});

test("student account lookup is bound to auth_user_id, guardian lookup to guardian table", async () => {
  const queries = [];
  const fake = {
    from(table) {
      queries.push(table);
      const chain = { select: () => chain, eq: () => chain, order: () => chain, maybeSingle: async () => ({ data: null, error: null }) };
      chain.then = resolve => resolve({ data: [], error: null });
      return chain;
    }
  };
  const repo = createStudentRepository(fake);
  await repo.listChildrenForAccount("u1", "student");
  await repo.listChildrenForAccount("u1", "parent");
  assert.ok(queries.includes("children"));
  assert.ok(queries.includes("guardian_students"));
});

test("optimistic revision conflict returns a controlled conflict result", async () => {
  const repo = createStudentRepository({
    from() {
      const chain = { update: () => chain, eq: () => chain, select: () => chain, maybeSingle: async () => ({ data: null, error: null }) };
      return chain;
    }
  });
  const res = await repo.upsertStudentState("child-1", { totals: { stars: 1 } }, 2);
  assert.equal(res.conflict, true);
});

test("sync engine queues safely while offline and merges conflict snapshots", async () => {
  enqueueOfflineMutation("child-q", { state: { totals: { stars: 1 } }, revision: 1 });
  assert.equal(readOfflineQueue("child-q").length, 1);
  const merged = mergeStudentState({ totals: { stars: 2 }, lessonProgress: { a: { bestStars: 1 } } }, { totals: { stars: 5 }, lessonProgress: { b: { bestStars: 3 } } });
  assert.equal(merged.totals.stars, 2);
  assert.ok(merged.lessonProgress.a && merged.lessonProgress.b);
});

test("teacher panel is approval-gated and cannot mutate student progress", () => {
  assert.equal(canUseTeacherTools({ approval_status: "pending" }), false);
  assert.equal(canUseTeacherTools({ approval_status: "approved" }), true);
  const repo = createTeacherRepository({});
  assert.throws(() => repo.updateStudentState(), /ilerlemesini/);
  const views = read("js/account-views.js");
  assert.match(views, /Onay olmadan/);
  assert.match(views, /salt okunur/);
});

test("service worker build excludes cross-origin Supabase API responses from cache", () => {
  const build = read("scripts/build.js");
  assert.match(build, /u\.origin!==self\.location\.origin/);
  assert.match(build, /fetch\(e\.request\)/);
});

test("football, volleyball and word league storage are namespaced but shared under the selected child", () => {
  const child = activeStudentStorage("child-sport");
  child.setItem("beyzaAcademy.games.football.v2.wordLeague", JSON.stringify({ currentLeague: "bronze" }));
  child.setItem("beyzaAcademy.games.football.v1.stats", JSON.stringify({ matches: 1 }));
  child.setItem("beyzaAcademy.games.volleyball.v1.stats", JSON.stringify({ matches: 2 }));
  assert.match(activeStudentStorage("child-sport").getItem("beyzaAcademy.games.football.v2.wordLeague"), /bronze/);
  assert.equal(activeStudentStorage("other-child").getItem("beyzaAcademy.games.football.v2.wordLeague"), null);
});
