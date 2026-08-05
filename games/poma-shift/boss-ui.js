(() => {
  const card = document.querySelector('.game-card');
  if (!card) return;

  const hud = document.createElement('div');
  hud.className = 'boss-hud';
  hud.hidden = true;
  hud.innerHTML = `
    <div class="boss-hud-icon" aria-hidden="true">☁️</div>
    <div class="boss-hud-copy">
      <span>BOSS · LEVEL 90</span>
      <strong>Yapışkan Şeker Bulutu</strong>
    </div>
    <div class="boss-hud-timer" aria-label="Şeker Bulutu her 3 saniyede bir kare kapatır">
      <i></i><small>3 sn</small>
    </div>
  `;
  card.appendChild(hud);

  let lastSugarCount = -1;

  function modalOpen() {
    const selectors = ['.modal-screen', '.meta-modal', '.meta-ad-overlay'];
    return selectors.some((selector) => {
      const node = document.querySelector(selector);
      return node && !node.hidden;
    });
  }

  function sugarEventCount() {
    try {
      return window.PomaShiftMetrics?.export?.().filter((event) => event.name === 'sugar_cloud_fill').length || 0;
    } catch {
      return 0;
    }
  }

  function restartPulse() {
    const timer = hud.querySelector('.boss-hud-timer');
    timer.classList.remove('pulse-reset');
    void timer.offsetWidth;
    timer.classList.add('pulse-reset');
  }

  function sync() {
    const active = Number(window.state?.level) === 90 && window.state?.status === 'playing';
    hud.hidden = !active;
    if (!active) return;

    hud.classList.toggle('is-paused', modalOpen());
    const count = sugarEventCount();
    if (count !== lastSugarCount) {
      lastSugarCount = count;
      restartPulse();
    }
  }

  window.setInterval(sync, 150);
  sync();
})();
