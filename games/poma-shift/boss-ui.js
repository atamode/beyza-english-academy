(() => {
  const SUGAR_ART_SRC = '../../assets/brand/poma-academy/sugar-cloud.png';
  const card = document.querySelector('.game-card');
  if (!card) return;

  const hud = document.createElement('div');
  hud.className = 'boss-hud';
  hud.hidden = true;
  hud.innerHTML = `
    <div class="boss-hud-icon" aria-hidden="true"><img src="${SUGAR_ART_SRC}" alt="" /></div>
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

  function decorateBossMap(root = document) {
    root.querySelectorAll?.('.meta-level-node[data-meta-level="90"], .level-node[data-level="90"]').forEach((node) => {
      if (node.querySelector('.sugar-cloud-map-art')) return;
      const art = document.createElement('img');
      art.className = 'sugar-cloud-map-art';
      art.src = SUGAR_ART_SRC;
      art.alt = 'Şeker Bulutu';
      art.title = 'Level 90 · Şeker Bulutu Boss';
      node.appendChild(art);
    });
  }

  function decorateBossResult(root = document) {
    root.querySelectorAll?.('.result-view').forEach((view) => {
      if (view.querySelector('.sugar-cloud-result-art')) return;
      const levelText = view.querySelector('.eyebrow')?.textContent || '';
      const match = levelText.match(/(\d+)/);
      const level = match ? Number(match[1]) : Number(window.state?.level || 0);
      if (level !== 90) return;
      const art = document.createElement('img');
      art.className = 'sugar-cloud-result-art';
      art.src = SUGAR_ART_SRC;
      art.alt = 'Şeker Bulutu';
      view.prepend(art);
    });
  }

  function decorate(root = document) {
    decorateBossMap(root);
    decorateBossResult(root);
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

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      mutation.addedNodes.forEach((node) => {
        if (node instanceof Element) decorate(node);
      });
    }
    decorate(document);
  });
  observer.observe(document.body, { childList: true, subtree: true });

  window.setInterval(sync, 150);
  decorate(document);
  sync();
})();
