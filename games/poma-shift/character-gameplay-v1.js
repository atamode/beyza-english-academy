(() => {
  const gameCard = document.querySelector('.game-card');
  const canvasNode = document.getElementById('game');
  if (!gameCard || !canvasNode) return;

  const BANDS = [
    { min: 1, max: 9, id: 'poma', name: 'Poma', power: null },
    { min: 10, max: 19, id: 'genius', name: 'Poma Dahi', power: 'computer' },
    { min: 20, max: 29, id: 'influencer', name: 'Influencer Poma', power: 'phone' },
    { min: 30, max: 39, id: 'archer', name: 'Okçu Poma', power: 'arrow' },
    { min: 40, max: 49, id: 'wolf', name: 'Bozkurt Poma', power: 'claw' },
    { min: 50, max: 59, id: 'baby', name: 'Baby Poma', power: 'pacifier' },
    { min: 60, max: 69, id: 'elder', name: 'Dede Poma', power: 'staff' },
    { min: 70, max: 79, id: 'fire', name: 'Fire Poma', power: 'firewave' },
    { min: 80, max: Infinity, id: 'hero', name: 'PomaHero', power: 'leaf' },
  ];

  const POWER_OWNER = {
    computer: 'genius',
    phone: 'influencer',
    arrow: 'archer',
    claw: 'wolf',
    pacifier: 'baby',
    staff: 'elder',
    fire: 'fire',
    firewave: 'fire',
    leaf: 'hero',
  };

  const POWER_LABELS = {
    computer: 'Güvenlik Kalkanı',
    phone: 'Telefon',
    arrow: 'Ok',
    claw: 'Kurt Pençesi',
    pacifier: 'Emzik Salyası',
    staff: 'Asa Gücü',
    fire: 'Alev Dalgası',
    firewave: 'Alev Dalgası',
    leaf: 'Sihirli Yaprak',
  };

  const host = document.createElement('div');
  host.className = 'gameplay-character-host';
  host.innerHTML = `
    <span class="poma-character-portrait gameplay-character-art" aria-hidden="true"></span>
    <span class="gameplay-character-copy"><strong></strong><small></small></span>
  `;
  gameCard.appendChild(host);

  const portraitNode = host.querySelector('.gameplay-character-art');
  const nameNode = host.querySelector('strong');
  const powerNode = host.querySelector('small');

  function characterForLevel(level = state.level) {
    const n = Math.max(1, Number(level || 1));
    return BANDS.find((band) => n >= band.min && n <= band.max) || BANDS[0];
  }

  let activeCharacter = characterForLevel(state.level);

  function renderCharacter(level = state.level) {
    activeCharacter = characterForLevel(level);
    portraitNode.className = `poma-character-portrait gameplay-character-art char-${activeCharacter.id}`;
    nameNode.textContent = activeCharacter.name;
    powerNode.textContent = activeCharacter.power ? POWER_LABELS[activeCharacter.power] : 'Ana karakter';
    host.dataset.character = activeCharacter.id;
    host.dataset.level = String(level);
    syncMood();
  }

  function syncMood() {
    const cloudGap = Number(window.PomaShiftCloudCore?.dangerGap?.() ?? 99);
    host.classList.toggle('is-win', state.status === 'won');
    host.classList.toggle('is-lose', state.status === 'lost');
    host.classList.toggle(
      'is-danger',
      state.status === 'playing' && (cloudGap <= 2 || state.linesTowardShift >= Math.max(0, state.shiftEvery - 1)),
    );
    host.classList.toggle('is-shield-ready', Boolean(window.PomaShiftCloudShield?.active?.()));
  }

  function cardPointFromBoard(col = null, row = null) {
    const board = state.boardRect;
    if (!board) return null;
    const canvasRect = canvasNode.getBoundingClientRect();
    const cardRect = gameCard.getBoundingClientRect();
    const safeCol = Number.isFinite(col) ? Math.max(0, Math.min(currentStage().cols - 1, col)) : (currentStage().cols - 1) / 2;
    const safeRow = Number.isFinite(row) ? Math.max(0, Math.min(currentStage().rows - 1, row)) : Math.min(1, (currentStage().rows - 1) / 2);
    return {
      x: canvasRect.left - cardRect.left + board.x + (safeCol + 0.5) * board.cell,
      y: canvasRect.top - cardRect.top + board.y + (safeRow + 0.5) * board.cell,
    };
  }

  let lastBoardPointer = null;
  canvasNode.addEventListener('pointerdown', (event) => {
    const board = state.boardRect;
    if (!board) return;
    const rect = canvasNode.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    if (x < board.x || y < board.y || x >= board.x + board.w || y >= board.y + board.h) return;
    lastBoardPointer = {
      col: Math.floor((x - board.x) / board.cell),
      row: Math.floor((y - board.y) / board.cell),
      at: performance.now(),
    };
  }, true);

  function targetForPower(power) {
    const recentPointer = lastBoardPointer && performance.now() - lastBoardPointer.at < 1400;
    if (power === 'computer') {
      const cloudEdge = Number(window.PomaShiftCloudCore?.cloudRows?.() || 0);
      return cardPointFromBoard((currentStage().cols - 1) / 2, Math.min(currentStage().rows - 1, cloudEdge));
    }
    if (recentPointer && ['pacifier', 'claw', 'arrow'].includes(power)) {
      return cardPointFromBoard(lastBoardPointer.col, lastBoardPointer.row);
    }
    if (['phone', 'arrow', 'fire', 'firewave'].includes(power)) {
      return cardPointFromBoard((currentStage().cols - 1) / 2, 0);
    }
    return cardPointFromBoard((currentStage().cols - 1) / 2, (currentStage().rows - 1) / 2);
  }

  function playImpact(power, target) {
    if (!target) return;
    const impact = document.createElement('i');
    impact.className = `character-power-impact power-${power}`;
    impact.style.left = `${target.x}px`;
    impact.style.top = `${target.y}px`;
    gameCard.appendChild(impact);
    window.setTimeout(() => impact.remove(), 520);
  }

  function playProjectile(power, target) {
    if (!target) return;
    const cardRect = gameCard.getBoundingClientRect();
    const portraitRect = portraitNode.getBoundingClientRect();
    const startX = portraitRect.left - cardRect.left + portraitRect.width * 0.72;
    const startY = portraitRect.top - cardRect.top + portraitRect.height * 0.58;

    const projectile = document.createElement('i');
    projectile.className = `character-power-projectile power-${power}`;
    projectile.style.left = `${startX}px`;
    projectile.style.top = `${startY}px`;
    projectile.style.setProperty('--fx-x', `${target.x - startX}px`);
    projectile.style.setProperty('--fx-y', `${target.y - startY}px`);
    gameCard.appendChild(projectile);

    window.setTimeout(() => playImpact(power, target), 300);
    window.setTimeout(() => projectile.remove(), 470);
  }

  function playCast(power) {
    if (!power || !state.boardRect) return;
    const normalized = power === 'fire' ? 'firewave' : power;
    const owner = POWER_OWNER[power] || POWER_OWNER[normalized];
    const signature = owner && owner === activeCharacter.id;
    host.classList.remove('is-casting', 'is-signature-cast', 'is-assist-cast');
    host.dataset.power = normalized;
    void host.offsetWidth;
    host.classList.add('is-casting', signature ? 'is-signature-cast' : 'is-assist-cast');
    const target = targetForPower(normalized);
    playProjectile(normalized, target);
    navigator.vibrate?.(signature ? [12, 10, 24] : 12);
    window.setTimeout(() => {
      host.classList.remove('is-casting', 'is-signature-cast', 'is-assist-cast');
    }, signature ? 620 : 480);
  }

  let lastBoosterEventKey = '';
  function watchBoosterEvents() {
    const events = window.PomaShiftMetrics?.export?.() || [];
    for (let index = events.length - 1; index >= 0; index -= 1) {
      const event = events[index];
      if (event.name !== 'booster_used') continue;
      const key = `${event.at}:${event.booster}`;
      if (!lastBoosterEventKey) {
        lastBoosterEventKey = key;
        return;
      }
      if (key !== lastBoosterEventKey) {
        lastBoosterEventKey = key;
        playCast(event.booster);
      }
      return;
    }
  }

  function patchPowerCopy() {
    const boosters = window.PomaShiftMeta?.boosters;
    if (boosters?.computer) {
      boosters.computer.name = 'Güvenlik Kalkanı';
      boosters.computer.description = 'Şeker Bulutu’nun bir sonraki ilerlemesini dijital kalkanla engeller.';
    }
    document.querySelectorAll('.shop-item').forEach((item) => {
      const strong = item.querySelector('strong');
      if (!strong) return;
      if (strong.textContent === 'Bilgisayar' || strong.textContent === 'Güvenlik Kalkanı') {
        strong.textContent = 'Güvenlik Kalkanı';
        const small = item.querySelector('small');
        if (small) small.textContent = 'Şeker Bulutu’nun bir sonraki ilerlemesini dijital kalkanla engeller.';
      }
    });
  }

  const baseSetupLevel = setupLevel;
  setupLevel = function gameplayCharacterSetup(level = state.level) {
    const result = baseSetupLevel(level);
    renderCharacter(Number(level || state.level));
    return result;
  };

  window.addEventListener('poma-shift:cloud-blocked', () => {
    host.classList.remove('is-cloud-block');
    void host.offsetWidth;
    host.classList.add('is-cloud-block');
    window.setTimeout(() => host.classList.remove('is-cloud-block'), 720);
  });

  window.setInterval(() => {
    renderCharacter(state.level);
    syncMood();
    watchBoosterEvents();
    patchPowerCopy();
  }, 180);

  renderCharacter(state.level);
  patchPowerCopy();

  window.PomaShiftGameplayCharacter = {
    bands: BANDS.map((band) => ({ ...band })),
    current: () => ({ ...activeCharacter }),
    cast: playCast,
  };
})();