(() => {
  const DRAG_LIFT = 62;
  const card = document.querySelector('.game-card');
  const gameCanvas = document.getElementById('game');
  const fxLayer = document.createElement('div');
  fxLayer.className = 'game-fx-layer';
  fxLayer.setAttribute('aria-hidden', 'true');
  fxLayer.innerHTML = '<div class="shift-badge"><strong>SHIFT!</strong><span></span></div><div class="line-burst"></div>';
  card.appendChild(fxLayer);

  const shiftBadge = fxLayer.querySelector('.shift-badge');
  const shiftBoard = shiftBadge.querySelector('span');

  function replayClass(element, className, duration = 320) {
    element.classList.remove(className);
    void element.offsetWidth;
    element.classList.add(className);
    window.setTimeout(() => element.classList.remove(className), duration);
  }

  function haptic(pattern) {
    if (navigator.vibrate) navigator.vibrate(pattern);
  }

  let inputUnlockAt = 0;
  let inputUnlockTimer = 0;

  function releaseInputWhenReady() {
    const remaining = inputUnlockAt - performance.now();
    if (remaining > 4) {
      inputUnlockTimer = window.setTimeout(releaseInputWhenReady, remaining);
      return;
    }
    gameCanvas.style.pointerEvents = '';
  }

  function briefInputLock(ms) {
    inputUnlockAt = Math.max(inputUnlockAt, performance.now() + ms);
    gameCanvas.style.pointerEvents = 'none';
    window.clearTimeout(inputUnlockTimer);
    inputUnlockTimer = window.setTimeout(releaseInputWhenReady, Math.max(0, inputUnlockAt - performance.now()));
  }

  const baseBoardCellFromPoint = boardCellFromPoint;
  boardCellFromPoint = function liftedBoardCellFromPoint(x, y, piece) {
    return baseBoardCellFromPoint(x, y - DRAG_LIFT, piece);
  };

  const baseDrawDraggedPiece = drawDraggedPiece;
  drawDraggedPiece = function liftedDrawDraggedPiece() {
    if (!state.drag) return;
    const originalY = state.drag.y;
    state.drag.y -= DRAG_LIFT;
    baseDrawDraggedPiece();
    state.drag.y = originalY;
  };

  const baseRandomPiece = randomPiece;
  randomPiece = function tunedRandomPiece() {
    const easyLimit = state.level <= 1 ? 6 : state.level === 2 ? 8 : 11;
    const hardStart = 11;
    const useHard = state.level >= 4 && Math.random() < state.hardChance;
    const pool = useHard
      ? Array.from({ length: SHAPES.length - hardStart }, (_, i) => i + hardStart)
      : Array.from({ length: Math.min(easyLimit, hardStart) }, (_, i) => i);

    if (!pool.length) return baseRandomPiece();

    let shapeIndex = pool[Math.floor(Math.random() * pool.length)];
    if (pool.length > 1 && shapeIndex === state.lastShapeIndex) {
      const currentIndex = pool.indexOf(shapeIndex);
      shapeIndex = pool[(currentIndex + 1 + Math.floor(Math.random() * (pool.length - 1))) % pool.length];
    }
    state.lastShapeIndex = shapeIndex;

    return {
      id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
      shapeIndex,
      cells: SHAPES[shapeIndex].map(([x, y]) => [x, y]),
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      used: false,
    };
  };

  const baseRefillTray = refillTray;
  refillTray = function fairRefillTray() {
    baseRefillTray();
    if (state.status !== 'playing' || state.tray.some(anyPlacementFor)) return;

    for (let attempt = 0; attempt < 48; attempt += 1) {
      const candidate = randomPiece();
      if (!anyPlacementFor(candidate)) continue;
      const slot = Math.floor(Math.random() * state.tray.length);
      state.tray[slot] = candidate;
      metric('fairness_adjustment', { slot, safeShape: candidate.shapeIndex, attempt: attempt + 1 });
      return;
    }
  };

  function playLineClear(cleared) {
    fxLayer.dataset.lines = String(cleared);
    replayClass(card, 'line-clear-fx', 300);
    replayClass(fxLayer, 'line-clear-active', 300);
    haptic(cleared > 1 ? [18, 18, 22, 16, 18] : [16, 16, 20]);
    briefInputLock(120);
  }

  function playShift(from, to) {
    shiftBoard.textContent = `${from.cols}×${from.rows} → ${to.cols}×${to.rows}`;
    replayClass(card, 'shift-fx', 480);
    replayClass(fxLayer, 'shift-active', 480);
    haptic([30, 18, 45, 16, 28]);
    briefInputLock(340);
  }

  function playInvalid() {
    replayClass(card, 'invalid-fx', 190);
    haptic([9, 8, 9]);
  }

  const basePerformShift = performShift;
  performShift = function animatedPerformShift() {
    const from = { ...currentStage() };
    const beforeShifts = state.shiftsDone;
    basePerformShift();
    if (state.shiftsDone > beforeShifts && state.status !== 'lost') {
      playShift(from, { ...currentStage() });
    }
  };

  const baseClearLines = clearLines;
  clearLines = function animatedClearLines() {
    const beforeLines = state.linesCleared;
    baseClearLines();
    const cleared = state.linesCleared - beforeLines;
    if (cleared > 0) playLineClear(cleared);
  };

  let invalidBefore = 0;
  gameCanvas.addEventListener('pointerdown', () => {
    invalidBefore = state.invalidDrops;
  }, true);
  gameCanvas.addEventListener('pointerup', () => {
    window.setTimeout(() => {
      if (state.invalidDrops > invalidBefore) playInvalid();
    }, 0);
  });

  const tunedHardChance = [0, 0, 0, 0.02, 0.04, 0.06, 0.08, 0.10, 0.12, 0.18];
  for (let level = 1; level <= 10; level += 1) {
    if (LEVEL_PRESETS[level]) LEVEL_PRESETS[level].hardChance = tunedHardChance[level - 1];
  }

  setupLevel(state.level);
})();