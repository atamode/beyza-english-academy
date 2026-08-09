(() => {
  const META_KEY = 'pomaShift.meta.v1';
  const PROGRESS_KEY = 'pomaShift.progress.v1';
  const WELCOME_MARKER = 'welcomeGiftSeededV1';
  const MILESTONE_MARKER = 'milestoneGiftMigratedV1';
  const MILESTONES = [
    { level: 10, id: 'computer' },
    { level: 20, id: 'phone' },
    { level: 30, id: 'arrow' },
    { level: 40, id: 'claw' },
    { level: 50, id: 'pacifier' },
    { level: 60, id: 'staff' },
    { level: 80, id: 'leaf' },
  ];

  function readJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function writeJson(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  }

  const progress = readJson(PROGRESS_KEY, { highestUnlocked: 1, lastLevel: 1 });
  const highest = Math.max(1, Number(progress?.highestUnlocked || 1));
  const meta = readJson(META_KEY, {}) || {};
  meta.inventory = meta.inventory && typeof meta.inventory === 'object' ? meta.inventory : {};
  meta.unlocked = meta.unlocked && typeof meta.unlocked === 'object' ? meta.unlocked : {};
  meta[MILESTONE_MARKER] = meta[MILESTONE_MARKER] && typeof meta[MILESTONE_MARKER] === 'object'
    ? meta[MILESTONE_MARKER]
    : {};

  let changed = false;

  // First encounter teaches the gift mechanic immediately. After this one claim,
  // meta-system resumes the normal 12-hour cadence.
  if (!meta[WELCOME_MARKER]) {
    meta[WELCOME_MARKER] = true;
    meta.returnGiftReadyAt = 0;
    changed = true;
  }

  // Older sessions could have the lobby power visually open by progress level while
  // meta-system had not yet applied the corrected 10/20/30/... milestone table.
  // Repair only genuinely missing unlocks; never duplicate a gift that was already granted/used.
  MILESTONES.forEach(({ level, id }) => {
    if (highest <= level || meta[MILESTONE_MARKER][id]) return;
    const alreadyUnlocked = Boolean(meta.unlocked[id]);
    if (!alreadyUnlocked) {
      meta.unlocked[id] = true;
      meta.inventory[id] = Math.max(0, Number(meta.inventory[id] || 0)) + 1;
    }
    meta[MILESTONE_MARKER][id] = true;
    changed = true;
  });

  if (changed) writeJson(META_KEY, meta);

  window.PomaShiftProgressionGiftBootstrap = {
    highest,
    welcomeGiftReady: Number(meta.returnGiftReadyAt || 0) <= Date.now(),
    migrated: { ...meta[MILESTONE_MARKER] },
  };
})();