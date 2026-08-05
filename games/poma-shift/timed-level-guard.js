(() => {
  function currentState() {
    try {
      return typeof state !== 'undefined' ? state : null;
    } catch {
      return null;
    }
  }

  function isTimedLevel(level) {
    if (window.PomaShiftRush?.isRushLevel) return window.PomaShiftRush.isRushLevel(level);
    const n = Number(level || 0);
    if (n < 11) return false;
    const boss = n >= 90 && (n - 90) % 30 === 0;
    return !boss && (n === 11 || n % 5 === 0);
  }

  function isActiveTimedPlay() {
    const gameState = currentState();
    return Boolean(
      gameState &&
      gameState.status === 'playing' &&
      isTimedLevel(gameState.level) &&
      !window.PomaShiftRush?.introOpen?.()
    );
  }

  function blockTimedMetaOpen(event, message) {
    event.preventDefault();
    event.stopImmediatePropagation();
    if (typeof setMessage === 'function') setMessage(message);
  }

  document.addEventListener('click', (event) => {
    if (!isActiveTimedPlay()) return;

    if (event.target.closest('[data-action="map"]')) {
      blockTimedMetaOpen(event, '⚡ RUSH aktif. Harita bölüm bitince açılır.');
      return;
    }

    if (event.target.closest('[data-meta-shop],[data-meta-lives],[data-meta-gift]')) {
      blockTimedMetaOpen(event, '⚡ RUSH aktif. Mağaza ve ödüller bölüm bitince açılır.');
      return;
    }

    const power = event.target.closest('[data-use-power]');
    if (!power) return;

    const id = power.dataset.usePower;
    const quantity = Number(window.PomaShiftMeta?.snapshot?.().meta?.inventory?.[id] || 0);
    if (quantity > 0) return;

    blockTimedMetaOpen(event, 'Bu güç sende yok. RUSH bölümünden sonra mağazadan alabilirsin.');
  }, true);

  window.PomaShiftTimedLevelGuard = { isTimedLevel, isActiveTimedPlay };
})();
