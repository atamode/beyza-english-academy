(() => {
  // Mobile UX priority: keep the board touchable and keep the dragged piece above the finger.
  // The board still becomes wider and shorter after SHIFT, but cell size is recalculated per stage
  // instead of being locked to the smallest size required by the final stage of the level.
  const DEFAULT_BOARD_TOP = 44;
  const DEFAULT_TRAY_GAP = 10;
  const DEFAULT_TRAY_HEIGHT = 80;
  const DEFAULT_BOTTOM_SAFE = 8;
  const DRAG_LIFT = 68;

  const baseLayout = layout;
  const baseBoardCellFromPoint = boardCellFromPoint;
  const baseDrawDraggedPiece = drawDraggedPiece;
  const coarsePointer = window.matchMedia?.('(pointer: coarse)')?.matches ?? true;

  function mobileMetrics(w, h) {
    const short = h < 520;
    const narrow = w < 390;
    return {
      boardTop: short ? 36 : DEFAULT_BOARD_TOP,
      trayGap: short ? 7 : DEFAULT_TRAY_GAP,
      trayHeight: short ? 70 : narrow ? 76 : DEFAULT_TRAY_HEIGHT,
      bottomSafe: short ? 5 : DEFAULT_BOTTOM_SAFE,
      sideInset: narrow ? 12 : 16,
    };
  }

  function cellForStage(w, h, stage, metrics) {
    const maxBoardW = Math.max(120, w - metrics.sideInset * 2);
    const availableBoardH = Math.max(
      150,
      h - metrics.boardTop - metrics.trayGap - metrics.trayHeight - metrics.bottomSafe,
    );

    // Recalculate for the active stage. This keeps 6x12 / 7x11 boards materially larger
    // on phones while SHIFT still visibly widens the board and lowers the ceiling.
    return Math.max(
      16,
      Math.floor(Math.min(maxBoardW / stage.cols, availableBoardH / stage.rows)),
    );
  }

  layout = function mobileSafeLayout() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    const stage = currentStage();

    if (!w || !h) {
      baseLayout();
      return;
    }

    const metrics = mobileMetrics(w, h);
    const cell = cellForStage(w, h, stage, metrics);
    const boardW = cell * stage.cols;
    const boardH = cell * stage.rows;
    const x = Math.floor((w - boardW) / 2);
    const y = metrics.boardTop;

    state.boardRect = { x, y, w: boardW, h: boardH, cell };

    const gap = 7;
    const slotW = Math.min(118, Math.max(74, (w - 24 - gap * 2) / 3));
    const total = slotW * 3 + gap * 2;
    const startX = (w - total) / 2;
    const naturalTrayY = y + boardH + metrics.trayGap;
    const maxTrayY = h - metrics.trayHeight - metrics.bottomSafe;
    const trayY = Math.min(naturalTrayY, maxTrayY);

    state.trayRects = state.tray.map((_, index) => ({
      x: startX + index * (slotW + gap),
      y: trayY,
      w: slotW,
      h: metrics.trayHeight,
    }));
  };

  // On touch devices, placement is calculated from a point above the finger so the finger
  // no longer hides the target cell. The existing board ghost preview then becomes usable.
  boardCellFromPoint = function mobileBoardCellFromPoint(x, y, piece) {
    const liftedY = coarsePointer && state.drag ? y - DRAG_LIFT : y;
    return baseBoardCellFromPoint(x, liftedY, piece);
  };

  drawDraggedPiece = function mobileDrawDraggedPiece() {
    if (!state.drag || !coarsePointer) {
      baseDrawDraggedPiece();
      return;
    }

    const { piece, x, y } = state.drag;
    const { w, h } = pieceBounds(piece.cells);
    const boardCell = state.boardRect?.cell || 30;
    const unit = Math.max(26, Math.min(36, boardCell));
    const ox = x - (w * unit) / 2;
    const oy = y - DRAG_LIFT - (h * unit) / 2;

    piece.cells.forEach(([dx, dy]) => {
      drawBlock(ox + dx * unit, oy + dy * unit, unit, piece.color, 0.94);
    });
  };

  resizeCanvas();
})();
