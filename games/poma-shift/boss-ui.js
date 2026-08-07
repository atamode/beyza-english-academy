(() => {
  const BOSS_LEVEL = 90;
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

  function currentGameState() {
    try {
      return typeof state !== 'undefined' ? state : null;
    } catch {
      return null;
    }
  }

  function modalOpen() {
    const selectors = ['.modal-screen', '.meta-modal', '.meta-ad-overlay', '.loadout-screen'];
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

  function bossLevelFromResult(view) {
    const levelText = view.querySelector('.eyebrow')?.textContent || '';
    const match = levelText.match(/(\d+)/);
    return match ? Number(match[1]) : Number(currentGameState()?.level || 0);
  }

  function makeSugarArt(className, alt = 'Yapışkan Şeker Bulutu') {
    const art = document.createElement('img');
    art.className = className;
    art.src = SUGAR_ART_SRC;
    art.alt = alt;
    art.loading = 'eager';
    art.decoding = 'async';
    return art;
  }

  function decorateBossMap(root = document) {
    const selector = [
      '.meta-level-node[data-meta-level="90"]',
      '.level-node[data-level="90"]',
      '.poma-map-node[data-lobby-level="90"]',
    ].join(', ');

    root.querySelectorAll?.(selector).forEach((node) => {
      node.classList.add('sugar-cloud-boss-node');
      node.querySelector('.poma-boss-cloud')?.remove();

      if (!node.querySelector('.sugar-cloud-map-art')) {
        const art = makeSugarArt('sugar-cloud-map-art');
        art.title = 'Level 90 · Yapışkan Şeker Bulutu Boss';
        if (node.classList.contains('poma-map-node')) art.classList.add('poma-lobby-sugar-cloud');
        node.appendChild(art);
      }

      if (node.classList.contains('poma-map-node') && !node.querySelector('.poma-boss-node-label')) {
        const label = document.createElement('small');
        label.className = 'poma-boss-node-label';
        label.textContent = 'BOSS';
        node.appendChild(label);
        node.setAttribute('aria-label', 'Level 90 Boss · Yapışkan Şeker Bulutu');
      }
    });
  }

  function decorateBossPreparation(root = document) {
    root.querySelectorAll?.('.loadout-card.is-boss').forEach((prep) => {
      if (prep.querySelector('.boss-prep-identity')) return;

      const identity = document.createElement('div');
      identity.className = 'boss-prep-identity';
      identity.appendChild(makeSugarArt('boss-prep-art'));

      const copy = document.createElement('div');
      copy.innerHTML = `
        <small>LEVEL 90 · İLK BOSS</small>
        <strong>Yapışkan Şeker Bulutu</strong>
        <span>Her 3 saniyede bir kareyi yapıştırır.</span>
      `;
      identity.appendChild(copy);

      const title = prep.querySelector('h2');
      if (title) title.insertAdjacentElement('beforebegin', identity);
      else prep.prepend(identity);
    });
  }

  function decorateBossResult(root = document) {
    root.querySelectorAll?.('.result-view').forEach((view) => {
      if (bossLevelFromResult(view) !== BOSS_LEVEL) return;

      // Older boss decorators rendered a second full-size portrait. Keep Poma as
      // the main result hero and show the opponent in one compact boss card.
      view.querySelectorAll(':scope > .sugar-cloud-result-art').forEach((node) => node.remove());
      view.querySelectorAll('.boss-complete-badge').forEach((node) => node.remove());

      let opponent = view.querySelector('.boss-result-opponent');
      if (opponent) return;

      const won = view.classList.contains('win-view');
      opponent = document.createElement('div');
      opponent.className = `boss-result-opponent ${won ? 'is-defeated' : 'is-standing'}`;
      opponent.appendChild(makeSugarArt('boss-result-opponent-art'));

      const copy = document.createElement('div');
      copy.innerHTML = won
        ? '<small>BOSS SONUCU</small><strong>Şeker Bulutu dağıldı!</strong><span>Level 90 tamamlandı.</span>'
        : '<small>BOSS SONUCU</small><strong>Şeker Bulutu hâlâ burada</strong><span>Güçlerini düzenleyip yeniden dene.</span>';
      opponent.appendChild(copy);

      const heading = view.querySelector('h2');
      if (heading) heading.insertAdjacentElement('afterend', opponent);
      else view.appendChild(opponent);
    });
  }

  function decorate(root = document) {
    decorateBossMap(root);
    decorateBossPreparation(root);
    decorateBossResult(root);
  }

  function sync() {
    const gameState = currentGameState();
    const active = Number(gameState?.level) === BOSS_LEVEL && gameState?.status === 'playing';
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

  window.PomaShiftBossUi = {
    level: BOSS_LEVEL,
    decorate,
    sync,
  };
})();
