(() => {
  const TERMINAL_REASONS = new Set([
    'cloud_crush',
    'cloud_full',
    'morph_crush',
    'sugar_full',
    'sugar_ceiling',
  ]);
  let activeReason = '';

  function snapshotFailReason() {
    try {
      return String(window.PomaShiftMeta?.snapshot?.()?.runtime?.lastFailReason || '');
    } catch {
      return '';
    }
  }

  function currentReason() {
    return activeReason || snapshotFailReason();
  }

  function isTerminalCloudFail() {
    return TERMINAL_REASONS.has(currentReason());
  }

  function ensureSentinel(fail) {
    let sentinel = fail.querySelector('[data-terminal-cloud-sentinel]');
    if (sentinel) return sentinel;
    sentinel = document.createElement('span');
    sentinel.hidden = true;
    sentinel.dataset.metaContinue = 'terminal-cloud';
    sentinel.dataset.terminalCloudSentinel = '1';
    sentinel.setAttribute('aria-hidden', 'true');
    fail.prepend(sentinel);
    return sentinel;
  }

  function patchFail() {
    if (!isTerminalCloudFail()) return false;
    const fail = document.querySelector('.fail-view');
    if (!fail) return false;

    fail.querySelectorAll('button[data-meta-continue]').forEach((button) => button.remove());
    ensureSentinel(fail);

    let note = fail.querySelector('[data-terminal-cloud-note]');
    if (!note) {
      note = document.createElement('p');
      note.dataset.terminalCloudNote = '1';
      note.className = 'result-sub terminal-cloud-note';
      const retry = fail.querySelector('[data-retry]');
      if (retry) retry.insertAdjacentElement('beforebegin', note);
      else fail.appendChild(note);
    }
    const copy = '☁️ Şeker Bulutu oyun alanına ulaştı. Bu deneme bitti; ek hamle kullanılamaz.';
    if (note.textContent !== copy) note.textContent = copy;
    return true;
  }

  function schedulePatch() {
    window.setTimeout(patchFail, 300);
    window.setTimeout(patchFail, 440);
    window.setTimeout(patchFail, 760);
  }

  if (typeof lose === 'function') {
    const baseLose = lose;
    lose = function terminalCloudLose(reason, reasonCode = 'unknown') {
      activeReason = TERMINAL_REASONS.has(reasonCode) ? reasonCode : '';
      const result = baseLose(reason, reasonCode);
      if (activeReason) schedulePatch();
      return result;
    };
  }

  window.addEventListener('poma-shift:metric', (event) => {
    if (event.detail?.name !== 'level_fail') return;
    const reason = String(event.detail?.payload?.reason || snapshotFailReason() || '');
    if (TERMINAL_REASONS.has(reason)) activeReason = reason;
    if (isTerminalCloudFail()) schedulePatch();
  });

  window.PomaShiftTerminalCloudFail = {
    reasons: [...TERMINAL_REASONS],
    active: isTerminalCloudFail,
    patch: patchFail,
  };
})();