(() => {
  const params = new URLSearchParams(location.search);
  const nativeApp = Boolean(window.Capacitor?.isNativePlatform?.());
  const nativeQaBuild = Boolean(nativeApp && window.PomaShiftAds?.native && window.PomaShiftAds?.testMode);
  const localBrowser = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  const enabled = params.has('dev') || nativeQaBuild || (localBrowser && !nativeApp);
  if (!enabled) return;

  const panel = document.createElement('aside');
  panel.className = 'poma-dev-panel is-collapsed';
  panel.innerHTML = `
    <button type="button" class="poma-dev-toggle" data-dev-toggle>${nativeQaBuild ? 'QA' : 'DEV'}</button>
    <div class="poma-dev-body">
      <strong>Poma Shift ${nativeQaBuild ? 'Android QA' : 'Test'}</strong>
      <div class="poma-dev-levels">
        ${[1, 10, 11, 20, 30, 40, 50, 60, 70, 80, 90, 120, 10000].map(level => `<button type="button" data-dev-level="${level}">${level}</button>`).join('')}
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

  function snapshot() {
    return window.PomaShiftMeta?.snapshot?.() || {};
  }

  function writeMeta(mutator) {
    const current = snapshot().meta;
    if (!current) return false;
    mutator(current);
    try {
      localStorage.setItem('pomaShift.meta.v1', JSON.stringify(current));
      return true;
    } catch {
      return false;
    }
  }

  function qaGoto(level) {
    const target = Math.max(1, Number(level) || 1);
    if (window.PomaShiftMeta?.dev?.goto) return window.PomaShiftMeta.dev.goto(target);
    setupLevel(target);
    return target;
  }

  function qaUnlockThrough(level) {
    const target = Math.max(1, Number(level) || 1);
    if (window.PomaShiftMeta?.dev?.unlockThrough) return window.PomaShiftMeta.dev.unlockThrough(target);
    try {
      localStorage.setItem('pomaShift.progress.v1', JSON.stringify({ highestUnlocked: target + 1, lastLevel: target }));
    } catch {
      return null;
    }
    setupLevel(target);
    return window.PomaShiftMetrics?.progress?.() || { highestUnlocked: target + 1, lastLevel: target };
  }

  function qaSetCoins(value) {
    if (window.PomaShiftMeta?.dev?.setCoins) return window.PomaShiftMeta.dev.setCoins(value);
    const ok = writeMeta((meta) => { meta.coins = Math.max(0, Math.floor(Number(value) || 0)); });
    if (ok) location.reload();
    return ok;
  }

  function qaSetLives(value) {
    if (window.PomaShiftMeta?.dev?.setLives) return window.PomaShiftMeta.dev.setLives(value);
    const ok = writeMeta((meta) => {
      meta.lives = Math.max(0, Math.min(3, Math.floor(Number(value) || 0)));
      if (meta.lives > 0) meta.lifeReadyAt = 0;
    });
    if (ok) location.reload();
    return ok;
  }

  function qaReset() {
    if (window.PomaShiftMeta?.dev?.resetMeta) return window.PomaShiftMeta.dev.resetMeta();
    localStorage.removeItem('pomaShift.meta.v1');
    localStorage.removeItem('pomaShift.fire.v1');
    localStorage.removeItem('pomaShift.progress.v1');
    location.reload();
  }

  panel.addEventListener('click', (event) => {
    if (event.target.closest('[data-dev-toggle]')) {
      panel.classList.toggle('is-collapsed');
      return;
    }

    const level = event.target.closest('[data-dev-level]');
    if (level) {
      qaGoto(Number(level.dataset.devLevel));
      write(snapshot());
      return;
    }

    if (event.target.closest('[data-dev-unlock]')) {
      qaUnlockThrough(80);
      write(snapshot());
      return;
    }
    if (event.target.closest('[data-dev-coins]')) {
      qaSetCoins(10000);
      return;
    }
    if (event.target.closest('[data-dev-lives]')) {
      qaSetLives(3);
      return;
    }
    if (event.target.closest('[data-dev-metrics]')) {
      write(window.PomaShiftAnalyticsBridge?.summarize?.() || 'Analytics bridge hazır değil.');
      return;
    }
    if (event.target.closest('[data-dev-reset]')) qaReset();
  });
})();
