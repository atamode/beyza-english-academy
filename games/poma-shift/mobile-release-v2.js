(() => {
  const LOADOUT_KEY = 'pomaShift.loadout.v2';
  const shell = document.querySelector('.app-shell');
  const gameCard = document.querySelector('.game-card');
  const canvasNode = document.getElementById('game');
  const toolbar = document.querySelector('.game-toolbar');
  const productModal = document.querySelector('.modal-screen');
  const metaModal = document.querySelector('.meta-modal');
  const isMobile = window.matchMedia?.('(max-width: 700px)')?.matches || Boolean(window.Capacitor?.isNativePlatform?.());

  const POWER_INFO = {
    computer: { icon: '💻', name: 'Bilgisayar' },
    phone: { icon: '📱', name: 'Telefon' },
    arrow: { icon: '🏹', name: 'Ok' },
    claw: { icon: '🐾', name: 'Kurt Pençesi' },
    pacifier: { icon: '🍼', name: 'Emzik Salyası' },
    staff: { icon: '🪄', name: 'Asa Gücü' },
    firewave: { icon: '🔥', name: 'Alev Dalgası' },
    leaf: { icon: '🍃', name: 'Sihirli Yaprak' },
  };

  if (isMobile) document.body.classList.add('poma-mobile-fit');

  function readLoadout() {
    try {
      const parsed = JSON.parse(localStorage.getItem(LOADOUT_KEY) || '[]');
      return Array.isArray(parsed) ? parsed.filter((id) => POWER_INFO[id]).slice(0, 3) : [];
    } catch {
      return [];
    }
  }

  let selected = readLoadout();
  function saveLoadout() {
    try { localStorage.setItem(LOADOUT_KEY, JSON.stringify(selected.slice(0, 3))); } catch {}
  }

  function snapshot() {
    return window.PomaShiftMeta?.snapshot?.()?.meta || { inventory: {}, unlocked: {} };
  }

  function powerQty(id) {
    if (id === 'firewave') return Number(window.PomaShiftFirePower?.quantity?.() || 0);
    return Number(snapshot().inventory?.[id] || 0);
  }

  function powerUnlocked(id) {
    if (id === 'firewave') return Boolean(window.PomaShiftFirePower?.unlocked?.());
    return Boolean(snapshot().unlocked?.[id]);
  }

  function availablePowers() {
    return Object.keys(POWER_INFO).filter((id) => powerUnlocked(id) && powerQty(id) > 0);
  }

  const bar = document.createElement('div');
  bar.className = 'battle-loadout';
  bar.innerHTML = `
    <div class="battle-loadout-label"><strong>GÜÇLER</strong><small>3 slot</small></div>
    <button class="loadout-slot empty" type="button" data-loadout-slot="0">＋</button>
    <button class="loadout-slot empty" type="button" data-loadout-slot="1">＋</button>
    <button class="loadout-slot empty" type="button" data-loadout-slot="2">＋</button>
    <button class="loadout-shop" type="button" data-loadout-shop aria-label="Eşya mağazası">🛒</button>
  `;
  gameCard?.insertAdjacentElement('afterend', bar);

  const picker = document.createElement('div');
  picker.className = 'loadout-screen';
  picker.hidden = true;
  picker.innerHTML = '<div class="loadout-backdrop"></div><section class="loadout-card" data-loadout-card></section>';
  document.body.appendChild(picker);
  const pickerCard = picker.querySelector('[data-loadout-card]');
  let pickerLevel = 0;
  let pickerSelected = [];
  let bossShieldActive = false;

  function openShop() {
    document.querySelector('.meta-strip [data-meta-shop], .power-dock [data-meta-shop]')?.click();
  }

  function setBossPauseShield(active) {
    if (!productModal) return;
    if (active && !bossShieldActive) {
      bossShieldActive = true;
      productModal.dataset.loadoutPause = '1';
      productModal.hidden = false;
      productModal.style.opacity = '0';
      productModal.style.pointerEvents = 'none';
    } else if (!active && bossShieldActive) {
      bossShieldActive = false;
      if (productModal.dataset.loadoutPause === '1') {
        delete productModal.dataset.loadoutPause;
        productModal.hidden = true;
        productModal.style.opacity = '';
        productModal.style.pointerEvents = '';
      }
    }
  }

  function renderBar() {
    for (let index = 0; index < 3; index += 1) {
      const button = bar.querySelector(`[data-loadout-slot="${index}"]`);
      const id = selected[index];
      if (!id) {
        button.className = 'loadout-slot empty';
        button.innerHTML = '＋';
        button.title = 'Güç seç';
        continue;
      }
      const info = POWER_INFO[id];
      const qty = powerQty(id);
      button.className = `loadout-slot ${qty > 0 ? '' : 'out'}`;
      button.innerHTML = `<span>${info.icon}</span><strong>${info.name}</strong><small>${qty}</small>`;
      button.title = `${info.name} · ${qty} adet`;
    }
  }

  function setSelected(next = []) {
    const valid = Array.isArray(next)
      ? next.filter((id) => POWER_INFO[id] && powerUnlocked(id) && powerQty(id) > 0).slice(0, 3)
      : [];
    selected = valid;
    pickerSelected = [...valid];
    saveLoadout();
    renderBar();
    return [...selected];
  }

  function renderPicker() {
    const boss = pickerLevel === 90;
    const available = availablePowers();
    if (!pickerSelected.length && available.length) pickerSelected = available.slice(0, 3);
    pickerSelected = pickerSelected.filter((id) => powerUnlocked(id)).slice(0, 3);

    pickerCard.className = `loadout-card ${boss ? 'is-boss' : ''}`;
    pickerCard.innerHTML = `
      <span class="eyebrow ${boss ? 'danger' : ''}">${boss ? '⚠ ZOR BÖLÜM · BOSS' : 'BÖLÜM HAZIRLIĞI'}</span>
      <h2>${boss ? 'Şeker Bulutu geliyor' : '3 gücünü seç'}</h2>
      <p>${boss ? 'Her 3 saniyede bir kare yapışacak. Başlamadan önce en fazla 3 eşya seç.' : 'Bu bölüm boyunca aşağıdaki 3 slotta yalnız seçtiğin güçleri kullanabilirsin.'}</p>
      <div class="loadout-picker-slots">
        ${[0,1,2].map((i) => {
          const id = pickerSelected[i];
          if (!id) return `<div class="loadout-picker-slot">BOŞ SLOT</div>`;
          const info = POWER_INFO[id];
          return `<div class="loadout-picker-slot selected"><span>${info.icon}</span><strong>${info.name}</strong><small>×${powerQty(id)}</small></div>`;
        }).join('')}
      </div>
      ${available.length ? `
        <div class="loadout-items">
          ${available.map((id) => {
            const info = POWER_INFO[id];
            return `<button type="button" class="loadout-item ${pickerSelected.includes(id) ? 'selected' : ''}" data-picker-power="${id}"><span>${info.icon}</span><strong>${info.name}</strong><small>×${powerQty(id)}</small></button>`;
          }).join('')}
        </div>
      ` : '<div class="loadout-empty-copy">Şu an kullanılabilir eşyan yok. İstersen mağazadan eşya alabilirsin.</div>'}
      <div class="loadout-actions">
        <button type="button" class="shop-before" data-picker-shop>🛒 Eşya al</button>
        <button type="button" data-picker-start>${boss ? 'BOSSA BAŞLA' : 'BU GÜÇLERLE OYNA'}</button>
      </div>
    `;
  }

  function showPicker(level = state.level, { force = false } = {}) {
    if (state.status !== 'playing') return;
    const hasAnything = availablePowers().length > 0;
    if (!force && level !== 90 && !hasAnything) return;
    pickerLevel = Number(level || state.level);
    pickerSelected = selected.filter((id) => powerUnlocked(id) && powerQty(id) > 0).slice(0, 3);
    if (pickerLevel === 90) setBossPauseShield(true);
    renderPicker();
    picker.hidden = false;
  }

  function closePicker({ commit = true } = {}) {
    if (commit) {
      selected = pickerSelected.slice(0, 3);
      saveLoadout();
      renderBar();
    }
    picker.hidden = true;
    setBossPauseShield(false);
  }

  picker.addEventListener('click', (event) => {
    const power = event.target.closest('[data-picker-power]');
    if (power) {
      const id = power.dataset.pickerPower;
      if (pickerSelected.includes(id)) pickerSelected = pickerSelected.filter((item) => item !== id);
      else if (pickerSelected.length < 3) pickerSelected.push(id);
      else {
        navigator.vibrate?.(18);
        return;
      }
      renderPicker();
      return;
    }

    if (event.target.closest('[data-picker-shop]')) {
      picker.hidden = true;
      openShop();
      const watch = window.setInterval(() => {
        if (!metaModal || metaModal.hidden) {
          window.clearInterval(watch);
          renderPicker();
          picker.hidden = false;
        }
      }, 180);
      return;
    }

    if (event.target.closest('[data-picker-start]')) closePicker({ commit: true });
  });

  function useSelectedPower(id) {
    if (!id || powerQty(id) <= 0) {
      showPicker(state.level, { force: true });
      return;
    }
    if (id === 'firewave') {
      window.PomaShiftFirePower?.use?.();
      return;
    }
    const source = document.querySelector(`.power-dock [data-use-power="${id}"]`);
    if (source) source.click();
  }

  bar.addEventListener('click', (event) => {
    if (event.target.closest('[data-loadout-shop]')) {
      openShop();
      return;
    }
    const slot = event.target.closest('[data-loadout-slot]');
    if (!slot) return;
    const index = Number(slot.dataset.loadoutSlot);
    const id = selected[index];
    if (!id) showPicker(state.level, { force: true });
    else useSelectedPower(id);
  });

  const mapButton = toolbar?.querySelector('[data-action="map"]');
  if (mapButton) {
    mapButton.innerHTML = '← <span>Harita</span>';
    mapButton.setAttribute('aria-label', 'Haritaya geri dön');
  }

  function fitViewport() {
    if (!isMobile || !shell || !gameCard || !canvasNode) return;
    const vh = Math.floor(window.visualViewport?.height || window.innerHeight || document.documentElement.clientHeight || 800);
    const style = getComputedStyle(shell);
    const pad = parseFloat(style.paddingTop || 0) + parseFloat(style.paddingBottom || 0);
    const gap = parseFloat(style.rowGap || style.gap || 0) || 0;
    const visible = [...shell.children].filter((node) => node !== gameCard && !node.hidden && getComputedStyle(node).display !== 'none');
    const used = visible.reduce((sum, node) => sum + node.getBoundingClientRect().height, 0);
    const totalGaps = gap * Math.max(0, visible.length);
    const available = Math.floor(vh - pad - used - totalGaps - 2);
    const target = Math.max(270, Math.min(610, available));
    const current = Math.round(canvasNode.getBoundingClientRect().height);
    if (Math.abs(current - target) < 2) return;
    canvasNode.style.height = `${target}px`;
    resizeCanvas();
  }

  let lastDanger = null;
  function syncDanger() {
    const armed = state.status === 'playing' && state.stageIndex < BOARD_STAGES.length - 1 && state.linesTowardShift === state.shiftEvery - 1;
    if (armed === lastDanger) return;
    lastDanger = armed;
    document.body.classList.toggle('danger-armed', armed);
    if (armed) navigator.vibrate?.([18, 35, 18, 35, 28]);
  }

  function morphNotice(before, after) {
    if (!gameCard || before === after) return;
    const notice = document.createElement('div');
    notice.className = 'board-morph-notice';
    notice.innerHTML = `<strong>${before} → ${after}</strong><span>+1 SÜTUN · TAVAN −1 SATIR</span>`;
    gameCard.appendChild(notice);
    navigator.vibrate?.([22, 18, 32]);
    window.setTimeout(() => notice.remove(), 900);
  }

  const basePerformShift = performShift;
  performShift = function releaseMorphFeedback() {
    const before = `${currentStage().cols}×${currentStage().rows}`;
    const beforeStage = state.stageIndex;
    const result = basePerformShift();
    if (state.stageIndex !== beforeStage) morphNotice(before, `${currentStage().cols}×${currentStage().rows}`);
    return result;
  };

  const POWER_EFFECTS = {
    pacifier: ['🍼', 'Emzik Salyası'],
    claw: ['🐾', 'Kurt Pençesi'],
    phone: ['📱', 'Telefon Gücü'],
    arrow: ['🏹', 'Ok Atışı'],
    computer: ['💻', 'Board Koruması'],
    staff: ['🪄', 'Asa Gücü'],
    leaf: ['🍃', 'PomaHero · Sihirli Yaprak'],
  };
  let lastBoosterEvent = '';
  function powerToast(id) {
    const effect = POWER_EFFECTS[id];
    if (!effect || !gameCard) return;
    const toast = document.createElement('div');
    toast.className = 'power-activation-toast';
    toast.innerHTML = `<b>${effect[0]}</b><strong>${effect[1]}</strong>`;
    gameCard.appendChild(toast);
    gameCard.classList.remove('power-impact');
    void gameCard.offsetWidth;
    gameCard.classList.add('power-impact');
    navigator.vibrate?.([15, 12, id === 'leaf' ? 38 : 22]);
    window.setTimeout(() => toast.remove(), 760);
  }

  function watchBoosterEffects() {
    const events = window.PomaShiftMetrics?.export?.() || [];
    for (let i = events.length - 1; i >= 0; i -= 1) {
      const event = events[i];
      if (event.name !== 'booster_used') continue;
      const key = `${event.at}:${event.booster}`;
      if (!lastBoosterEvent) {
        lastBoosterEvent = key;
        return;
      }
      if (key !== lastBoosterEvent) {
        lastBoosterEvent = key;
        if (event.booster !== 'firewave') powerToast(event.booster);
      }
      return;
    }
  }

  let lastSugarEvent = '';
  function sugarCast(event) {
    const hud = gameCard?.querySelector('.boss-hud');
    const icon = hud?.querySelector('.boss-hud-icon');
    if (!hud || !icon || !state.boardRect || !canvasNode) return;
    const cardRect = gameCard.getBoundingClientRect();
    const iconRect = icon.getBoundingClientRect();
    const startX = iconRect.left - cardRect.left + iconRect.width / 2 - 9;
    const startY = iconRect.top - cardRect.top + iconRect.height / 2 - 9;
    const targetX = canvasNode.offsetLeft + state.boardRect.x + (Number(event.col) + .5) * state.boardRect.cell - 9;
    const targetY = canvasNode.offsetTop + state.boardRect.y + (Number(event.row) + .5) * state.boardRect.cell - 9;

    const shot = document.createElement('i');
    shot.className = 'sugar-shot';
    shot.style.left = `${startX}px`;
    shot.style.top = `${startY}px`;
    shot.style.setProperty('--shot-x', `${targetX - startX}px`);
    shot.style.setProperty('--shot-y', `${targetY - startY}px`);
    gameCard.appendChild(shot);

    hud.classList.remove('sugar-casting');
    void hud.offsetWidth;
    hud.classList.add('sugar-casting');
    navigator.vibrate?.(10);

    window.setTimeout(() => {
      const impact = document.createElement('i');
      impact.className = 'sugar-impact';
      impact.style.left = `${targetX}px`;
      impact.style.top = `${targetY}px`;
      gameCard.appendChild(impact);
      window.setTimeout(() => impact.remove(), 450);
    }, 330);
    window.setTimeout(() => shot.remove(), 520);
  }

  function watchSugar() {
    const events = window.PomaShiftMetrics?.export?.() || [];
    for (let i = events.length - 1; i >= 0; i -= 1) {
      const event = events[i];
      if (event.name !== 'sugar_cloud_fill') continue;
      const key = `${event.at}:${event.row}:${event.col}`;
      if (!lastSugarEvent) {
        lastSugarEvent = key;
        return;
      }
      if (key !== lastSugarEvent) {
        lastSugarEvent = key;
        sugarCast(event);
      }
      return;
    }
  }

  let lastPickerLevel = 0;
  const baseSetupLevel = setupLevel;
  setupLevel = function releaseSetupWithLoadout(level = state.level) {
    const result = baseSetupLevel(level);
    const target = Number(level || state.level);
    window.setTimeout(() => {
      renderBar();
      fitViewport();
      const hasPower = availablePowers().length > 0;
      if (target === 90 || (hasPower && target !== lastPickerLevel)) {
        lastPickerLevel = target;
        showPicker(target, { force: target === 90 });
      }
    }, 80);
    return result;
  };

  window.addEventListener('resize', fitViewport);
  window.visualViewport?.addEventListener('resize', fitViewport);
  window.setInterval(() => {
    renderBar();
    syncDanger();
    watchBoosterEffects();
    watchSugar();
  }, 180);
  window.setInterval(fitViewport, 1200);

  renderBar();
  fitViewport();
  window.setTimeout(() => {
    const hasPower = availablePowers().length > 0;
    if (state.level === 90 || hasPower) {
      lastPickerLevel = state.level;
      showPicker(state.level, { force: state.level === 90 });
    }
  }, 350);

  window.PomaShiftLoadout = {
    selected: () => [...selected],
    setSelected,
    open: () => showPicker(state.level, { force: true }),
  };
})();