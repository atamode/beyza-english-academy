(() => {
  const LOADOUT_KEY = 'pomaShift.loadout.v2';
  const PROGRESS_KEY = 'pomaShift.progress.v1';
  const META_KEY = 'pomaShift.meta.v1';
  const FIRE_KEY = 'pomaShift.fire.v1';
  const CLEAN_MARKER = 'pomaShift.prelaunch-clean.v44';

  const POWERS = [
    { id:'computer', icon:'💻', name:'Bilgisayar', character:'Poma Dahi', characterId:'genius', level:10, price:1100, description:'Board daralmasını 10 hamle boyunca durdurur.' },
    { id:'phone', icon:'📱', name:'Telefon', character:'Influencer Poma', characterId:'influencer', level:20, price:500, description:'LOFT’a en yakın en tehlikeli 3 dolu bloğu temizler.' },
    { id:'arrow', icon:'🏹', name:'Ok', character:'Okçu Poma', characterId:'archer', level:30, price:700, description:'Board üzerindeki en üst 4 dolu bloğu temizler.' },
    { id:'claw', icon:'🐾', name:'Kurt Pençesi', character:'Bozkurt Poma', characterId:'wolf', level:40, price:300, description:'Seçtiğin bloğu ve bitişik 1 dolu bloğu parçalar.' },
    { id:'pacifier', icon:'🍼', name:'Emzik Salyası', character:'Baby Poma', characterId:'baby', level:50, price:100, description:'Seçtiğin 1 dolu bloğu yok eder.' },
    { id:'staff', icon:'🪄', name:'Asa Gücü', character:'Dede Poma', characterId:'elder', level:60, price:1600, description:'Mevcut blokları yeniden oynanabilir bir board düzenine taşır.' },
    { id:'firewave', icon:'🔥', name:'Alev Dalgası', character:'Fire Poma', characterId:'fire', level:70, price:1800, description:'LOFT bölgesindeki ilk 2 satırı tamamen temizler.' },
    { id:'leaf', icon:'🍃', name:'Sihirli Yaprak', character:'PomaHero', characterId:'hero', level:80, price:2000, description:'Board üzerindeki bütün mevcut blokları temizler.' },
  ];

  const MILESTONES = [
    { level:10, characterId:'genius', name:'Poma Dahi' },
    { level:20, characterId:'influencer', name:'Influencer Poma' },
    { level:30, characterId:'archer', name:'Okçu Poma' },
    { level:40, characterId:'wolf', name:'Bozkurt Poma' },
    { level:50, characterId:'baby', name:'Baby Poma' },
    { level:60, characterId:'elder', name:'Dede Poma' },
    { level:70, characterId:'fire', name:'Fire Poma' },
    { level:80, characterId:'hero', name:'PomaHero' },
  ];

  function cleanPrelaunchStateOnce() {
    try {
      if (localStorage.getItem(CLEAN_MARKER) === '1') return;
      localStorage.setItem(PROGRESS_KEY, JSON.stringify({ highestUnlocked:1, lastLevel:1 }));
      localStorage.removeItem(META_KEY);
      localStorage.removeItem(FIRE_KEY);
      localStorage.setItem(LOADOUT_KEY, '[]');
      localStorage.setItem(CLEAN_MARKER, '1');
      try {
        if (typeof state !== 'undefined') {
          state.level = 1;
          state.status = 'lobby';
        }
      } catch {}
    } catch {}
  }
  cleanPrelaunchStateOnce();

  function readProgress() {
    try {
      return JSON.parse(localStorage.getItem(PROGRESS_KEY) || 'null') || { highestUnlocked:1, lastLevel:1 };
    } catch {
      return { highestUnlocked:1, lastLevel:1 };
    }
  }

  function snapshot() {
    return window.PomaShiftMeta?.snapshot?.()?.meta || { coins:0, lives:3, inventory:{}, unlocked:{} };
  }

  function highestPlayable() {
    return Math.max(1, Number(readProgress().highestUnlocked || 1));
  }

  function currentLevel() {
    const progress = readProgress();
    return Math.max(1, Math.min(Number(progress.lastLevel || 1), highestPlayable()));
  }

  function powerQty(id) {
    if (id === 'firewave') return Math.max(0, Number(window.PomaShiftFirePower?.quantity?.() || 0));
    return Math.max(0, Number(snapshot().inventory?.[id] || 0));
  }

  function powerUnlocked(power) {
    if (highestPlayable() >= power.level) return true;
    if (power.id === 'firewave') return Boolean(window.PomaShiftFirePower?.unlocked?.());
    return Boolean(snapshot().unlocked?.[power.id]);
  }

  function readLoadout() {
    try {
      const parsed = JSON.parse(localStorage.getItem(LOADOUT_KEY) || '[]');
      return Array.isArray(parsed) ? parsed.filter((id) => POWERS.some((power) => power.id === id)).slice(0,3) : [];
    } catch {
      return [];
    }
  }

  function saveLoadout(value) {
    try { localStorage.setItem(LOADOUT_KEY, JSON.stringify(value.slice(0,3))); } catch {}
  }

  function characterForLevel(level) {
    if (level < 10) return { characterId:'poma', name:'Poma' };
    let current = MILESTONES[0];
    for (const milestone of MILESTONES) {
      if (level >= milestone.level) current = milestone;
      else break;
    }
    return current;
  }

  function nodeCharacter(level, active) {
    return MILESTONES.find((item) => item.level === level) || (active ? characterForLevel(level) : null);
  }

  const lobby = document.createElement('div');
  lobby.className = 'poma-lobby';
  lobby.innerHTML = `
    <div class="poma-lobby-sky" aria-hidden="true"><i></i><i></i><i></i></div>
    <header class="poma-lobby-topbar">
      <button class="poma-lobby-exit" type="button" data-lobby-exit aria-label="Oyundan çık">×</button>
      <div class="poma-lobby-wallet">
        <span>❤️ <strong data-lobby-lives>3/3</strong></span>
        <span>🪙 <strong data-lobby-coins>0</strong></span>
      </div>
    </header>
    <section class="poma-lobby-map-wrap">
      <div class="poma-lobby-map" data-lobby-map></div>
      <button type="button" class="poma-lobby-play" data-lobby-play>LEVEL <b data-lobby-play-level>1</b> · OYNA</button>
    </section>
    <section class="poma-lobby-loadout">
      <div class="poma-lobby-slots" data-lobby-slots></div>
      <div class="poma-lobby-powers" data-lobby-powers></div>
    </section>
    <div class="poma-lobby-detail" data-lobby-detail hidden></div>
    <div class="poma-lobby-confirm" data-lobby-confirm hidden>
      <div class="poma-lobby-confirm-card">
        <span class="poma-character-portrait char-poma poma-lobby-sad" role="img" aria-label="Üzgün Poma"></span>
        <h2>Oyundan çıkmak istediğine emin misin?</h2>
        <div><button type="button" data-exit-no>HAYIR</button><button type="button" data-exit-yes>EVET</button></div>
      </div>
    </div>
    <div class="poma-lobby-toast" data-lobby-toast hidden></div>
  `;
  document.body.appendChild(lobby);
  document.documentElement.classList.remove('poma-lobby-boot');

  const map = lobby.querySelector('[data-lobby-map]');
  const powers = lobby.querySelector('[data-lobby-powers]');
  const slots = lobby.querySelector('[data-lobby-slots]');
  const detail = lobby.querySelector('[data-lobby-detail]');
  const confirm = lobby.querySelector('[data-lobby-confirm]');
  const toast = lobby.querySelector('[data-lobby-toast]');
  const playButton = lobby.querySelector('[data-lobby-play]');

  let selected = readLoadout();
  let selectedLevel = currentLevel();

  function portraitMarkup(characterId, extra='') {
    return `<span class="poma-character-portrait char-${characterId} ${extra}" aria-hidden="true"></span>`;
  }

  function renderStatus() {
    const meta = snapshot();
    lobby.querySelector('[data-lobby-lives]').textContent = `${Number(meta.lives ?? 3)}/3`;
    lobby.querySelector('[data-lobby-coins]').textContent = String(Number(meta.coins || 0));
  }

  function levelsToRender(current) {
    if (current <= 180) return Array.from({ length:Math.max(90,current + 12) }, (_,i) => i + 1);
    const first = Array.from({ length:90 }, (_,i) => i + 1);
    const tailStart = Math.max(91,current - 45);
    const tail = Array.from({ length:current + 15 - tailStart + 1 }, (_,i) => tailStart + i);
    return [...first,'gap',...tail];
  }

  function renderMap({ animate=false }={}) {
    const highest = highestPlayable();
    const current = currentLevel();
    if (!selectedLevel || selectedLevel > highest) selectedLevel = current;
    const displayLevels = levelsToRender(current).reverse();

    map.innerHTML = `
      <div class="poma-map-road" aria-hidden="true"></div>
      ${displayLevels.map((level,index) => {
        if (level === 'gap') return '<div class="poma-map-gap">•••</div>';
        const locked = level > highest;
        const complete = level < highest;
        const active = level === current;
        const chosen = level === selectedLevel;
        const boss = level === 90;
        const character = nodeCharacter(level,active);
        return `
          <button type="button" class="poma-map-node ${locked?'locked':''} ${complete?'complete':''} ${active?'active':''} ${chosen?'selected':''} ${boss?'boss':''} side-${index%4}" data-lobby-level="${level}" ${locked?'aria-disabled="true"':''}>
            <span>${complete?'✓':level}</span>
            ${character ? portraitMarkup(character.characterId,'poma-lobby-node-character') : ''}
            ${boss ? '<b class="poma-boss-cloud">☁️</b>' : ''}
          </button>`;
      }).join('')}
    `;

    lobby.querySelector('[data-lobby-play-level]').textContent = String(selectedLevel);
    playButton.disabled = selectedLevel > highest;
    playButton.classList.toggle('locked',selectedLevel > highest);

    const activeNode = map.querySelector('.poma-map-node.active');
    if (!activeNode) return;
    const targetTop = () => Math.max(0,activeNode.offsetTop - (map.clientHeight / 2) + (activeNode.offsetHeight / 2));
    if (animate) {
      map.scrollTop = map.scrollHeight;
      window.setTimeout(() => map.scrollTo({ top:targetTop(), behavior:'smooth' }),180);
    } else {
      map.scrollTop = targetTop();
    }
  }

  function powerState(power) {
    const unlocked = powerUnlocked(power);
    const qty = powerQty(power.id);
    if (!unlocked) return { unlocked,qty,label:`🔒 Lv${power.level}` };
    if (qty > 0) return { unlocked,qty,label:`×${qty}` };
    return { unlocked,qty,label:`${power.price} 🪙` };
  }

  function renderPowers() {
    powers.innerHTML = POWERS.map((power) => {
      const info = powerState(power);
      const equipped = selected.includes(power.id);
      return `<button type="button" class="poma-power-mini ${info.unlocked?'':'locked'} ${equipped?'equipped':''}" data-lobby-power="${power.id}" aria-label="${power.name}"><span>${power.icon}</span><strong>${info.label}</strong></button>`;
    }).join('');
  }

  function renderSlots() {
    slots.innerHTML = [0,1,2].map((index) => {
      const id = selected[index];
      const power = POWERS.find((item) => item.id === id);
      if (!power) return `<button type="button" class="poma-lobby-slot empty" data-lobby-slot="${index}"><span>＋</span></button>`;
      return `<button type="button" class="poma-lobby-slot" data-lobby-slot="${index}" title="${power.name}"><span>${power.icon}</span><small>×${powerQty(power.id)}</small></button>`;
    }).join('');
  }

  function showToast(message) {
    toast.textContent = message;
    toast.hidden = false;
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => { toast.hidden = true; },1300);
  }

  function openDetail(power) {
    const info = powerState(power);
    const equipped = selected.includes(power.id);
    detail.innerHTML = `
      <div class="poma-lobby-detail-backdrop" data-detail-close></div>
      <section class="poma-lobby-detail-card">
        <button type="button" class="poma-detail-close" data-detail-close>×</button>
        <div class="poma-detail-hero">${portraitMarkup(power.characterId,'poma-detail-character')}<span>${power.icon}</span></div>
        <small>${info.unlocked?'AÇIK':`LEVEL ${power.level}’DE AÇILIR`}</small>
        <h2>${power.name}</h2>
        <strong>${power.character}</strong>
        <p>${power.description}</p>
        <div class="poma-detail-state">${info.unlocked ? (info.qty>0 ? `Stok: ×${info.qty}` : `Fiyat: ${power.price} Coin`) : `Bu güç Level ${power.level}’de kullanıma açılır.`}</div>
        <div class="poma-detail-actions">
          ${info.unlocked && info.qty>0 ? `<button type="button" data-detail-slot="${power.id}">${equipped?'SLOTTAN ÇIKAR':'SLOTA EKLE'}</button>` : ''}
          ${info.unlocked ? `<button type="button" class="buy" data-detail-buy="${power.id}">${power.price} 🪙 · SATIN AL</button>` : ''}
        </div>
      </section>`;
    detail.hidden = false;
  }

  function closeDetail() {
    detail.hidden = true;
    detail.innerHTML = '';
  }

  function toggleSlot(id) {
    const power = POWERS.find((item) => item.id === id);
    if (!power || !powerUnlocked(power) || powerQty(id) <= 0) return;
    if (selected.includes(id)) selected = selected.filter((item) => item !== id);
    else if (selected.length < 3) selected.push(id);
    else {
      showToast('3 slot dolu. Önce bir slotu boşalt.');
      return;
    }
    saveLoadout(selected);
    renderSlots();
    renderPowers();
    openDetail(power);
  }

  function hiddenShopBuy(power) {
    if (!powerUnlocked(power)) return;
    const shopOpen = document.querySelector('.meta-strip [data-meta-shop], .power-dock [data-meta-shop]');
    if (!shopOpen) {
      showToast('Mağaza hazırlanıyor. Bir saniye sonra tekrar dene.');
      return;
    }
    shopOpen.click();
    window.setTimeout(() => {
      const selector = power.id === 'firewave' ? '[data-buy-fire]' : `[data-buy-booster="${power.id}"]`;
      const buy = document.querySelector(selector);
      if (!buy || buy.disabled) {
        document.querySelector('.meta-modal [data-meta-close]')?.click();
        showToast('Coin yetersiz veya ürün kullanılamıyor.');
        return;
      }
      const before = powerQty(power.id);
      buy.click();
      window.setTimeout(() => {
        document.querySelector('.meta-modal [data-meta-close]')?.click();
        renderStatus();renderPowers();renderSlots();
        if (!detail.hidden) openDetail(power);
        if (powerQty(power.id) > before) showToast(`${power.icon} ×1 stoğa eklendi`);
      },80);
    },60);
  }

  function syncRuntimePickerThenClose(done) {
    const api = window.PomaShiftLoadout;
    if (typeof api?.open !== 'function') { done(); return; }
    api.open();
    window.setTimeout(() => {
      const wanted = new Set(selected);
      const buttons = [...document.querySelectorAll('.loadout-item[data-picker-power]')];
      buttons.filter((button) => button.classList.contains('selected') && !wanted.has(button.dataset.pickerPower)).forEach((button) => button.click());
      buttons.filter((button) => !button.classList.contains('selected') && wanted.has(button.dataset.pickerPower)).forEach((button) => button.click());
      document.querySelector('[data-picker-start]')?.click();
      done();
    },20);
  }

  function closeLobbyForGame() {
    document.body.classList.remove('poma-lobby-open');
    lobby.hidden = true;
    window.PomaShiftLobbyActive = false;
    document.dispatchEvent(new CustomEvent('poma:lobby-state',{ detail:{ open:false } }));
  }

  function playSelectedLevel() {
    const highest = highestPlayable();
    if (selectedLevel > highest) {
      showToast(`Level ${selectedLevel} henüz kilitli.`);
      return;
    }
    playButton.disabled = true;
    saveLoadout(selected);
    try {
      setupLevel(selectedLevel);
    } catch {
      playButton.disabled = false;
      showToast('Level açılamadı.');
      return;
    }
    window.setTimeout(() => syncRuntimePickerThenClose(() => {
      closeLobbyForGame();
      playButton.disabled = false;
    }),110);
  }

  function openLobby({ animate=true }={}) {
    window.PomaShiftLobbyActive = true;
    document.body.classList.add('poma-lobby-open');
    lobby.hidden = false;
    closeDetail();
    confirm.hidden = true;
    selected = readLoadout();
    selectedLevel = currentLevel();
    try { if (typeof state !== 'undefined' && state.status === 'playing') state.status = 'lobby'; } catch {}
    document.dispatchEvent(new CustomEvent('poma:lobby-state',{ detail:{ open:true } }));
    renderStatus();renderSlots();renderPowers();renderMap({ animate });
  }

  map.addEventListener('click',(event) => {
    const node = event.target.closest('[data-lobby-level]');
    if (!node) return;
    const level = Number(node.dataset.lobbyLevel || 1);
    if (level > highestPlayable()) {
      showToast(`Level ${level} henüz kilitli.`);
      return;
    }
    selectedLevel = level;
    map.querySelectorAll('.poma-map-node.selected').forEach((item) => item.classList.remove('selected'));
    node.classList.add('selected');
    lobby.querySelector('[data-lobby-play-level]').textContent = String(selectedLevel);
  });

  powers.addEventListener('click',(event) => {
    const button = event.target.closest('[data-lobby-power]');
    if (!button) return;
    const power = POWERS.find((item) => item.id === button.dataset.lobbyPower);
    if (power) openDetail(power);
  });

  slots.addEventListener('click',(event) => {
    const slot = event.target.closest('[data-lobby-slot]');
    if (!slot) return;
    const id = selected[Number(slot.dataset.lobbySlot)];
    if (!id) { showToast('Aşağıdaki güçlerden birini seç.'); return; }
    selected = selected.filter((item) => item !== id);
    saveLoadout(selected);renderSlots();renderPowers();
  });

  detail.addEventListener('click',(event) => {
    if (event.target.closest('[data-detail-close]')) { closeDetail(); return; }
    const slot = event.target.closest('[data-detail-slot]');
    if (slot) { toggleSlot(slot.dataset.detailSlot); return; }
    const buy = event.target.closest('[data-detail-buy]');
    if (buy) {
      const power = POWERS.find((item) => item.id === buy.dataset.detailBuy);
      if (power) hiddenShopBuy(power);
    }
  });

  playButton.addEventListener('click',playSelectedLevel);
  lobby.querySelector('[data-lobby-exit]').addEventListener('click',() => { confirm.hidden = false; });
  confirm.addEventListener('click',(event) => {
    if (event.target.closest('[data-exit-no]')) { confirm.hidden = true; return; }
    if (!event.target.closest('[data-exit-yes]')) return;
    try {
      const exitApp = window.Capacitor?.Plugins?.App?.exitApp;
      if (typeof exitApp === 'function') { exitApp(); return; }
    } catch {}
    try {
      if (window.Capacitor?.isNativePlatform?.()) { window.history.back(); return; }
      window.location.href = '../../';
    } catch { window.close(); }
  });

  document.addEventListener('click',(event) => {
    if (!event.target.closest('[data-action="map"]')) return;
    event.preventDefault();event.stopPropagation();
    openLobby({ animate:false });
  },true);

  window.PomaShiftLobby = { open:openLobby, selected:() => [...selected] };
  openLobby({ animate:true });
})();
