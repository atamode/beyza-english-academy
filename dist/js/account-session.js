import { ACCOUNT_KEYS } from "./account-config.js";
import { getSupabaseClient, translateSupabaseError } from "./supabase-client.js";
import { createStudentRepository } from "./student-repository.js";
import { createTeacherRepository } from "./teacher-repository.js";
import { setActiveStudentId, getActiveStudentId, clearAccountSelection, currentAccountUserId, readLinkedChildren, copyLegacyProgressToStudent, hasLegacyProgress, browserStorage } from "./account-storage.js";
import { loadState, saveState, defaultState } from "./storage.js";

export async function restoreAccountSession(client = getSupabaseClient()) {
  const { data } = await client.auth.getSession();
  if (!data.session) return { status: "signed-out", session: null };
  const user = data.session.user || (await client.auth.getUser()).data.user;
  const profileRes = await client.from("parent_profiles").select("*").eq("id", user.id).maybeSingle();
  const profile = profileRes.data || { id: user.id, display_name: user.email?.split("@")[0] || "KullanÄ±cÄ±", account_type: user.user_metadata?.account_type || "parent" };
  browserStorage().setItem(ACCOUNT_KEYS.session, JSON.stringify({ ...data.session, user }));
  return { status: "signed-in", session: data.session, user, profile };
}

export async function signIn(credentials, passwordArg, client = getSupabaseClient()) {
  try {
    const email = typeof credentials === "object" ? credentials.email : credentials;
    const password = typeof credentials === "object" ? credentials.password : passwordArg;
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return restoreAccountSession(client);
  } catch (error) {
    throw new Error(translateSupabaseError(error));
  }
}

export async function signUp({ email, password, displayName, accountType, avatarKey }, client = getSupabaseClient()) {
  try {
    if (String(password || "").length < 8) throw new Error("Åifre en az 8 karakter olmalÄ±.");
    const { error } = await client.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName, account_type: accountType, avatar_key: avatarKey || "sporty-poma" } }
    });
    if (error) throw error;
    return restoreAccountSession(client);
  } catch (error) {
    throw new Error(translateSupabaseError(error));
  }
}

export async function signOut(client = getSupabaseClient()) {
  let userId = currentAccountUserId();
  if (!userId) {
    const current = await client.auth.getSession().catch(() => null);
    userId = current?.data?.session?.user?.id || null;
  }
  try {
    await client.auth.signOut();
  } finally {
    if (userId) clearAccountSelection(userId, { forgetLast: true });
    browserStorage().removeItem(ACCOUNT_KEYS.session);
  }
}

export async function loadChildrenForSession(account, repo = createStudentRepository()) {
  if (!account?.user) return [];
  const remote = await repo.listChildrenForAccount(account.user.id, account.profile?.account_type || "parent");
  const cached = readLinkedChildren(account.user.id);
  const merged = new Map([...cached, ...remote].filter(child => child?.id).map(child => [String(child.id), child]));
  return [...merged.values()].filter(child => child.is_active !== false);
}

export async function activateStudent(account, child, { migrateLegacy = false } = {}, repo = createStudentRepository()) {
  if (!account?.user?.id || !child?.id) throw new Error("Ã–ÄŸrenci profili seÃ§ilemedi.");
  setActiveStudentId(account.user.id, child.id);
  let remote = null;
  try { remote = await repo.getStudentState(child.id); } catch {}
  const remoteEmpty = !remote?.state || Object.keys(remote.state || {}).length === 0;
  if (migrateLegacy && remoteEmpty && hasLegacyProgress()) copyLegacyProgressToStudent(child.id);
  const state = remote?.state ? { ...defaultState(), ...remote.state } : loadState();
  state.profile = { ...(state.profile || {}), name: child.name, age: state.profile?.age || 11, childId: child.id, studentCode: child.student_code };
  saveState(state);
  try { sessionStorage.setItem(`poma.revision.${child.id}`, String(remote?.revision || 0)); } catch {}
  return state;
}

export function activeStudentBelongsTo(account, children) {
  const active = getActiveStudentId(account?.user?.id);
  return active && children.some(c => c.id === active);
}

export async function resolveTeacherStatus(account, teacherRepo = createTeacherRepository()) {
  if (!["teacher", "both"].includes(account?.profile?.account_type)) return null;
  return teacherRepo.getTeacherProfile(account.user.id);
}

