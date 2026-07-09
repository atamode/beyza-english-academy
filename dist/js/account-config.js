export const SUPABASE_CONFIG = Object.freeze({
  url: "https://gzsrcjovhhlfpvvpucri.supabase.co",
  publishableKey: "sb_publishable_ptkEwsRmgYCdhNqATXXWYA_4auQq5II"
});

export const ACCOUNT_KEYS = Object.freeze({
  session: "pomaAcademy.account.session.v1",
  activeStudentPrefix: "pomaAcademy.account.activeStudent.v1",
  lastStudentPrefix: "pomaAcademy.account.lastStudent.v1",
  linkedChildrenPrefix: "pomaAcademy.account.linkedChildren.v1",
  migrationPrefix: "pomaAcademy.account.migration.v1",
  offlineQueuePrefix: "pomaAcademy.account.offlineQueue.v1",
  remoteMetaPrefix: "pomaAcademy.account.remoteMeta.v1",
  snapshotPrefix: "pomaAcademy.account.snapshot.v1",
  legacyProgress: "beyzaEnglish.progress.v1"
});

export const ACCOUNT_ROLES = Object.freeze(["parent", "teacher", "both", "student"]);

export function assertPublicSupabaseConfig(config = SUPABASE_CONFIG) {
  const blob = JSON.stringify(config);
  if (!config.url || !config.publishableKey) throw new Error("Supabase public config eksik.");
  if (/sb_secret_|service_role|postgres(ql)?:\/\//i.test(blob)) throw new Error("Gizli Supabase anahtarı public build'e giremez.");
  return config;
}
