(() => {
  const params = new URLSearchParams(location.search);
  const nativeApp = Boolean(window.Capacitor?.isNativePlatform?.());
  const localBrowser = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  const enabled = params.has('dev') || (localBrowser && !nativeApp);
  if (!enabled) return;

  const panel = document.createElement('aside');
  panel.className = 'poma-dev-panel is-collapsed';
  panel.innerHTML = `
    <button type="button" class="poma-dev-toggle" data-dev-toggle>DEV</button>
    <div class="poma-dev-body">
      <strong>Poma Shift Test</strong>
      <div class="poma-dev-levels">
        ${[1, 20, 50, 70, 80, 90, 120, 1000, 10000].map(level => `<button type="button" data-dev-level="${level}">${level}</button>`).join('')}
      </div>
      <div class="poma-dev-actions">
        <button type="button" data-dev-unlock>80'e kadar aç</button>
        <button type="button" data-dev-coins>10K Coin</button>
        <button type="button" data-dev-lives>3 Can</button>
        <button type="button" data-dev-metrics>KPI</button>
        <button type="button" data-dev-reset>Meta Reset</button>
      </div>
      <pre data-dev-output>Hazır.</pre>
    </div>
  `;
  document.body.appendChild(panel);

  const output = panel.querySelector('[data-dev-output]');

  function write(value) {
    output.textContent = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
  }

  panel.addEventListener('click', (event) => {
    if (event.target.closest('[data-dev-toggle]')) {
      panel.classList.toggle('is-collapsed');
      return;
    }

    const api = window.PomaShiftMeta?.dev;
    if (!api) {
      write('Dev API henüz hazır değil.');
      return;
    }

    const level = event.target.closest('[data-dev-level]');
    if (level) {
      api.goto(Number(level.dataset.devLevel));
      write(window.PomaShiftMeta.snapshot());
      return;
    }

    if (event.target.closest('[data-dev-unlock]')) {
      api.unlockThrough(80);
      write(window.PomaShiftMeta.snapshot());
      return;
    }
    if (event.target.closest('[data-dev-coins]')) {
      api.setCoins(10000);
      write(window.PomaShiftMeta.snapshot());
      return;
    }
    if (event.target.closest('[data-dev-lives]')) {
      api.setLives(3);
      write(window.PomaShiftMeta.snapshot());
      return;
    }
    if (event.target.closest('[data-dev-metrics]')) {
      write(window.PomaShiftAnalyticsBridge?.summarize?.() || 'Analytics bridge hazır değil.');
      return;
    }
    if (event.target.closest('[data-dev-reset]')) api.resetMeta();
  });
})();
