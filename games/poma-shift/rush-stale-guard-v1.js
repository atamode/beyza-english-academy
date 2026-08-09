(() => {
  const timer = document.querySelector('.series-timer');
  const timerLabel = timer?.querySelector('.series-timer-copy span');
  const timerValue = timer?.querySelector('[data-series-time]');
  const timerBar = timer?.querySelector('[data-series-bar]');

  function currentState() {
    try { return typeof state !== 'undefined' ? state : null; } catch { return null; }
  }

  function forceFreeTimer() {
    if (!timer) return;
    timer.hidden = false;
    timer.classList.remove('rush-level-timer', 'is-rush', 'is-hot', 'is-expired', 'is-paused');
    if (timerLabel) timerLabel.textContent = 'SERİ';
    if (timerValue) timerValue.textContent = 'SERBEST';
    if (timerBar) timerBar.style.transform = 'scaleX(1)';
  }

  function hideIntro(intro) {
    if (!intro) return;
    intro.hidden = true;
    intro.style.pointerEvents = 'none';
  }

  function sync() {
    const gameState = currentState();
    const rush = window.PomaShiftRush;
    const intro = document.querySelector('.rush-intro');
    if (!gameState || !rush) return;

    const lobbyOpen = Boolean(window.PomaShiftLobbyActive || document.body.classList.contains('poma-lobby-open'));
    const isRush = Boolean(rush.isRushLevel?.(gameState.level));
    const introOpen = Boolean(rush.introOpen?.());

    if (lobbyOpen || gameState.status !== 'playing' || !isRush) {
      hideIntro(intro);
      if (!isRush) forceFreeTimer();
      return;
    }

    if (!introOpen && intro && !intro.hidden) hideIntro(intro);
    if (introOpen && intro) intro.style.pointerEvents = 'auto';
  }

  const handle = window.setInterval(sync, 180);
  document.addEventListener('poma:lobby-state', sync);
  window.addEventListener('pagehide', () => window.clearInterval(handle), { once: true });

  window.PomaShiftRushStaleGuard = { sync };
  sync();
})();