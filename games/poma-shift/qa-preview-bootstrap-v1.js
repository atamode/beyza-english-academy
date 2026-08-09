(() => {
  const params = new URLSearchParams(location.search);
  const qaEnabled = params.get('qa') === '1';
  const ACTIVE_KEY = 'pomaShift.qaPreview.active.v1';
  const BACKUP_KEY = 'pomaShift.qaPreview.backup.v1';
  const CLEAN_MARKER = 'pomaShift.prelaunch-clean.v44';
  const DATA_KEYS = [
    'pomaShift.progress.v1',
    'pomaShift.meta.v1',
    'pomaShift.fire.v1',
    'pomaShift.loadout.v2',
  ];

  function readRaw(key) {
    try { return localStorage.getItem(key); } catch { return null; }
  }

  function writeRaw(key, value) {
    try {
      if (value == null) localStorage.removeItem(key);
      else localStorage.setItem(key, value);
    } catch {}
  }

  function readJson(key, fallback = {}) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function restoreIfNeeded() {
    if (qaEnabled || readRaw(ACTIVE_KEY) !== '1') return;
    const backup = readJson(BACKUP_KEY, null);
    if (backup && typeof backup === 'object') {
      DATA_KEYS.forEach((key) => {
        const entry = backup[key];
        if (!entry || entry.exists !== true) writeRaw(key, null);
        else writeRaw(key, entry.value);
      });
    }
    writeRaw(ACTIVE_KEY, null);
    writeRaw(BACKUP_KEY, null);
  }

  restoreIfNeeded();
  if (!qaEnabled) return;

  if (readRaw(ACTIVE_KEY) !== '1') {
    const backup = {};
    DATA_KEYS.forEach((key) => {
      const value = readRaw(key);
      backup[key] = { exists: value !== null, value };
    });
    writeRaw(BACKUP_KEY, JSON.stringify(backup));
    writeRaw(ACTIVE_KEY, '1');
  }

  // QA must never be wiped by the one-time prelaunch cleanup in lobby-v1.
  writeRaw(CLEAN_MARKER, '1');

  const progress = readJson('pomaShift.progress.v1', { highestUnlocked: 1, lastLevel: 1 });
  const originalLast = Math.max(1, Number(progress.lastLevel || 1));
  writeRaw('pomaShift.progress.v1', JSON.stringify({
    ...progress,
    highestUnlocked: Math.max(91, Number(progress.highestUnlocked || 1)),
    lastLevel: Math.min(90, originalLast),
  }));

  const meta = readJson('pomaShift.meta.v1', {});
  meta.coins = Math.max(99_999, Number(meta.coins || 0));
  meta.lives = 3;
  meta.lifeReadyAt = 0;
  meta.returnGiftReadyAt = 0;
  meta.continueAdsByLevel = {};
  writeRaw('pomaShift.meta.v1', JSON.stringify(meta));

  window.PomaShiftQAPreview = {
    active: true,
    maxLevel: 90,
    exitUrl() {
      const url = new URL(location.href);
      url.searchParams.delete('qa');
      return url.toString();
    },
  };

  const style = document.createElement('style');
  style.textContent = `
    html.poma-qa-preview .poma-map-node.qa-open > span { opacity: 1 !important; }
    .poma-qa-badge {
      position: fixed;
      z-index: 160;
      left: 50%;
      top: max(8px, env(safe-area-inset-top));
      transform: translateX(-50%);
      padding: 6px 10px;
      border-radius: 999px;
      background: rgba(8,18,38,.86);
      border: 1px solid rgba(105,220,255,.45);
      color: #c9f4ff;
      font: 900 10px/1 system-ui,sans-serif;
      letter-spacing: .04em;
      pointer-events: none;
      box-shadow: 0 8px 24px rgba(0,0,0,.26);
    }
  `;
  document.head.appendChild(style);
  document.documentElement.classList.add('poma-qa-preview');

  function patchLobby() {
    document.querySelectorAll('.poma-lobby [data-lobby-level]').forEach((node) => {
      const level = Number(node.dataset.lobbyLevel || 0);
      if (!level || level > 90) return;
      if (node.classList.contains('locked')) node.classList.remove('locked');
      if (node.classList.contains('complete')) node.classList.remove('complete');
      if (!node.classList.contains('qa-open')) node.classList.add('qa-open');
      if (node.hasAttribute('aria-disabled')) node.removeAttribute('aria-disabled');
      const label = node.querySelector(':scope > span');
      const nextLabel = String(level);
      if (label && label.textContent !== nextLabel) label.textContent = nextLabel;
    });
    if (!document.querySelector('.poma-qa-badge') && document.body) {
      const badge = document.createElement('div');
      badge.className = 'poma-qa-badge';
      badge.textContent = '🧪 QA · LEVEL 1–90 AÇIK';
      document.body.appendChild(badge);
    }
  }

  function schedulePatch() {
    window.requestAnimationFrame(() => patchLobby());
    window.setTimeout(patchLobby, 120);
    window.setTimeout(patchLobby, 420);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', schedulePatch, { once: true });
  } else {
    schedulePatch();
  }
  document.addEventListener('poma:lobby-state', schedulePatch);
})();