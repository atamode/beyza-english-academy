(() => {
  function isTimedLevel(level) {
    if (level < 11) return false;
    return level === 11 || level % 5 === 0;
  }

  function isActiveTimedPlay() {
    return window.state?.status === 'playing' && isTimedLevel(Number(window.state?.level || 0));
  }

  function blockTimedMetaOpen(event, message) {
    event.preventDefault();
    event.stopImmediatePropagation();
    if (typeof window.setMessage === 'function') window.setMessage(message);
  }

  document.addEventListener('click', (event) => {
    if (!isActiveTimedPlay()) return;

    if (event.target.closest('[data-meta-shop],[data-meta-lives],[data-meta-gift]')) {
      blockTimedMetaOpen(event, 'Süreli bölüm aktif. Mağaza ve ödüller bölüm bitince açılır.');
      return;
    }

    const power = event.target.closest('[data-use-power]');
    if (!power) return;

    const id = power.dataset.usePower;
    const quantity = Number(window.PomaShiftMeta?.snapshot?.().meta?.inventory?.[id] || 0);
    if (quantity > 0) return;

    blockTimedMetaOpen(event, 'Bu güç sende yok. Süreli bölümden sonra mağazadan alabilirsin.');
  }, true);

  window.PomaShiftTimedLevelGuard = { isTimedLevel };
})();
