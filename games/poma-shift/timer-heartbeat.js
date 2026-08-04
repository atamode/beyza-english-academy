(() => {
  const card = document.querySelector('.game-card');
  const timer = document.querySelector('.series-timer');
  if (!card || !timer) return;

  function syncHeartbeat() {
    const active = timer.classList.contains('is-hot') &&
      !timer.classList.contains('is-paused') &&
      !timer.classList.contains('is-expired') &&
      state.status === 'playing';

    card.classList.toggle('timer-heartbeat', active);
  }

  const observer = new MutationObserver(syncHeartbeat);
  observer.observe(timer, {
    attributes: true,
    attributeFilter: ['class'],
  });

  document.addEventListener('visibilitychange', syncHeartbeat);
  syncHeartbeat();
})();