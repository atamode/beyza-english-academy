(() => {
  const MAX_CONTINUES = 5;
  const HAPPY_POMA_SRC = '../../assets/brand/poma-academy/poma-main-wave.png';
  const SAD_POMA_SRC = '../../assets/brand/poma-academy/poma-sad.png';

  const modal = document.querySelector('.modal-screen');
  const content = modal?.querySelector('[data-modal-content]');
  if (!modal || !content) return;

  const style = document.createElement('style');
  style.textContent = `
    .result-view > .poma-result-main {
      display: block !important;
      width: 104px !important;
      height: 104px !important;
      margin: -6px auto 6px !important;
      object-fit: contain !important;
      border: 0 !important;
      border-radius: 0 !important;
      background: transparent !important;
      box-shadow: none !important;
      opacity: 1 !important;
      transform: none !important;
      filter: drop-shadow(0 10px 18px rgba(0,0,0,.28)) !important;
    }
    .result-view > .poma-result-main.poma-win {
      animation: pomaWin .62s cubic-bezier(.2,.8,.2,1);
    }
    .result-view > .poma-result-main.poma-fail {
      animation: none !important;
    }
    .poma-scarfless-badge .poma-character-portrait {
      display: none !important;
    }
    .terminal-continue-note {
      margin: 4px 0 0 !important;
      color: #b9c9e3;
      font-size: 10px;
      font-weight: 800;
    }
    @media (max-width: 699px) {
      .result-view > .poma-result-main {
        width: 96px !important;
        height: 96px !important;
      }
    }
  `;
  document.head.appendChild(style);

  function currentLevel() {
    try {
      return Math.max(1, Number(state?.level || 1));
    } catch {
      return 1;
    }
  }

  function metaSnapshot() {
    try {
      return window.PomaShiftMeta?.snapshot?.()?.meta || {};
    } catch {
      return {};
    }
  }

  function continueCount() {
    const meta = metaSnapshot();
    return Number(meta.continueAdsByLevel?.[String(currentLevel())] || 0);
  }

  function livesRemaining() {
    return Number(metaSnapshot().lives ?? 0);
  }

  function directResultArt(view) {
    return [...view.children].filter((node) => (
      node.matches?.('.poma-result-avatar, .poma-result-art, .poma-character-portrait.poma-result-art')
    ));
  }

  function normalizeResultArt(view) {
    const failed = view.classList.contains('fail-view');
    const desiredSrc = failed ? SAD_POMA_SRC : HAPPY_POMA_SRC;
    const desiredAlt = failed ? 'Üzgün Poma' : 'Mutlu Poma';
    const candidates = directResultArt(view);

    let hero = candidates.find((node) => node.matches?.('img[data-poma-result-main]'));
    if (!hero) hero = candidates.find((node) => node instanceof HTMLImageElement);
    if (!(hero instanceof HTMLImageElement)) hero = document.createElement('img');

    candidates.forEach((node) => {
      if (node !== hero) node.remove();
    });

    hero.dataset.pomaResultMain = '1';
    hero.className = `poma-result-avatar poma-result-art poma-result-main ${failed ? 'poma-fail poma-result-sad' : 'poma-win'}`;
    hero.src = desiredSrc;
    hero.alt = desiredAlt;
    hero.loading = 'eager';
    hero.decoding = 'async';
    hero.removeAttribute('aria-hidden');

    const icon = view.querySelector(':scope > .result-icon');
    if (icon) view.insertBefore(hero, icon);
    else if (view.firstElementChild !== hero) view.prepend(hero);

    view.querySelectorAll('.poma-scarfless-badge .poma-character-portrait').forEach((node) => node.remove());
  }

  function makeTerminalFailActionable(fail) {
    if (continueCount() < MAX_CONTINUES) return;

    fail.querySelector('[data-meta-continue]')?.remove();

    let note = fail.querySelector('[data-terminal-continue-note]');
    if (!note) {
      note = document.createElement('p');
      note.dataset.terminalContinueNote = '1';
      note.className = 'terminal-continue-note';
      const retry = fail.querySelector('[data-retry]');
      if (retry) retry.insertAdjacentElement('beforebegin', note);
      else fail.appendChild(note);
    }
    note.textContent = livesRemaining() > 0
      ? '5/5 reklam devamı kullanıldı. Yeniden oynayabilir veya haritaya dönebilirsin.'
      : '5/5 reklam devamı kullanıldı. Haritaya dönebilir veya can alabilirsin.';

    fail.querySelectorAll('button').forEach((button) => {
      button.disabled = false;
      button.style.pointerEvents = 'auto';
    });

    modal.hidden = false;
    modal.style.opacity = '';
    modal.style.pointerEvents = 'auto';
  }

  function patchResultUi() {
    content.querySelectorAll('.result-view').forEach((view) => normalizeResultArt(view));
    const fail = content.querySelector('.fail-view');
    if (fail) makeTerminalFailActionable(fail);
  }

  function openLobbyFromResult() {
    modal.hidden = true;
    modal.style.opacity = '';
    modal.style.pointerEvents = '';
    content.innerHTML = '';

    if (typeof window.PomaShiftLobby?.open === 'function') {
      window.PomaShiftLobby.open({ animate: false });
      return;
    }
    document.querySelector('[data-action="map"]')?.click();
  }

  modal.addEventListener('click', (event) => {
    const map = event.target.closest('[data-map]');
    if (map) {
      event.preventDefault();
      event.stopImmediatePropagation();
      openLobbyFromResult();
      return;
    }

    const retry = event.target.closest('[data-retry]');
    if (!retry || continueCount() < MAX_CONTINUES) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    modal.hidden = true;
    modal.style.opacity = '';
    modal.style.pointerEvents = '';
    content.innerHTML = '';

    try {
      setupLevel(currentLevel());
    } catch {
      modal.hidden = false;
      patchResultUi();
    }
  }, true);

  const observer = new MutationObserver(() => requestAnimationFrame(patchResultUi));
  observer.observe(content, { childList: true, subtree: true });

  window.addEventListener('poma-shift:metric', (event) => {
    if (event.detail?.name !== 'level_fail') return;
    window.setTimeout(patchResultUi, 360);
  });

  patchResultUi();

  window.PomaShiftResultFlowFix = {
    patch: patchResultUi,
    continueCount,
    openLobby: openLobbyFromResult,
  };
})();