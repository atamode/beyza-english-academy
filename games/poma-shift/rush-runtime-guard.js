(() => {
  const timer = document.querySelector('.series-timer');
  if (!timer) return;

  const label = timer.querySelector('.series-timer-copy span');
  const value = timer.querySelector('[data-series-time]');
  const bar = timer.querySelector('[data-series-bar]');

  function currentState() {
    try {
      return typeof state !== 'undefined' ? state : null;
    } catch {
      return null;
    }
  }

  function paintRush(rush, gameState) {
    const duration = Number(rush.rushDurationForLevel(gameState.level) || 0);
    const introOpen = Boolean(rush.introOpen?.());
    const remaining = introOpen ? duration : Math.max(0, Number(rush.remainingMs?.() || 0));
    const ratio = duration > 0 ? remaining / duration : 1;

    timer.hidden = false;
    timer.classList.add('rush-level-timer');
    timer.classList.remove('is-rush');
    timer.classList.toggle('is-hot', !introOpen && ratio <= 0.30);
    timer.classList.toggle('is-expired', !introOpen && remaining <= 0);
    timer.classList.toggle('is-paused', introOpen || (!rush.active?.() && remaining > 0));

    if (label) label.textContent = 'RUSH';
    if (value) value.textContent = `${(remaining / 1000).toFixed(remaining < 10_000 ? 1 : 0)}s`;
    if (bar) bar.style.transform = `scaleX(${Math.max(0, Math.min(1, ratio))})`;
  }

  function paintFree() {
    timer.hidden = false;
    timer.classList.remove('rush-level-timer', 'is-rush', 'is-hot', 'is-expired', 'is-paused');
    if (label) label.textContent = 'SERİ';
    if (value) value.textContent = 'SERBEST';
    if (bar) bar.style.transform = 'scaleX(1)';
  }

  function sync() {
    const gameState = currentState();
    const rush = window.PomaShiftRush;
    if (!gameState || !rush || gameState.status !== 'playing') return;

    if (rush.isRushLevel?.(gameState.level)) paintRush(rush, gameState);
    else paintFree();
  }

  const handle = window.setInterval(sync, 100);
  window.addEventListener('pagehide', () => window.clearInterval(handle), { once: true });

  window.PomaShiftRushRuntimeGuard = { sync };
  sync();
})();
