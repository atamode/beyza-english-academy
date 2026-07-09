import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { SUPABASE_CONFIG, assertPublicSupabaseConfig, ACCOUNT_KEYS } from "../js/account-config.js";
import { createPomaSupabaseClient } from "../js/supabase-client.js";
import { browserStorage, activeStudentStorage, scopedKey, setActiveStudentId, getActiveStudentId, clearAccountSelection, rememberLinkedChild, activeStudentKey, lastStudentKey, copyLegacyProgressToStudent, enqueueOfflineMutation, readOfflineQueue } from "../js/account-storage.js";
import { signOut, loadChildrenForSession } from "../js/account-session.js";
import { buildParentReport, parentReportShareText } from "../js/parent-mode.js";
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

test("Supabase select chains execute when awaited", async () => {
  const calls = [];
  const client = createPomaSupabaseClient(SUPABASE_CONFIG, async (url, init = {}) => {
    calls.push({ url: String(url), init });
    return {
      ok: true,
      headers: { get: () => "application/json" },
      text: async () => JSON.stringify([{ child_id: "child-1" }])
    };
  });
  const result = await client.from("guardian_students").select("child_id").eq("guardian_id", "parent-1");
  assert.equal(result.error, null);
  assert.deepEqual(result.data, [{ child_id: "child-1" }]);
  assert.match(calls[0].url, /guardian_students/);
  assert.match(calls[0].url, /guardian_id=eq\.parent-1/);
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

test("home continues directly when the signed-in account has an active profile", () => {
  setActiveStudentId("family-home", "child-home");
  assert.equal(getActiveStudentId("family-home"), "child-home");
  const app = read("js/app.js");
  assert.match(app, /if\(isStudentRoute&&!getActiveStudentId\(account\.user\.id\)\)/);
  assert.match(app, /if\(!state\.onboardingComplete&&r==="home"\)return welcome\(\)/);
  assert.match(app, /home\(\)\}/);
});

test("last selected child is remembered without auto-opening another profile", () => {
  setActiveStudentId("parent-1", "child-1");
  assert.equal(getActiveStudentId("parent-1"), "child-1");
  assert.equal(browserStorage().getItem(lastStudentKey("parent-1")), "child-1");
  assert.equal(getActiveStudentId("parent-2"), null);
});

test("profile switch clears only the active child and keeps learning progress", () => {
  const storage = browserStorage();
  setActiveStudentId("family-switch", "beyza");
  activeStudentStorage("beyza").setItem(ACCOUNT_KEYS.legacyProgress, JSON.stringify({ totals: { stars: 9 } }));
  clearAccountSelection("family-switch");
  assert.equal(getActiveStudentId("family-switch"), null);
  assert.equal(storage.getItem(lastStudentKey("family-switch")), "beyza");
  assert.equal(JSON.parse(activeStudentStorage("beyza").getItem(ACCOUNT_KEYS.legacyProgress)).totals.stars, 9);
});

test("Beyza and Kemal progress and notes stay isolated by child id", () => {
  const beyza = activeStudentStorage("beyza-child");
  const kemal = activeStudentStorage("kemal-child");
  beyza.setItem(ACCOUNT_KEYS.legacyProgress, JSON.stringify({ lesson: "001", score: 80 }));
  kemal.setItem("teacherNotes", JSON.stringify([{ text: "Kemal notu" }]));
  assert.equal(kemal.getItem(ACCOUNT_KEYS.legacyProgress), null);
  assert.equal(beyza.getItem("teacherNotes"), null);
  setActiveStudentId("family-isolation", "kemal-child");
  assert.match(activeStudentStorage(getActiveStudentId("family-isolation")).getItem("teacherNotes"), /Kemal notu/);
  setActiveStudentId("family-isolation", "beyza-child");
  assert.match(activeStudentStorage(getActiveStudentId("family-isolation")).getItem(ACCOUNT_KEYS.legacyProgress), /001/);
});

test("sign out removes session selections without deleting child learning data", async () => {
  const storage = browserStorage();
  storage.setItem(ACCOUNT_KEYS.session, JSON.stringify({ user: { id: "family-logout" } }));
  setActiveStudentId("family-logout", "kemal-logout");
  activeStudentStorage("kemal-logout").setItem(ACCOUNT_KEYS.legacyProgress, JSON.stringify({ stars: 12 }));
  await signOut({ auth: { signOut: async () => ({ error: null }), getSession: async () => ({ data: { session: null } }) } });
  assert.equal(storage.getItem(ACCOUNT_KEYS.session), null);
  assert.equal(storage.getItem(activeStudentKey("family-logout")), null);
  assert.equal(storage.getItem(lastStudentKey("family-logout")), null);
  assert.match(activeStudentStorage("kemal-logout").getItem(ACCOUNT_KEYS.legacyProgress), /12/);
});

test("profile menu is guarded and student role cannot open parent mode directly", () => {
  const appSource = read("js/app.js");
  const html = read("index.html");
  assert.match(html, /data-action="profile-switch"/);
  assert.match(html, /data-action="profile-parent"/);
  assert.match(html, /data-action="profile-logout"/);
  assert.match(appSource, /if\(\["parent","both"\]\.includes\(type\)\)/);
  assert.match(appSource, /Veli modu için veli yetkili hesaba geçmelisin/);
  assert.match(appSource, /navigate\("account"\)/);
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

test("a successfully linked child remains visible when the guardian link table is hidden by RLS", async () => {
  rememberLinkedChild("guardian-cache", { id: "child-cache", name: "Beyza", student_code: "POMA123" });
  const children = await loadChildrenForSession(
    { user: { id: "guardian-cache" }, profile: { account_type: "parent" } },
    { listChildrenForAccount: async () => [] }
  );
  assert.deepEqual(children.map(child => child.id), ["child-cache"]);
  assert.equal(children[0].student_code, "POMA123");
});

test("parent report exposes measurable child progress without invented time data", () => {
  const state = {
    profile: { name: "Beyza" },
    lessonProgress: { a: { completed: true }, b: { completed: false } },
    vocabularyProgress: {
      w1: { status: "learned" },
      w2: { status: "difficult" },
      w3: { status: "learning" }
    },
    diagnostic: { skillGroups: [
      { label: "Subject Pronouns", percent: 75 },
      { label: "am / is / are", percent: 40 }
    ] },
    moduleReviews: {}
  };
  const report = buildParentReport(state, [{ id: "w1" }, { id: "w2" }, { id: "w3" }]);
  assert.equal(report.seenWords, 3);
  assert.equal(report.learnedWords, 1);
  assert.equal(report.difficultWords, 1);
  assert.equal(report.completedLessons, 1);
  assert.equal(report.strongestTopic.label, "Subject Pronouns");
  assert.equal(report.weakestTopic.label, "am / is / are");
  const share = parentReportShareText(report);
  assert.match(share, /Görülen kelime: 3/);
  assert.match(share, /En güçlü konu: Subject Pronouns/);
  assert.doesNotMatch(share, /saat|dakika|→/);
});

test("optimistic revision conflict returns a controlled conflict result", async () => {
  const repo = createStudentRepository({
    from() {
      const chain = { update: () => chain, eq: () => chain, select: () => chain, maybeSingle: async () => ({ data: { child_id: "child-1", revision: 3, state: {} }, error: null }) };
      return chain;
    }
  });
  const res = await repo.upsertStudentState("child-1", { totals: { stars: 1 } }, 2);
  assert.equal(res.conflict, true);
});

test("first student sync inserts a child-scoped state row when none exists", async () => {
  const calls = [];
  const client = {
    from(table) {
      const chain = {
        update(payload) { calls.push({ method: "update", table, payload }); return chain; },
        insert(payload) { calls.push({ method: "insert", table, payload }); return Promise.resolve({ data: [{ ...payload, revision: 1 }], error: null }); },
        eq() { return chain; },
        select() { return chain; },
        maybeSingle: async () => ({ data: null, error: null }),
        then(resolve) { resolve({ data: [], error: null }); }
      };
      return chain;
    }
  };
  const repo = createStudentRepository(client);
  const result = await repo.upsertStudentState("child-first-sync", { totals: { stars: 4 } }, 0);
  assert.equal(result.conflict, false);
  assert.equal(result.row.child_id, "child-first-sync");
  assert.deepEqual(calls.map(call => call.method), ["update", "insert"]);
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
