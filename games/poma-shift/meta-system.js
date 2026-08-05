(() => {
  const MAX_LIVES = 3;
  const RETURN_GIFT_MS = 12 * 60 * 60 * 1000;
  const SUGAR_INTERVAL_MS = 3000;
  const FIRST_BOSS_LEVEL = 90;
  const BOSS_STEP = 30;
  const MAX_CONTINUE_ADS_PER_LEVEL = 5;
  const SUGAR_COLOR = '#ff8fc8';

  const META_KEYS = {
    economy: 'pomaShift.meta.v1',
  };

  const CHARACTERS = [
    { level: 10, id: 'poma', name: 'Poma', item: null, icon: '🙂', note: 'Atkısız başlangıç Poma' },
    { level: 20, id: 'genius', name: 'Poma Dahi', item: 'computer', icon: '💻', note: 'Bilgisayar' },
    { level: 30, id: 'influencer', name: 'Influencer Poma', item: 'phone', icon: '📱', note: 'Telefon' },
    { level: 40, id: 'archer', name: 'Okçu Poma', item: 'arrow', icon: '🏹', note: 'Ok' },
    { level: 50, id: 'wolf', name: 'Bozkurt Poma', item: 'claw', icon: '🐺', note: 'Kurt Pençesi' },
    { level: 60, id: 'baby', name: 'Baby Poma', item: 'pacifier', icon: '🍼', note: 'Emzik Salyası' },
    { level: 70, id: 'elder', name: 'Dede Poma', item: 'staff', icon: '🪄', note: 'Asa Gücü' },
    { level: 80, id: 'hero', name: 'Hero Poma', item: 'leaf', icon: '🍃', note: 'Sihirli Yaprak' },
  ];

  const BOOSTERS = {
    pacifier: {
      name: 'Emzik Salyası', icon: '🍼', price: 100, unlockLevel: 60,
      description: 'Seçtiğin 1 dolu kareyi siler.', targeted: true,
    },
    claw: {
      name: 'Kurt Pençesi', icon: '🐾', price: 300, unlockLevel: 50,
      description: 'Seçtiğin kareyi ve bitişik 1 dolu kareyi siler.', targeted: true,
    },
    phone: {
      name: 'Telefon', icon: '📱', price: 500, unlockLevel: 30,
      description: 'Üst bölgelerdeki en tehlikeli 3 dolu kareyi siler.',
    },
    arrow: {
      name: 'Ok', icon: '🏹', price: 700, unlockLevel: 40,
      description: 'Board üzerindeki en üst 4 dolu kareyi temizler.',
    },
    computer: {
      name: 'Bilgisayar', icon: '💻', price: 1100, unlockLevel: 20,
      description: 'Board daralmasını 10 hamle boyunca durdurur.',
    },
    staff: {
      name: 'Asa Gücü', icon: '🪄', price: 1600, unlockLevel: 70,
      description: 'Mevcut blokları yeniden oynanabilir bir board düzenine taşır.',
    },
    leaf: {
      name: 'Sihirli Yaprak', icon: '🍃', price: 2000, unlockLevel: 80,
      description: 'Board üzerindeki bütün mevcut blokları temizler.',
    },
  };

  const GIFT_WEIGHTS = {
    pacifier: 40,
    phone: 25,
    arrow: 15,
    computer: 10,
    staff: 7,
    claw: 2,
    leaf: 1,
  };

  const PACK_ITEMS = ['pacifier', 'claw', 'phone', 'arrow', 'computer', 'staff'];
  const PACK_PRICE = 3500;

  const runtime = {
    freezeMoves: 0,
    pendingPower: null,
    sugarTimer: 0,
    lastFailReason: 'unknown',
    levelFirstClear: true,
    interstitialPending: false,
    lifeChargedForAttempt: false,
  };

  function safeMetaRead() {
    try {
      const parsed = JSON.parse(localStorage.getItem(META_KEYS.economy) || 'null');
      return parsed && typeof parsed === 'object' ? parsed : null;
    } catch {
      return null;
    }
  }

  function localDayKey(date = new Date()) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  function freshMeta() {
    return {
      coins: 0,
      lives: MAX_LIVES,
      dayKey: localDayKey(),
      depletionCountToday: 0,
      lifeReadyAt: 0,
      returnGiftReadyAt: Date.now() + RETURN_GIFT_MS,
      inventory: Object.fromEntries(Object.keys(BOOSTERS).map((id) => [id, 0])),
      unlocked: Object.fromEntries(Object.keys(BOOSTERS).map((id) => [id, false])),
      continueAdsByLevel: {},
      rewardedAds: 0,
      interstitialAds: 0,
    };
  }

  const meta = Object.assign(freshMeta(), safeMetaRead() || {});
  meta.inventory = Object.assign(freshMeta().inventory, meta.inventory || {});
  meta.unlocked = Object.assign(freshMeta().unlocked, meta.unlocked || {});
  meta.continueAdsByLevel = meta.continueAdsByLevel || {};

  function saveMeta() {
    try {
      localStorage.setItem(META_KEYS.economy, JSON.stringify(meta));
    } catch {
      // Keep gameplay alive if storage is unavailable.
    }
  }

  function formatCountdown(ms) {
    const total = Math.max(0, Math.ceil(ms / 1000));
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    if (h) return `${h}s ${String(m).padStart(2, '0')}dk`;
    if (m) return `${m}:${String(s).padStart(2, '0')}`;
    return `0:${String(s).padStart(2, '0')}`;
  }

  function refreshDailyState() {
    const today = localDayKey();
    if (meta.dayKey === today) return;
    meta.dayKey = today;
    meta.depletionCountToday = 0;
    saveMeta();
  }

  function refreshLifeTimer() {
    refreshDailyState();
    if (meta.lives !== 0 || !meta.lifeReadyAt || Date.now() < meta.lifeReadyAt) return false;
    meta.lives = 1;
    meta.lifeReadyAt = 0;
    saveMeta();
    return true;
  }

  function lifeWaitMsForNextDepletion() {
    if (meta.depletionCountToday <= 1) return 60 * 1000;
    if (meta.depletionCountToday === 2) return 15 * 60 * 1000;
    return 30 * 60 * 1000;
  }

  function consumeLife() {
    refreshLifeTimer();
    if (meta.lives > 0) meta.lives -= 1;
    if (meta.lives === 0 && !meta.lifeReadyAt) {
      meta.depletionCountToday += 1;
      meta.lifeReadyAt = Date.now() + lifeWaitMsForNextDepletion();
    }
    saveMeta();
    syncMetaUi();
  }

  function grantLife(count = 1) {
    refreshLifeTimer();
    const before = meta.lives;
    meta.lives = Math.min(MAX_LIVES, meta.lives + count);
    if (before === 0 && meta.lives > 0) meta.lifeReadyAt = 0;
    saveMeta();
    syncMetaUi();
    return meta.lives - before;
  }

  function isBossLevel(level) {
    return level >= FIRST_BOSS_LEVEL && (level - FIRST_BOSS_LEVEL) % BOSS_STEP === 0;
  }

  const baseLevelConfig = levelConfig;
  levelConfig = function scalableLevelConfig(level) {
    if (level <= 10) return baseLevelConfig(level);

    const wave = Math.floor((level - 11) / 30);
    const slot = (level - 11) % 30;
    const startPattern = [0, 0, 1, 0, 2, 0, 1, 0, 3, 0];
    let startStage = startPattern[(slot + wave) % startPattern.length];
    if (isBossLevel(level)) startStage = Math.max(1, Math.min(3, startStage + 1));

    const wavePressure = Math.min(4, Math.floor(wave / 8));
    const slotPressure = Math.floor(slot / 6);
    let targetShifts = 4 + slotPressure + wavePressure;
    if (level === 11) targetShifts = 4;
    if (isBossLevel(level)) targetShifts += 2;
    targetShifts = Math.max(4, Math.min(12, targetShifts));

    const hardChance = Math.min(0.58, 0.18 + slot * 0.006 + Math.log10(level + 1) * 0.055);
    return { startStage, targetShifts, shiftEvery: 3, hardChance };
  };

  function isSugarBoss(level) {
    return level === FIRST_BOSS_LEVEL;
  }

  function isHardLevel(level) {
    if (isBossLevel(level)) return false;
    return level === 11 || (level >= 15 && level % 5 === 0);
  }

  function coinRewardFor(level) {
    if (isBossLevel(level)) return 20;
    if (isHardLevel(level)) return 10;
    return 5;
  }

  function syncUnlocks({ grantFirstUse = true } = {}) {
    const highest = Math.max(1, getProgress().highestUnlocked || 1);
    const newUnlocks = [];
    CHARACTERS.forEach((character) => {
      if (!character.item || highest <= character.level || meta.unlocked[character.item]) return;
      meta.unlocked[character.item] = true;
      if (grantFirstUse) meta.inventory[character.item] += 1;
      newUnlocks.push(character.item);
    });
    if (newUnlocks.length) saveMeta();
    return newUnlocks;
  }

  function weightedUnlockedGift() {
    const entries = Object.entries(GIFT_WEIGHTS)
      .filter(([id]) => meta.unlocked[id])
      .map(([id, weight]) => ({ id, weight }));
    const total = entries.reduce((sum, item) => sum + item.weight, 0);
    if (!total) return null;
    let roll = Math.random() * total;
    for (const item of entries) {
      roll -= item.weight;
      if (roll <= 0) return item.id;
    }
    return entries[entries.length - 1].id;
  }

  function claimReturnGift() {
    if (Date.now() < meta.returnGiftReadyAt) return null;
    const item = weightedUnlockedGift();
    meta.coins += 100;
    if (item) meta.inventory[item] += 1;
    meta.returnGiftReadyAt = Date.now() + RETURN_GIFT_MS;
    saveMeta();
    metric('return_gift_claimed', { coins: 100, item: item || null });
    syncMetaUi();
    return item;
  }

  function unlockedCharacterForLevel(level) {
    return CHARACTERS.find((character) => character.level === level) || null;
  }

  function ensureAdAdapter() {
    if (window.PomaShiftAds?.rewarded && window.PomaShiftAds?.interstitial) return window.PomaShiftAds;

    window.PomaShiftAds = {
      testMode: true,
      rewarded: async (placement = 'rewarded') => {
        metric('ad_request', { format: 'rewarded', placement, provider: 'test_stub' });
        await showTestAd('ÖDÜLLÜ REKLAM', placement);
        meta.rewardedAds += 1;
        saveMeta();
        metric('ad_complete', { format: 'rewarded', placement, provider: 'test_stub' });
        return true;
      },
      interstitial: async (placement = 'level_complete') => {
        metric('ad_request', { format: 'interstitial', placement, provider: 'test_stub' });
        await showTestAd('GEÇİŞ REKLAMI', placement);
        meta.interstitialAds += 1;
        saveMeta();
        metric('ad_complete', { format: 'interstitial', placement, provider: 'test_stub' });
        return true;
      },
    };
    return window.PomaShiftAds;
  }

  let adOverlay = null;
  function showTestAd(title, placement) {
    return new Promise((resolve) => {
      if (!adOverlay) {
        adOverlay = document.createElement('div');
        adOverlay.className = 'meta-ad-overlay';
        document.body.appendChild(adOverlay);
      }
      adOverlay.innerHTML = `
        <div class="meta-ad-card">
          <span class="eyebrow">TEST MODE</span>
          <h2>${title}</h2>
          <p>${placement}</p>
          <strong data-ad-count>1</strong>
          <small>Gerçek reklam SDK'sı bağlandığında bu test ekranı devre dışı kalır.</small>
        </div>
      `;
      adOverlay.hidden = false;
      let remaining = 1;
      const count = adOverlay.querySelector('[data-ad-count]');
      const timer = window.setInterval(() => {
        remaining -= 1;
        if (remaining > 0) {
          count.textContent = String(remaining);
          return;
        }
        window.clearInterval(timer);
        adOverlay.hidden = true;
        resolve(true);
      }, 700);
    });
  }

  const ads = ensureAdAdapter();

  const toolbar = document.querySelector('.game-toolbar');
  const gameCard = document.querySelector('.game-card');
  const productModal = document.querySelector('.modal-screen');
  const productModalContent = document.querySelector('[data-modal-content]');

  const metaStrip = document.createElement('div');
  metaStrip.className = 'meta-strip';
  metaStrip.innerHTML = `
    <button type="button" class="meta-pill" data-meta-shop><span>🪙</span><strong data-meta-coins>0</strong></button>
    <button type="button" class="meta-pill" data-meta-lives><span>❤️</span><strong data-meta-life-count>3/3</strong><small data-meta-life-timer></small></button>
    <button type="button" class="meta-pill gift-pill" data-meta-gift><span>🎁</span><strong>12 SAAT</strong><small data-meta-gift-timer></small></button>
  `;
  if (toolbar) toolbar.insertAdjacentElement('afterend', metaStrip);
  else gameCard?.insertAdjacentElement('beforebegin', metaStrip);

  const powerDock = document.createElement('div');
  powerDock.className = 'power-dock';
  powerDock.innerHTML = `
    <div class="power-dock-head"><span>Karakter Güçleri</span><button type="button" data-meta-shop>MAĞAZA</button></div>
    <div class="power-list" data-power-list></div>
  `;
  gameCard?.insertAdjacentElement('afterend', powerDock);

  const metaModal = document.createElement('div');
  metaModal.className = 'meta-modal';
  metaModal.hidden = true;
  metaModal.innerHTML = `
    <div class="meta-modal-backdrop" data-meta-close></div>
    <section class="meta-modal-card" role="dialog" aria-modal="true">
      <button class="meta-modal-close" type="button" data-meta-close>×</button>
      <div data-meta-modal-content></div>
    </section>
  `;
  document.body.appendChild(metaModal);
  const metaModalContent = metaModal.querySelector('[data-meta-modal-content]');

  function showMetaModal(markup, { closable = true } = {}) {
    metaModalContent.innerHTML = markup;
    metaModal.hidden = false;
    metaModal.classList.toggle('no-close', !closable);
    metaModal.querySelector('.meta-modal-close').hidden = !closable;
  }

  function hideMetaModal() {
    if (metaModal.classList.contains('no-close')) return;
    metaModal.hidden = true;
    metaModalContent.innerHTML = '';
  }

  function renderPowerDock() {
    const list = powerDock.querySelector('[data-power-list]');
    if (!list) return;
    list.innerHTML = Object.entries(BOOSTERS).map(([id, booster]) => {
      const unlocked = Boolean(meta.unlocked[id]);
      const qty = meta.inventory[id] || 0;
      const active = runtime.pendingPower === id;
      return `
        <button type="button" class="power-button ${unlocked ? '' : 'locked'} ${active ? 'active' : ''}" data-use-power="${id}" ${unlocked ? '' : 'disabled'}>
          <span>${booster.icon}</span>
          <strong>${qty}</strong>
          <small>${unlocked ? booster.name : `Lv.${booster.unlockLevel}`}</small>
        </button>
      `;
    }).join('');
  }

  function syncMetaUi() {
    refreshLifeTimer();
    const coins = metaStrip.querySelector('[data-meta-coins]');
    const lives = metaStrip.querySelector('[data-meta-life-count]');
    const lifeTimer = metaStrip.querySelector('[data-meta-life-timer]');
    const giftTimer = metaStrip.querySelector('[data-meta-gift-timer]');
    if (coins) coins.textContent = String(meta.coins);
    if (lives) lives.textContent = `${meta.lives}/${MAX_LIVES}`;
    if (lifeTimer) {
      lifeTimer.textContent = meta.lives === 0 && meta.lifeReadyAt
        ? formatCountdown(meta.lifeReadyAt - Date.now())
        : '';
    }
    if (giftTimer) {
      giftTimer.textContent = Date.now() >= meta.returnGiftReadyAt
        ? 'HAZIR'
        : formatCountdown(meta.returnGiftReadyAt - Date.now());
    }
    metaStrip.querySelector('[data-meta-gift]')?.classList.toggle('is-ready', Date.now() >= meta.returnGiftReadyAt);
    renderPowerDock();
  }

  function showShop() {
    const packUnlocked = Boolean(meta.unlocked.staff);
    showMetaModal(`
      <div class="meta-shop">
        <span class="eyebrow">POMA SHIFT</span>
        <h2>Güç Mağazası</h2>
        <p class="wallet-line">🪙 <strong>${meta.coins} Poma Coin</strong></p>
        <div class="shop-grid">
          ${Object.entries(BOOSTERS).map(([id, booster]) => {
            const unlocked = Boolean(meta.unlocked[id]);
            return `
              <article class="shop-item ${unlocked ? '' : 'locked'}">
                <span class="shop-icon">${booster.icon}</span>
                <div><strong>${booster.name}</strong><small>${booster.description}</small></div>
                <button type="button" data-buy-booster="${id}" ${unlocked ? '' : 'disabled'}>${unlocked ? `${booster.price} 🪙` : `Lv.${booster.unlockLevel}`}</button>
              </article>
            `;
          }).join('')}
        </div>
        <article class="pack-card ${packUnlocked ? '' : 'locked'}">
          <div><span>🎁</span><strong>Poma Güç Paketi</strong><small>Yaprak hariç 6 gücün her birinden 1 adet.</small></div>
          <button type="button" data-buy-pack ${packUnlocked ? '' : 'disabled'}>${packUnlocked ? `${PACK_PRICE} 🪙` : 'Lv.70'}</button>
        </article>
        <div class="life-shop">
          <strong>Can</strong>
          <button type="button" data-buy-life="1">+1 ❤️ · 100 🪙</button>
          <button type="button" data-buy-life="3">+3 ❤️ · 250 🪙</button>
          <button type="button" data-watch-life>Reklam izle · +1 ❤️</button>
        </div>
      </div>
    `);
  }

  function showLives() {
    refreshLifeTimer();
    showMetaModal(`
      <div class="life-panel">
        <span class="eyebrow">CAN</span>
        <h2>${meta.lives}/${MAX_LIVES} ❤️</h2>
        <p>${meta.lives === 0 && meta.lifeReadyAt ? `Ücretsiz can: ${formatCountdown(meta.lifeReadyAt - Date.now())}` : 'Can yalnız başarısız level sonunda azalır.'}</p>
        <button class="primary-action" type="button" data-watch-life>Reklam izle → +1 Can</button>
        <div class="life-buy-row">
          <button type="button" data-buy-life="1">100 🪙 → +1</button>
          <button type="button" data-buy-life="3">250 🪙 → +3</button>
        </div>
      </div>
    `);
  }

  function showGift() {
    if (Date.now() < meta.returnGiftReadyAt) {
      showMetaModal(`
        <div class="gift-panel"><span class="eyebrow">12 SAATLİK POMA HEDİYESİ</span><h2>Henüz hazır değil</h2><p>${formatCountdown(meta.returnGiftReadyAt - Date.now())}</p></div>
      `);
      return;
    }
    const item = claimReturnGift();
    showMetaModal(`
      <div class="gift-panel">
        <span class="eyebrow">12 SAATLİK POMA HEDİYESİ</span>
        <h2>+100 🪙</h2>
        <p>${item ? `${BOOSTERS[item].icon} ${BOOSTERS[item].name} ×1` : 'Henüz açılmış karakter eşyası olmadığı için bu kez yalnız Coin kazandın.'}</p>
      </div>
    `);
  }

  function buyLife(count) {
    refreshLifeTimer();
    if (meta.lives >= MAX_LIVES) return false;
    const price = count === 3 ? 250 : 100;
    if (meta.coins < price) return false;
    meta.coins -= price;
    grantLife(count);
    metric('life_purchase', { count, price });
    saveMeta();
    syncMetaUi();
    return true;
  }

  async function watchLifeAd() {
    if (meta.lives >= MAX_LIVES) return;
    const watched = await ads.rewarded('life');
    if (!watched) return;
    grantLife(1);
    metric('life_rewarded_ad', { lives: meta.lives });
  }

  function buyBooster(id) {
    const booster = BOOSTERS[id];
    if (!booster || !meta.unlocked[id] || meta.coins < booster.price) return false;
    meta.coins -= booster.price;
    meta.inventory[id] += 1;
    saveMeta();
    metric('booster_purchase', { booster: id, price: booster.price });
    syncMetaUi();
    return true;
  }

  function buyPack() {
    if (!meta.unlocked.staff || meta.coins < PACK_PRICE) return false;
    meta.coins -= PACK_PRICE;
    PACK_ITEMS.forEach((id) => { meta.inventory[id] += 1; });
    saveMeta();
    metric('booster_pack_purchase', { price: PACK_PRICE, items: PACK_ITEMS });
    syncMetaUi();
    return true;
  }

  function hideProductModal() {
    if (!productModal) return;
    productModal.hidden = true;
    productModal.classList.remove('no-close');
    if (productModalContent) productModalContent.innerHTML = '';
  }

  function updateMoveHudManual() {
    const moveValue = document.getElementById('moveValue');
    if (!moveValue) return;
    const config = levelConfig(state.level);
    const limit = 18 + Math.max(0, config.targetShifts - 1) * 14 + config.startStage * 2;
    moveValue.textContent = `${state.moves}/${limit}`;
  }

  function filledCells() {
    const cells = [];
    state.grid.forEach((row, r) => row.forEach((value, c) => {
      if (value) cells.push({ row: r, col: c, value });
    }));
    return cells;
  }

  function consumeInventory(id) {
    if ((meta.inventory[id] || 0) <= 0) return false;
    meta.inventory[id] -= 1;
    saveMeta();
    metric('booster_used', { booster: id, level: state.level });
    syncMetaUi();
    return true;
  }

  function removeTopCells(count) {
    const cells = filledCells().sort((a, b) => a.row - b.row || Math.random() - 0.5).slice(0, count);
    cells.forEach(({ row, col }) => { state.grid[row][col] = null; });
    render();
    return cells.length;
  }

  function reshuffleBoard() {
    const blocks = filledCells().map((cell) => cell.value);
    const { cols, rows } = currentStage();
    state.grid = makeGrid(cols, rows);

    const positions = [];
    for (let row = rows - 1; row >= 0; row -= 1) {
      const colsInRow = Array.from({ length: cols }, (_, col) => col).sort(() => Math.random() - 0.5);
      colsInRow.slice(0, Math.max(1, cols - 1)).forEach((col) => positions.push({ row, col }));
    }

    const maxSafe = positions.length;
    blocks.slice(0, maxSafe).forEach((value, index) => {
      const position = positions[index];
      state.grid[position.row][position.col] = value;
    });
    render();
  }

  function activateImmediatePower(id) {
    if (state.status !== 'playing' || !meta.unlocked[id] || (meta.inventory[id] || 0) <= 0) return;
    let changed = false;
    if (id === 'phone') changed = removeTopCells(3) > 0;
    if (id === 'arrow') changed = removeTopCells(4) > 0;
    if (id === 'computer') {
      runtime.freezeMoves = 10;
      changed = true;
      setMessage('Bilgisayar aktif: board daralması 10 hamle durdu.');
    }
    if (id === 'staff') {
      reshuffleBoard();
      changed = true;
      setMessage('Asa Gücü: board yeniden düzenlendi.');
    }
    if (id === 'leaf') {
      const count = filledCells().length;
      state.grid = makeGrid(currentStage().cols, currentStage().rows);
      render();
      changed = count > 0;
      if (changed) setMessage('Sihirli Yaprak bütün boardu temizledi.');
    }
    if (!changed) return;
    consumeInventory(id);
  }

  function beginTargetPower(id) {
    if (state.status !== 'playing' || !meta.unlocked[id] || (meta.inventory[id] || 0) <= 0) return;
    runtime.pendingPower = runtime.pendingPower === id ? null : id;
    setMessage(runtime.pendingPower ? `${BOOSTERS[id].name}: dolu bir kare seç.` : 'Güç seçimi iptal edildi.');
    syncMetaUi();
  }

  function boardCellAtEvent(event) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const board = state.boardRect;
    if (!board || x < board.x || y < board.y || x >= board.x + board.w || y >= board.y + board.h) return null;
    return {
      col: Math.floor((x - board.x) / board.cell),
      row: Math.floor((y - board.y) / board.cell),
    };
  }

  canvas.addEventListener('pointerdown', (event) => {
    if (!runtime.pendingPower || state.status !== 'playing') return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const cell = boardCellAtEvent(event);
    if (!cell || !state.grid[cell.row]?.[cell.col]) {
      setMessage('Bu güç için dolu bir kare seç.');
      return;
    }

    const id = runtime.pendingPower;
    if (id === 'pacifier') {
      state.grid[cell.row][cell.col] = null;
    } else if (id === 'claw') {
      const neighbors = [
        { row: cell.row - 1, col: cell.col },
        { row: cell.row, col: cell.col - 1 },
        { row: cell.row, col: cell.col + 1 },
        { row: cell.row + 1, col: cell.col },
      ].filter((candidate) => state.grid[candidate.row]?.[candidate.col]);
      if (!neighbors.length) {
        setMessage('Kurt Pençesi için seçilen karenin yanında dolu bir kare olmalı.');
        return;
      }
      neighbors.sort((a, b) => a.row - b.row);
      state.grid[cell.row][cell.col] = null;
      state.grid[neighbors[0].row][neighbors[0].col] = null;
    }

    runtime.pendingPower = null;
    consumeInventory(id);
    render();
  }, true);

  powerDock.addEventListener('click', (event) => {
    const button = event.target.closest('[data-use-power]');
    if (!button) return;
    const id = button.dataset.usePower;
    if (!meta.unlocked[id]) return;
    if ((meta.inventory[id] || 0) <= 0) {
      showShop();
      return;
    }
    if (BOOSTERS[id].targeted) beginTargetPower(id);
    else activateImmediatePower(id);
  });

  const basePerformShift = performShift;
  performShift = function metaPerformShift() {
    if (runtime.freezeMoves > 0) {
      state.shiftsDone += 1;
      state.score += 250;
      metric('shift', {
        stage: state.stageIndex,
        board: `${currentStage().cols}x${currentStage().rows}`,
        shiftsDone: state.shiftsDone,
        boardFrozen: true,
        freezeMovesRemaining: runtime.freezeMoves,
      });
      setMessage(`Bilgisayar koruması: board sabit (${runtime.freezeMoves} hamle).`);
      checkWin();
      return;
    }
    return basePerformShift();
  };

  const basePlacePiece = placePiece;
  placePiece = function metaPlacePiece(piece, col, row) {
    const before = state.moves;
    const result = basePlacePiece(piece, col, row);
    if (result && state.moves > before && runtime.freezeMoves > 0) {
      runtime.freezeMoves = Math.max(0, runtime.freezeMoves - 1);
      if (runtime.freezeMoves === 0 && state.status === 'playing') setMessage('Bilgisayar koruması bitti.');
    }
    return result;
  };

  function stopSugarCloud() {
    window.clearInterval(runtime.sugarTimer);
    runtime.sugarTimer = 0;
  }

  function candidateSugarCells() {
    const candidates = [];
    state.grid.forEach((row, r) => row.forEach((value, c) => {
      if (!value) candidates.push({ row: r, col: c });
    }));
    return candidates;
  }

  function dropSugarCell() {
    if (!isSugarBoss(state.level) || state.status !== 'playing' || document.hidden) return;
    if (productModal && !productModal.hidden) return;
    const candidates = candidateSugarCells();
    if (!candidates.length) {
      lose('Şeker Bulutu boardu tamamen kapladı.', 'sugar_full');
      return;
    }

    const nonCeiling = candidates.filter((cell) => cell.row > 0);
    const pool = nonCeiling.length ? nonCeiling : candidates;
    const chosen = pool[Math.floor(Math.random() * pool.length)];
    state.grid[chosen.row][chosen.col] = SUGAR_COLOR;
    metric('sugar_cloud_fill', { row: chosen.row, col: chosen.col });
    setMessage('Şeker Bulutu bir kareyi yapıştırdı!');
    render();

    if (chosen.row === 0) lose('Şeker Bulutu tavana ulaştı.', 'sugar_ceiling');
  }

  function startSugarCloud() {
    stopSugarCloud();
    if (!isSugarBoss(state.level)) return;
    runtime.sugarTimer = window.setInterval(dropSugarCell, SUGAR_INTERVAL_MS);
    setMessage('☁️ Şeker Bulutu aktif: her 3 saniyede 1 kare kapatır.');
    metric('boss_start', { boss: 'sticky_sugar_cloud', intervalMs: SUGAR_INTERVAL_MS });
  }

  const baseDrawBlock = drawBlock;
  drawBlock = function metaDrawBlock(x, y, size, color, alpha = 1) {
    baseDrawBlock(x, y, size, color, alpha);
    if (color !== SUGAR_COLOR) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#fff2fa';
    ctx.font = `700 ${Math.max(9, Math.floor(size * 0.32))}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('✦', x + size / 2, y + size / 2);
    ctx.restore();
  };

  const baseLose = lose;
  lose = function metaLose(reason, reasonCode = 'unknown') {
    if (state.status === 'lost') return;
    runtime.lastFailReason = reasonCode;
    stopSugarCloud();
    if (!runtime.lifeChargedForAttempt) {
      consumeLife();
      runtime.lifeChargedForAttempt = true;
      metric('life_consumed', { lives: meta.lives, reason: reasonCode });
    } else {
      metric('continued_attempt_failed', { lives: meta.lives, reason: reasonCode });
    }
    return baseLose(reason, reasonCode);
  };

  async function rewardedContinue() {
    const key = String(state.level);
    const used = Number(meta.continueAdsByLevel[key] || 0);
    if (used >= MAX_CONTINUE_ADS_PER_LEVEL) return;
    const watched = await ads.rewarded('continue');
    if (!watched) return;

    meta.continueAdsByLevel[key] = used + 1;
    saveMeta();
    state.status = 'playing';
    state.moves = Math.max(0, state.moves - 3);

    if (runtime.lastFailReason === 'no_legal_move') refillTray();

    hideProductModal();
    updateMoveHudManual();
    setMessage(`Reklam devamı: +3 hamle (${meta.continueAdsByLevel[key]}/${MAX_CONTINUE_ADS_PER_LEVEL}).`);
    metric('continue_rewarded', { count: meta.continueAdsByLevel[key], extraMoves: 3 });
    if (isSugarBoss(state.level)) startSugarCloud();
    render();
  }

  function decorateFailModal() {
    if (!productModalContent) return;
    const fail = productModalContent.querySelector('.fail-view');
    if (!fail || fail.querySelector('[data-meta-continue]')) return;
    const used = Number(meta.continueAdsByLevel[String(state.level)] || 0);
    if (used < MAX_CONTINUE_ADS_PER_LEVEL) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'continue-ad-action';
      button.dataset.metaContinue = '1';
      button.textContent = `🎬 Reklam İzle · +3 Hamle (${used}/${MAX_CONTINUE_ADS_PER_LEVEL})`;
      fail.querySelector('.primary-action')?.insertAdjacentElement('beforebegin', button);
    }
    const life = document.createElement('p');
    life.className = 'fail-life-line';
    life.textContent = `❤️ ${meta.lives}/${MAX_LIVES}`;
    fail.appendChild(life);
  }

  function decorateWinModal() {
    if (!productModalContent) return;
    const win = productModalContent.querySelector('.win-view');
    if (!win || win.querySelector('.coin-win-line')) return;
    const reward = runtime.levelFirstClear ? coinRewardFor(state.level) : 0;
    const line = document.createElement('p');
    line.className = 'coin-win-line';
    line.textContent = reward ? `+${reward} 🪙 Poma Coin` : 'Tekrar tamamlandı · Coin ödülü ilk tamamlamada verilir.';
    win.querySelector('h2')?.insertAdjacentElement('afterend', line);

    const milestone = runtime.levelFirstClear ? unlockedCharacterForLevel(state.level) : null;
    if (milestone) {
      const badge = document.createElement('div');
      badge.className = 'unlock-badge';
      badge.innerHTML = `<span>${milestone.icon}</span><div><strong>${milestone.name}</strong><small>${milestone.item ? `${milestone.note} açıldı · ilk kullanım ücretsiz` : milestone.note}</small></div>`;
      line.insertAdjacentElement('afterend', badge);
    }
    if (isBossLevel(state.level)) {
      const boss = document.createElement('div');
      boss.className = 'boss-complete-badge';
      boss.textContent = state.level === 90 ? '☁️ İlk Şeker Bulutu bossu tamamlandı' : '👑 Boss slotu tamamlandı';
      line.insertAdjacentElement('afterend', boss);
    }
  }

  function decorateMap() {
    if (!productModalContent) return;
    const nodes = productModalContent.querySelectorAll('.level-node[data-level]');
    if (!nodes.length) return;
    nodes.forEach((node) => {
      if (node.querySelector('.meta-map-marker')) return;
      const level = Number(node.dataset.level);
      const character = CHARACTERS.find((item) => item.level === level);
      const boss = isBossLevel(level);
      if (!character && !boss) return;
      const marker = document.createElement('b');
      marker.className = 'meta-map-marker';
      marker.textContent = character ? character.icon : level === 90 ? '☁️' : '👑';
      marker.title = character ? `${character.name} · ${character.note}` : level === 90 ? 'Yapışkan Şeker Bulutu' : 'Gelecek boss slotu';
      node.appendChild(marker);
      if (boss) node.classList.add('boss-node');
      if (character) node.classList.add('character-node');
    });
  }

  if (productModalContent) {
    const observer = new MutationObserver(() => {
      decorateFailModal();
      decorateWinModal();
      decorateMap();
    });
    observer.observe(productModalContent, { childList: true, subtree: true });
  }

  document.addEventListener('click', (event) => {
    const continueButton = event.target.closest('[data-meta-continue]');
    if (continueButton) {
      event.preventDefault();
      event.stopImmediatePropagation();
      rewardedContinue();
      return;
    }

    const retry = event.target.closest('[data-retry]');
    if (retry && meta.lives <= 0) {
      event.preventDefault();
      event.stopImmediatePropagation();
      showLives();
      return;
    }
  }, true);

  const baseCheckWin = checkWin;
  checkWin = function metaCheckWin() {
    const wasPlaying = state.status === 'playing';
    const result = baseCheckWin();
    if (!wasPlaying || state.status !== 'won') return result;

    stopSugarCloud();
    if (runtime.levelFirstClear) {
      const reward = coinRewardFor(state.level);
      meta.coins += reward;
      metric('coin_reward', { reward, kind: isBossLevel(state.level) ? 'boss' : isHardLevel(state.level) ? 'hard' : 'normal' });
    }
    delete meta.continueAdsByLevel[String(state.level)];
    const newUnlocks = syncUnlocks();
    if (newUnlocks.length) metric('character_power_unlock', { boosters: newUnlocks });
    saveMeta();
    syncMetaUi();
    return result;
  };

  const baseSetupLevel = setupLevel;
  setupLevel = function metaSetupLevel(level = state.level) {
    refreshLifeTimer();
    const target = Math.max(1, Number(level) || 1);
    const movingForwardAfterWin = state.status === 'won' && target === state.level + 1;

    if ((state.status === 'lost' || state.status === 'blocked') && target === state.level && meta.lives <= 0) {
      showLives();
      return undefined;
    }

    if (movingForwardAfterWin && state.level >= 5 && !runtime.interstitialPending) {
      runtime.interstitialPending = true;
      ads.interstitial('level_complete').finally(() => {
        runtime.interstitialPending = false;
        baseSetupLevel(target);
        afterLevelSetup(target);
      });
      return undefined;
    }

    const result = baseSetupLevel(target);
    afterLevelSetup(target);
    return result;
  };

  function afterLevelSetup(level) {
    stopSugarCloud();
    runtime.freezeMoves = 0;
    runtime.pendingPower = null;
    runtime.lastFailReason = 'unknown';
    runtime.levelFirstClear = (getProgress().highestUnlocked || 1) <= level;
    runtime.lifeChargedForAttempt = false;
    syncUnlocks();
    syncMetaUi();
    if (isSugarBoss(level)) startSugarCloud();
    if (meta.lives <= 0) {
      state.status = 'blocked';
      showLives();
    }
  }

  function mapNodeMarkup(level, highest, current) {
    const locked = level > highest;
    const complete = level < highest;
    const active = level === current;
    const character = CHARACTERS.find((item) => item.level === level);
    const boss = isBossLevel(level);
    const marker = character ? character.icon : boss ? (level === 90 ? '☁️' : '👑') : '';
    const label = character ? `${character.name} · ${character.note}` : boss ? (level === 90 ? 'Yapışkan Şeker Bulutu' : 'Gelecek boss slotu') : '';
    return `
      <button class="meta-level-node ${locked ? 'locked' : ''} ${complete ? 'complete' : ''} ${active ? 'active' : ''} ${boss ? 'boss' : ''}"
        type="button" data-meta-level="${level}" ${locked ? 'disabled' : ''}>
        <span>${complete ? '✓' : level}</span>
        ${marker ? `<b title="${label}">${marker}</b>` : ''}
      </button>
    `;
  }

  function showLongMap(centerLevel = state.level) {
    const progress = getProgress();
    const highest = Math.max(1, progress.highestUnlocked || 1);
    const center = Math.max(1, Number(centerLevel) || state.level);
    const start = Math.max(1, center - 25);
    const end = Math.max(60, Math.min(Math.max(highest + 15, center + 35), center + 60));
    const nodes = [];
    for (let level = end; level >= start; level -= 1) nodes.push(mapNodeMarkup(level, highest, state.level));

    showMetaModal(`
      <div class="meta-map">
        <span class="eyebrow">POMA SHIFT</span>
        <h2>Level Yolu</h2>
        <p>Motor binlerce level üretir. Harita performans için mevcut konumunun çevresini gösterir.</p>
        <div class="meta-map-nav">
          <button type="button" data-map-center="${Math.max(1, center - 50)}">−50</button>
          <strong>${start}–${end}</strong>
          <button type="button" data-map-center="${center + 50}">+50</button>
        </div>
        <div class="meta-level-path">${nodes.join('')}</div>
      </div>
    `);
    requestAnimationFrame(() => metaModalContent.querySelector('.meta-level-node.active')?.scrollIntoView({ block: 'center' }));
  }

  const originalMapButton = toolbar?.querySelector('[data-action="map"]');
  originalMapButton?.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();
    showLongMap(state.level);
  }, true);

  metaStrip.addEventListener('click', (event) => {
    if (event.target.closest('[data-meta-shop]')) showShop();
    if (event.target.closest('[data-meta-lives]')) showLives();
    if (event.target.closest('[data-meta-gift]')) showGift();
  });

  powerDock.addEventListener('click', (event) => {
    if (event.target.closest('[data-meta-shop]')) showShop();
  });

  metaModal.addEventListener('click', async (event) => {
    const mapLevel = event.target.closest('[data-meta-level]');
    if (mapLevel) {
      const level = Number(mapLevel.dataset.metaLevel);
      if (Number.isFinite(level) && level <= (getProgress().highestUnlocked || 1)) {
        metaModal.hidden = true;
        metaModalContent.innerHTML = '';
        setupLevel(level);
      }
      return;
    }

    const mapCenter = event.target.closest('[data-map-center]');
    if (mapCenter) {
      showLongMap(Number(mapCenter.dataset.mapCenter) || state.level);
      return;
    }

    if (event.target.closest('[data-meta-close]') && !metaModal.classList.contains('no-close')) {
      hideMetaModal();
      return;
    }

    const buy = event.target.closest('[data-buy-booster]');
    if (buy) {
      const ok = buyBooster(buy.dataset.buyBooster);
      if (!ok) buy.textContent = meta.coins < BOOSTERS[buy.dataset.buyBooster].price ? 'Coin yetersiz' : 'Kilitli';
      else showShop();
      return;
    }

    if (event.target.closest('[data-buy-pack]')) {
      const ok = buyPack();
      if (ok) showShop();
      return;
    }

    const life = event.target.closest('[data-buy-life]');
    if (life) {
      buyLife(Number(life.dataset.buyLife));
      showLives();
      return;
    }

    if (event.target.closest('[data-watch-life]')) {
      await watchLifeAd();
      showLives();
    }
  });

  window.setInterval(syncMetaUi, 1000);

  refreshDailyState();
  refreshLifeTimer();
  syncUnlocks();
  runtime.levelFirstClear = (getProgress().highestUnlocked || 1) <= state.level;
  syncMetaUi();
  if (isSugarBoss(state.level) && state.status === 'playing') startSugarCloud();
  if (meta.lives <= 0 && state.status === 'playing') {
    state.status = 'blocked';
    showLives();
  }

  const devEnabled = location.hostname === 'localhost' || location.hostname === '127.0.0.1' || new URLSearchParams(location.search).has('dev');

  window.PomaShiftMeta = {
    snapshot() {
      return JSON.parse(JSON.stringify({ meta, runtime: { ...runtime, sugarTimer: Boolean(runtime.sugarTimer) } }));
    },
    characters: CHARACTERS,
    boosters: BOOSTERS,
    isBossLevel,
    claimReturnGift,
    dev: devEnabled ? {
      goto(level) {
        setupLevel(Math.max(1, Number(level) || 1));
      },
      unlockThrough(level) {
        const target = Math.max(1, Number(level) || 1);
        safeWrite(STORAGE_KEYS.progress, { highestUnlocked: target + 1, lastLevel: target });
        syncUnlocks();
        syncMetaUi();
        return getProgress();
      },
      setCoins(value) {
        meta.coins = Math.max(0, Math.floor(Number(value) || 0));
        saveMeta();
        syncMetaUi();
      },
      setLives(value) {
        meta.lives = Math.max(0, Math.min(MAX_LIVES, Math.floor(Number(value) || 0)));
        if (meta.lives > 0) meta.lifeReadyAt = 0;
        saveMeta();
        syncMetaUi();
      },
      resetMeta() {
        localStorage.removeItem(META_KEYS.economy);
        location.reload();
      },
    } : null,
  };
})();
