(() => {
  // Mobile-safe layout with a stable cell size per level.
  // Critical design rule: a SHIFT must physically widen the board and physically lower its height.
  // Re-scaling cells after every morph would hide the core mechanic, so the cell size is locked
  // using the largest board dimensions reachable in the current level.
  const BOARD_TOP = 68;
  const TRAY_GAP = 18;
  const TRAY_HEIGHT = 96;
  const BOTTOM_SAFE = 12;

  const baseLayout = layout;
  let lockedLevel = null;
  let lockedViewport = '';
  let lockedCell = 0;

  function cellForLevel(w, h) {
    const viewportKey = `${Math.round(w)}x${Math.round(h)}`;
    if (lockedLevel === state.level && lockedViewport === viewportKey && lockedCell) {
      return lockedCell;
    }

    const config = levelConfig(state.level);
    const startIndex = Math.max(0, Math.min(BOARD_STAGES.length - 1, config.startStage || 0));
    const endIndex = Math.max(
      startIndex,
      Math.min(BOARD_STAGES.length - 1, startIndex + Math.max(0, config.targetShifts || 0)),
    );

    // Across one level rows only go down and columns only go up.
    // Reserve room for both extremes once; never zoom the cells during that level.
    const maxRows = BOARD_STAGES[startIndex].rows;
    const maxCols = BOARD_STAGES[endIndex].cols;
    const maxBoardW = Math.max(120, w - 28);
    const availableBoardH = Math.max(
      120,
      h - BOARD_TOP - TRAY_GAP - TRAY_HEIGHT - BOTTOM_SAFE,
    );

    lockedCell = Math.max(
      12,
      Math.floor(Math.min(maxBoardW / maxCols, availableBoardH / maxRows)),
    );
    lockedLevel = state.level;
    lockedViewport = viewportKey;
    return lockedCell;
  }

  layout = function mobileSafeLayout() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    const stage = currentStage();

    if (!w || !h) {
      baseLayout();
      return;
    }

    const cell = cellForLevel(w, h);
    const boardW = cell * stage.cols;
    const boardH = cell * stage.rows;
    const x = Math.floor((w - boardW) / 2);
    const y = BOARD_TOP;

    state.boardRect = { x, y, w: boardW, h: boardH, cell };

    const slotW = Math.min(112, Math.max(72, (w - 40) / 3));
    const gap = 8;
    const total = slotW * 3 + gap * 2;
    const startX = (w - total) / 2;
    const naturalTrayY = y + boardH + TRAY_GAP;
    const maxTrayY = h - TRAY_HEIGHT - BOTTOM_SAFE;
    const trayY = Math.min(naturalTrayY, maxTrayY);

    state.trayRects = state.tray.map((_, index) => ({
      x: startX + index * (slotW + gap),
      y: trayY,
      w: slotW,
      h: TRAY_HEIGHT,
    }));
  };

  resizeCanvas();
})();
