(() => {
  const TERMINAL_REASONS = new Set([
    'cloud_crush',
    'cloud_full',
    'morph_crush',
    'sugar_full',
    'sugar_ceiling',
  ]);

  function lastFailReason() {
    try {
      return String(window.PomaShiftMeta?.snapshot?.()?.runtime?.lastFailReason || '');
    } catch {
      return '';
    }
  }

  function isTerminalCloudFail() {
    return TERMINAL_REASONS.has(lastFailReason());
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

  function patchFail(root = document) {
    if (!isTerminalCloudFail()) return;
    const fail = root.matches?.('.fail-view') ? root : root.querySelector?.('.fail-view') || document.querySelector('.fail-view');
    if (!fail) return;

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
    note.textContent = '☁️ Şeker Bulutu oyun alanına ulaştı. Bu deneme bitti; ek hamle kullanılamaz.';
  }

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      mutation.addedNodes.forEach((node) => {
        if (node instanceof Element) patchFail(node);
      });
    }
    patchFail(document);
  });
  observer.observe(document.body, { childList: true, subtree: true });

  window.addEventListener('poma-shift:metric', (event) => {
    if (event.detail?.name !== 'level_fail') return;
    window.setTimeout(() => patchFail(document), 0);
    window.setTimeout(() => patchFail(document), 360);
  });

  window.PomaShiftTerminalCloudFail = {
    reasons: [...TERMINAL_REASONS],
    active: isTerminalCloudFail,
    patch: patchFail,
  };
})();