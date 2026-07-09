import { ACCOUNT_KEYS } from "./account-config.js";

const memoryStore = new Map();

export function browserStorage() {
  if (typeof localStorage !== "undefined") return localStorage;
  return {
    getItem(key) { return memoryStore.has(key) ? memoryStore.get(key) : null; },
    setItem(key, value) { memoryStore.set(key, String(value)); },
    removeItem(key) { memoryStore.delete(key); }
  };
}

export function activeStudentKey(userId) {
  return `${ACCOUNT_KEYS.activeStudentPrefix}.${userId || "anonymous"}`;
}

export function lastStudentKey(userId) {
  return `${ACCOUNT_KEYS.lastStudentPrefix}.${userId || "anonymous"}`;
}

export function scopedKey(childId, key) {
  return childId ? `pomaAcademy.student.${childId}.${key}` : key;
}

export function getActiveStudentId(userId = currentAccountUserId()) {
  try { return browserStorage().getItem(activeStudentKey(userId)); } catch { return null; }
}

export function setActiveStudentId(userId, childId) {
  const storage = browserStorage();
  storage.setItem(activeStudentKey(userId), childId);
  storage.setItem(lastStudentKey(userId), childId);
}

export function clearActiveStudentId(userId) {
  browserStorage().removeItem(activeStudentKey(userId));
}

export function clearAccountSelection(userId, { forgetLast = false } = {}) {
  const storage = browserStorage();
  storage.removeItem(activeStudentKey(userId));
  if (forgetLast) storage.removeItem(lastStudentKey(userId));
}

export function currentAccountUserId() {
  try {
    const s = JSON.parse(browserStorage().getItem(ACCOUNT_KEYS.session) || "null");
    return s?.user?.id || s?.user_id || null;
  } catch { return null; }
}

export function activeStudentStorage(childId = getActiveStudentId()) {
  const storage = browserStorage();
  return {
    getItem(key) { return storage.getItem(scopedKey(childId, key)); },
    setItem(key, value) { storage.setItem(scopedKey(childId, key), String(value)); },
    removeItem(key) { storage.removeItem(scopedKey(childId, key)); }
  };
}

export function getLegacyProgressSnapshot() {
  const keys = [
    ACCOUNT_KEYS.legacyProgress,
    "beyzaAcademy.games.football.v1.stats",
    "beyzaAcademy.games.football.v1.achievements",
    "beyzaAcademy.games.football.v2.wordLeague",
    "beyzaAcademy.games.volleyball.v1.stats",
    "beyzaAcademy.games.volleyball.v1.achievements"
  ];
  const snapshot = {};
  const storage = browserStorage();
  for (const key of keys) {
    const value = storage.getItem(key);
    if (value != null) snapshot[key] = value;
  }
  return snapshot;
}

export function hasLegacyProgress() {
  const s = getLegacyProgressSnapshot();
  return Object.keys(s).some(k => {
    try {
      const v = JSON.parse(s[k]);
      return v && Object.keys(v).length > 0;
    } catch { return Boolean(s[k]); }
  });
}

export function copyLegacyProgressToStudent(childId) {
  const snapshot = getLegacyProgressSnapshot();
  const storage = browserStorage();
  for (const [key, value] of Object.entries(snapshot)) {
    storage.setItem(scopedKey(childId, key), value);
  }
  storage.setItem(`${ACCOUNT_KEYS.snapshotPrefix}.${childId}.${Date.now()}`, JSON.stringify(snapshot));
  return snapshot;
}

export function queueKey(childId) {
  return `${ACCOUNT_KEYS.offlineQueuePrefix}.${childId}`;
}

export function readOfflineQueue(childId) {
  try { return JSON.parse(browserStorage().getItem(queueKey(childId)) || "[]"); } catch { return []; }
}

export function enqueueOfflineMutation(childId, mutation) {
  const queue = readOfflineQueue(childId);
  queue.push({ ...mutation, queuedAt: new Date().toISOString() });
  browserStorage().setItem(queueKey(childId), JSON.stringify(queue));
  return queue;
}

export function clearOfflineQueue(childId) {
  browserStorage().removeItem(queueKey(childId));
}
