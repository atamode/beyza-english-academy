(() => {
  const metaApi = window.PomaShiftMeta;
  if (!metaApi?.characters || !metaApi?.boosters) return;

  const characters = metaApi.characters;
  const boosters = metaApi.boosters;

  const milestones = [
    { level: 1, id: 'poma', name: 'Poma', item: null, icon: '🙂', note: 'Başlangıç karakteri' },
    { level: 10, id: 'genius', name: 'Poma Dahi', item: 'computer', icon: '💻', note: 'Bilgisayar' },
    { level: 20, id: 'influencer', name: 'Influencer Poma', item: 'phone', icon: '📱', note: 'Telefon' },
    { level: 30, id: 'archer', name: 'Okçu Poma', item: 'arrow', icon: '🏹', note: 'Ok' },
    { level: 40, id: 'wolf', name: 'Bozkurt Poma', item: 'claw', icon: '🐺', note: 'Kurt Pençesi' },
    { level: 50, id: 'baby', name: 'Baby Poma', item: 'pacifier', icon: '🍼', note: 'Emzik Salyası' },
    { level: 60, id: 'elder', name: 'Dede Poma', item: 'staff', icon: '🪄', note: 'Asa Gücü' },
    { level: 70, id: 'fire', name: 'Fire Poma', item: null, icon: '🔥', note: 'Alev Dalgası' },
    { level: 80, id: 'hero', name: 'PomaHero', item: 'leaf', icon: '🍃', note: 'Sihirli Yaprak' },
  ];

  characters.splice(0, characters.length, ...milestones);

  Object.assign(boosters.computer, { unlockLevel: 10 });
  Object.assign(boosters.phone, { unlockLevel: 20 });
  Object.assign(boosters.arrow, { unlockLevel: 30 });
  Object.assign(boosters.claw, { unlockLevel: 40 });
  Object.assign(boosters.pacifier, { unlockLevel: 50 });
  Object.assign(boosters.staff, { unlockLevel: 60 });
  Object.assign(boosters.leaf, { unlockLevel: 80 });

  const FIRE_LEVEL = 70;
  const FIRE_PRICE = 1800;
  const FIRE_KEY = 'pomaShift.fire.v1';
  const META_KEY = 'pomaShift.meta.v1';
  const PROGRESS_KEY = 'pomaShift.progress.v1';

  const fireState = (() => {
    try {
      const parsed = JSON.parse(localStorage.getItem(FIRE_KEY) || 'null');
      return Object.assign({ unlocked: false, inventory: 0, firstUseGranted: false }, parsed || {});
    } catch {
      return { unlocked: false, inventory: 0, firstUseGranted: false };
    }
  })();

  function saveFire() {
    try {
      localStorage.setItem(FIRE_KEY, JSON.stringify(fireState));
    } catch {
      // Keep gameplay alive if storage is unavailable.
    }
  }

  function highestUnlocked() {
    try {
      const progress = JSON.parse(localStorage.getItem(PROGRESS_KEY) || 'null');
      return Math.max(1, Number(progress?.highestUnlocked || 1));
    } catch {
      return 1;
    }
  }

  function syncFireUnlock() {
    if (highestUnlocked() <= FIRE_LEVEL) return false;
    let changed = false;
    if (!fireState.unlocked) {
      fireState.unlocked = true;
      changed = true;
    }
    if (!fireState.firstUseGranted) {
      fireState.inventory += 1;
      fireState.firstUseGranted = true;
      changed = true;
      try { metric('character_power_unlock', { boosters: ['fire'], level: FIRE_LEVEL }); } catch {}
    }
    if (changed) saveFire();
    return changed;
  }

  function ensureFireButton() {
    const list = document.querySelector('.power-list[data-power-list]');
    if (!list) return;
    syncFireUnlock();
    let button = list.querySelector('[data-use-fire]');
    if (!button) {
      button = document.createElement('button');
      button.type = 'button';
      button.dataset.useFire = '1';
      button.className = 'power-button fire-power-button';
      const leaf = list.querySelector('[data-use-power="leaf"]');
      if (leaf) leaf.insertAdjacentElement('beforebegin', button);
      else list.appendChild(button);
    }
    const unlocked = fireState.unlocked;
    button.disabled = !unlocked;
    button.classList.toggle('locked', !unlocked);
    button.innerHTML = `
      <span>🔥</span>
      <strong>${fireState.inventory}</strong>
      <small>${unlocked ? 'Alev Dalgası' : 'Lv.70'}</small>
    `;
  }

  function ensureFireShopItem() {
    const grid = document.querySelector('.meta-shop .shop-grid');
    if (!grid || grid.querySelector('[data-fire-shop-item]')) return;
    syncFireUnlock();
    const item = document.createElement('article');
    item.dataset.fireShopItem = '1';
    item.className = `shop-item fire-shop-item ${fireState.unlocked ? '' : 'locked'}`;
    item.innerHTML = `
      <span class="shop-icon">🔥</span>
      <div><strong>Alev Dalgası</strong><small>LOFT bölgesindeki ilk 2 satırı tamamen yakar.</small></div>
      <button type="button" data-buy-fire ${fireState.unlocked ? '' : 'disabled'}>${fireState.unlocked ? `${FIRE_PRICE} 🪙` : 'Lv.70'}</button>
    `;
    const leafItem = Array.from(grid.querySelectorAll('.shop-item')).find((node) => node.textContent.includes('Sihirli Yaprak'));
    if (leafItem) leafItem.insertAdjacentElement('beforebegin', item);
    else grid.appendChild(item);
  }

  function topRowsContainBlocks() {
    return Boolean(state?.grid?.slice(0, 2).some((row) => row.some(Boolean)));
  }

  function fireOverlay() {
    const card = document.querySelector('.game-card');
    const board = state?.boardRect;
    if (!card || !board || !canvas) return null;

    const cardRect = card.getBoundingClientRect();
    const canvasRect = canvas.getBoundingClientRect();
    const overlay = document.createElement('div');
    overlay.className = 'fire-wave-overlay';
    overlay.style.left = `${canvasRect.left - cardRect.left + board.x}px`;
    overlay.style.top = `${canvasRect.top - cardRect.top + board.y}px`;
    overlay.style.width = `${board.w}px`;
    overlay.style.height = `${Math.max(board.cell * 2, 48)}px`;
    overlay.innerHTML = `
      <div class="fire-wave-front"></div>
      <div class="fire-wave-glow"></div>
      ${Array.from({ length: 14 }, (_, i) => `<i style="--i:${i}">🔥</i>`).join('')}
      ${Array.from({ length: 18 }, (_, i) => `<b style="--i:${i}"></b>`).join('')}
    `;
    card.appendChild(overlay);
    return overlay;
  }

  function useFire() {
    syncFireUnlock();
    if (!fireState.unlocked || fireState.inventory <= 0 || state?.status !== 'playing') return;
    if (!topRowsContainBlocks()) {
      setMessage('Alev Dalgası için üstteki ilk 2 satırda yakılacak blok yok.');
      return;
    }

    const overlay = fireOverlay();
    fireState.inventory -= 1;
    saveFire();
    ensureFireButton();
    try { metric('booster_used', { booster: 'fire', level: state.level }); } catch {}
    setMessage('🔥 Fire Poma · Alev Dalgası! İlk 2 satır yanıyor.');

    window.setTimeout(() => {
      for (let row = 0; row < Math.min(2, state.grid.length); row += 1) {
        state.grid[row].fill(null);
      }
      render();
    }, 260);

    window.setTimeout(() => overlay?.classList.add('is-ash'), 360);
    window.setTimeout(() => overlay?.remove(), 1050);
  }

  function buyFire() {
    syncFireUnlock();
    if (!fireState.unlocked) return;
    const snapshot = metaApi.snapshot?.();
    const meta = snapshot?.meta;
    if (!meta || Number(meta.coins || 0) < FIRE_PRICE) {
      const button = document.querySelector('[data-buy-fire]');
      if (button) button.textContent = 'Coin yetersiz';
      return;
    }

    meta.coins = Number(meta.coins || 0) - FIRE_PRICE;
    try { localStorage.setItem(META_KEY, JSON.stringify(meta)); } catch { return; }
    fireState.inventory += 1;
    saveFire();
    try { metric('booster_purchase', { booster: 'fire', price: FIRE_PRICE }); } catch {}
    location.reload();
  }

  document.addEventListener('click', (event) => {
    if (event.target.closest('[data-use-fire]')) {
      event.preventDefault();
      event.stopImmediatePropagation();
      useFire();
      return;
    }
    if (event.target.closest('[data-buy-fire]')) {
      event.preventDefault();
      event.stopImmediatePropagation();
      buyFire();
    }
  }, true);

  const observer = new MutationObserver(() => {
    ensureFireButton();
    ensureFireShopItem();
  });
  observer.observe(document.body, { childList: true, subtree: true });

  window.setInterval(() => {
    syncFireUnlock();
    ensureFireButton();
  }, 1000);

  syncFireUnlock();
  ensureFireButton();

  window.PomaShiftCharacterProgression = {
    milestones,
    fire: {
      level: FIRE_LEVEL,
      name: 'Fire Poma',
      power: 'Alev Dalgası',
      description: 'LOFT bölgesindeki ilk 2 satırı tamamen yakar.',
      price: FIRE_PRICE,
      state: fireState,
      use: useFire,
    },
  };
})();
