(() => {
  // Mobile-safe layout: the tray always owns a reserved zone below the board.
  // This prevents pieces from rendering over the playable grid on short phones.
  const BOARD_TOP = 68;
  const TRAY_GAP = 18;
  const TRAY_HEIGHT = 96;
  const BOTTOM_SAFE = 12;

  const baseLayout = layout;

  layout = function mobileSafeLayout() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    const stage = currentStage();

    if (!w || !h) {
      baseLayout();
      return;
    }

    const maxBoardW = Math.max(120, w - 28);
    const availableBoardH = Math.max(
      120,
      h - BOARD_TOP - TRAY_GAP - TRAY_HEIGHT - BOTTOM_SAFE,
    );

    const cell = Math.max(
      12,
      Math.floor(Math.min(maxBoardW / stage.cols, availableBoardH / stage.rows)),
    );

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

  // Force an immediate recalculation after the override is installed.
  resizeCanvas();
})();
