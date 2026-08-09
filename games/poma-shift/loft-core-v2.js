(() => {
  const LEGACY_STAGE_LAYOUTS = BOARD_STAGES.map((stage) => ({ ...stage }));
  const gameCard = document.querySelector('.game-card');

  function stageRows(index) {
    const fallback = LEGACY_STAGE_LAYOUTS[LEGACY_STAGE_LAYOUTS.length - 1];
    return Number((LEGACY_STAGE_LAYOUTS[index] || fallback).rows);
  }

  function startGeometryFor(level = state.level) {
    const config = levelConfig(level);
    const start = LEGACY_STAGE_LAYOUTS[config.startStage] || LEGACY_STAGE_LAYOUTS[0];
    return {
      startStage: config.startStage,
      cols: Number(start.cols),
      rows: Number(start.rows),
    };
  }

  const baseCurrentStage = currentStage;
  currentStage = function loftCurrentStage() {
    const legacy = LEGACY_STAGE_LAYOUTS[state.stageIndex] || baseCurrentStage();
    const start = LEGACY_STAGE_LAYOUTS[state.loftStartStage ?? state.stageIndex] || legacy;
    return {
      cols: Number(state.loftFixedCols || start.cols || legacy.cols),
      rows: Number(legacy.rows),
    };
  };

  const baseSetupLevel = setupLevel;
  setupLevel = function loftSetupLevel(level = state.level) {
    const geometry = startGeometryFor(level);
    state.loftStartStage = geometry.startStage;
    state.loftFixedCols = geometry.cols;
    state.loftStartRows = geometry.rows;
    const result = baseSetupLevel(level);
    syncLoftMechanism();
    return result;
  };

  layout = function loftLayout() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    const stage = currentStage();
    const startRows = Number(state.loftStartRows || stage.rows);
    const maxBoardW = w - 28;
    const maxBoardH = Math.min(h * 0.56, 455);
    const cell = Math.max(12, Math.floor(Math.min(maxBoardW / stage.cols, maxBoardH / startRows)));
    const boardW = cell * stage.cols;
    const boardH = cell * stage.rows;
    const baseBoardH = cell * startRows;
    const x = Math.floor((w - boardW) / 2);
    const baseY = 94 + Math.max(0, Math.floor((maxBoardH - baseBoardH) / 2));
    const descendedRows = Math.max(0, startRows - stage.rows);
    const y = baseY + descendedRows * cell;

    state.boardRect = { x, y, w: boardW, h: boardH, cell };

    const trayY = Math.min(h - 122, baseY + maxBoardH + 20);
    const slotW = Math.min(112, (w - 40) / 3);
    const gap = 8;
    const total = slotW * 3 + gap * 2;
    const startX = (w - total) / 2;

    state.trayRects = state.tray.map((_, index) => ({
      x: startX + index * (slotW + gap),
      y: trayY,
      w: slotW,
      h: 100,
    }));
  };

  performShift = function loftPerformShift() {
    if (state.stageIndex >= BOARD_STAGES.length - 1) {
      state.shiftsDone += 1;
      state.score += 250;
      metric('shift', {
        stage: state.stageIndex,
        board: `${currentStage().cols}x${currentStage().rows}`,
        shiftsDone: state.shiftsDone,
        loftOnly: true,
      });
      setMessage('SHIFT! LOFT baskısı devam ediyor.');
      checkWin();
      return;
    }

    const oldStage = currentStage();
    const nextRows = stageRows(state.stageIndex + 1);
    const removedRows = Math.max(0, oldStage.rows - nextRows);

    for (let row = 0; row < removedRows; row += 1) {
      if (state.grid[row]?.some(Boolean)) {
        lose('LOFT bloklara çarptı.', 'morph_crush');
        return;
      }
    }

    state.grid = state.grid.slice(removedRows);
    state.stageIndex += 1;
    state.shiftsDone += 1;
    state.score += 250;

    const nextStage = currentStage();
    metric('shift', {
      stage: state.stageIndex,
      board: `${nextStage.cols}x${nextStage.rows}`,
      shiftsDone: state.shiftsDone,
      loftOnly: true,
    });

    setMessage(`SHIFT! LOFT 1 satır indi · alan ${nextStage.cols}×${nextStage.rows}.`);
    checkWin();
  };

  const TOKEN_BY_COLOR = {
    '#ffb703': 'star',
    '#8ecae6': 'drop',
    '#90be6d': 'leaf',
    '#f28482': 'heart',
    '#c77dff': 'crystal',
    '#ff7b54': 'energy',
  };

  function drawStar(cx, cy, radius) {
    ctx.beginPath();
    for (let point = 0; point < 10; point += 1) {
      const angle = -Math.PI / 2 + point * Math.PI / 5;
      const r = point % 2 === 0 ? radius : radius * 0.46;
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;
      if (!point) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
  }

  function drawLeaf(cx, cy, radius) {
    ctx.beginPath();
    ctx.moveTo(cx - radius * 0.62, cy + radius * 0.38);
    ctx.bezierCurveTo(cx - radius * 0.68, cy - radius * 0.35, cx + radius * 0.08, cy - radius * 0.72, cx + radius * 0.64, cy - radius * 0.46);
    ctx.bezierCurveTo(cx + radius * 0.72, cy + radius * 0.18, cx + radius * 0.08, cy + radius * 0.68, cx - radius * 0.62, cy + radius * 0.38);
    ctx.closePath();
  }

  function drawHeart(cx, cy, radius) {
    ctx.beginPath();
    ctx.moveTo(cx, cy + radius * 0.68);
    ctx.bezierCurveTo(cx - radius * 1.08, cy + radius * 0.08, cx - radius * 0.88, cy - radius * 0.72, cx - radius * 0.34, cy - radius * 0.72);
    ctx.bezierCurveTo(cx - radius * 0.04, cy - radius * 0.72, cx, cy - radius * 0.48, cx, cy - radius * 0.36);
    ctx.bezierCurveTo(cx, cy - radius * 0.48, cx + radius * 0.04, cy - radius * 0.72, cx + radius * 0.34, cy - radius * 0.72);
    ctx.bezierCurveTo(cx + radius * 0.88, cy - radius * 0.72, cx + radius * 1.08, cy + radius * 0.08, cx, cy + radius * 0.68);
    ctx.closePath();
  }

  function drawDrop(cx, cy, radius) {
    ctx.beginPath();
    ctx.moveTo(cx, cy - radius * 0.9);
    ctx.bezierCurveTo(cx + radius * 0.62, cy - radius * 0.18, cx + radius * 0.72, cy + radius * 0.16, cx + radius * 0.56, cy + radius * 0.48);
    ctx.bezierCurveTo(cx + radius * 0.34, cy + radius * 0.88, cx - radius * 0.34, cy + radius * 0.88, cx - radius * 0.56, cy + radius * 0.48);
    ctx.bezierCurveTo(cx - radius * 0.72, cy + radius * 0.16, cx - radius * 0.62, cy - radius * 0.18, cx, cy - radius * 0.9);
    ctx.closePath();
  }

  function drawCrystal(cx, cy, radius) {
    ctx.beginPath();
    ctx.moveTo(cx, cy - radius * 0.86);
    ctx.lineTo(cx + radius * 0.66, cy - radius * 0.34);
    ctx.lineTo(cx + radius * 0.52, cy + radius * 0.58);
    ctx.lineTo(cx, cy + radius * 0.86);
    ctx.lineTo(cx - radius * 0.52, cy + radius * 0.58);
    ctx.lineTo(cx - radius * 0.66, cy - radius * 0.34);
    ctx.closePath();
  }

  function drawEnergy(cx, cy, radius) {
    ctx.beginPath();
    ctx.moveTo(cx + radius * 0.08, cy - radius * 0.92);
    ctx.bezierCurveTo(cx + radius * 0.62, cy - radius * 0.42, cx + radius * 0.7, cy + radius * 0.04, cx + radius * 0.46, cy + radius * 0.52);
    ctx.bezierCurveTo(cx + radius * 0.16, cy + radius * 0.94, cx - radius * 0.52, cy + radius * 0.7, cx - radius * 0.58, cy + radius * 0.14);
    ctx.bezierCurveTo(cx - radius * 0.62, cy - radius * 0.18, cx - radius * 0.34, cy - radius * 0.42, cx - radius * 0.06, cy - radius * 0.58);
    ctx.bezierCurveTo(cx - radius * 0.12, cy - radius * 0.22, cx + radius * 0.06, cy - radius * 0.06, cx + radius * 0.18, cy - radius * 0.02);
    ctx.bezierCurveTo(cx + radius * 0.3, cy - radius * 0.28, cx + radius * 0.22, cy - radius * 0.56, cx + radius * 0.08, cy - radius * 0.92);
    ctx.closePath();
  }

  function drawTokenSymbol(type, cx, cy, radius) {
    if (type === 'star') drawStar(cx, cy, radius);
    else if (type === 'leaf') drawLeaf(cx, cy, radius);
    else if (type === 'heart') drawHeart(cx, cy, radius);
    else if (type === 'drop') drawDrop(cx, cy, radius);
    else if (type === 'crystal') drawCrystal(cx, cy, radius);
    else if (type === 'energy') drawEnergy(cx, cy, radius);
    else return false;
    return true;
  }

  drawBlock = function loftTokenBlock(x, y, size, color, alpha = 1) {
    const tokenType = TOKEN_BY_COLOR[String(color).toLowerCase()] || null;
    ctx.save();
    ctx.globalAlpha = alpha;

    const gradient = ctx.createLinearGradient(x, y, x, y + size);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, color);
    roundedRect(x + 2, y + 2, size - 4, size - 4, Math.max(5, size * 0.18));
    ctx.fillStyle = gradient;
    ctx.shadowColor = 'rgba(0,0,0,.28)';
    ctx.shadowBlur = Math.max(2, size * 0.08);
    ctx.shadowOffsetY = Math.max(1, size * 0.05);
    ctx.fill();

    ctx.shadowColor = 'transparent';
    ctx.globalAlpha = alpha * 0.36;
    roundedRect(x + 6, y + 5, Math.max(2, size - 12), Math.max(2, size * 0.16), 4);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    if (tokenType) {
      ctx.globalAlpha = alpha * 0.72;
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = 'rgba(15,25,45,.18)';
      ctx.lineWidth = Math.max(1, size * 0.035);
      if (drawTokenSymbol(tokenType, x + size / 2, y + size / 2 + size * 0.035, size * 0.24)) {
        ctx.fill();
        ctx.stroke();
      }
    }

    ctx.restore();
  };

  drawShiftMeter = function loftShiftMeter() {
    const w = canvas.clientWidth;
    const x = 94;
    const y = 22;
    const meterW = Math.max(90, w - 122);
    const meterH = 12;

    roundedRect(x, y, meterW, meterH, 10);
    ctx.fillStyle = '#263557';
    ctx.fill();

    const ratio = state.linesTowardShift / state.shiftEvery;
    if (ratio > 0) {
      roundedRect(x, y, meterW * Math.min(1, ratio), meterH, 10);
      ctx.fillStyle = ratio >= 0.66 ? '#ff9f1c' : '#49dcb1';
      ctx.fill();
    }

    ctx.fillStyle = '#d9e5ff';
    ctx.font = '800 11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(
      `LOFT ${state.linesTowardShift}/${state.shiftEvery}  •  ${state.shiftsDone}/${state.targetShifts}`,
      x + meterW / 2,
      52,
    );
  };

  drawBoard = function loftDrawBoard() {
    const { x, y, cell } = state.boardRect;
    const { cols, rows } = currentStage();

    roundedRect(x - 7, y - 7, cols * cell + 14, rows * cell + 14, 18);
    ctx.fillStyle = '#182646';
    ctx.fill();

    const warning = state.linesTowardShift === state.shiftEvery - 1 && state.stageIndex < BOARD_STAGES.length - 1;

    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        const px = x + col * cell;
        const py = y + row * cell;
        ctx.fillStyle = warning && row === 0 ? '#432638' : '#101a32';
        ctx.fillRect(px + 1, py + 1, cell - 2, cell - 2);
        ctx.strokeStyle = warning && row === 0 ? 'rgba(255,116,143,.5)' : '#26385e';
        ctx.lineWidth = warning && row === 0 ? 1.5 : 1;
        ctx.strokeRect(px + 1.5, py + 1.5, cell - 3, cell - 3);
        if (state.grid[row][col]) drawBlock(px, py, cell, state.grid[row][col]);
      }
    }

    if (state.drag && state.hover) {
      const valid = canPlace(state.drag.piece, state.hover.col, state.hover.row);
      for (const [dx, dy] of state.drag.piece.cells) {
        const col = state.hover.col + dx;
        const row = state.hover.row + dy;
        if (col < 0 || col >= cols || row < 0 || row >= rows) continue;
        drawBlock(
          x + col * cell,
          y + row * cell,
          cell,
          valid ? state.drag.piece.color : '#ff5d73',
          0.48,
        );
      }
    }
  };

  let loftMechanism = null;
  function ensureLoftMechanism() {
    if (loftMechanism || !gameCard) return loftMechanism;
    loftMechanism = document.createElement('div');
    loftMechanism.className = 'loft-mechanism';
    loftMechanism.setAttribute('aria-hidden', 'true');
    loftMechanism.innerHTML = `
      <span class="loft-rail left"></span>
      <span class="loft-core"><b>↓</b></span>
      <span class="loft-rail right"></span>
      <strong>LOFT</strong>
      <span class="loft-arrows">↓ ↓ ↓ ↓ ↓</span>
    `;
    gameCard.appendChild(loftMechanism);
    return loftMechanism;
  }

  function syncLoftMechanism() {
    const mechanism = ensureLoftMechanism();
    if (!mechanism || !state.boardRect || !canvas) return;
    const board = state.boardRect;
    mechanism.style.left = `${canvas.offsetLeft + board.x}px`;
    mechanism.style.top = `${canvas.offsetTop + board.y - 37}px`;
    mechanism.style.width = `${board.w}px`;
    mechanism.classList.toggle('is-warning', state.linesTowardShift === state.shiftEvery - 2);
    mechanism.classList.toggle('is-critical', state.linesTowardShift >= state.shiftEvery - 1);
    mechanism.dataset.stage = String(state.stageIndex);
  }

  const baseRender = render;
  render = function loftRender() {
    const result = baseRender();
    syncLoftMechanism();
    return result;
  };

  const boardLabel = ui.board?.closest('div')?.querySelector('.label');
  if (boardLabel) boardLabel.textContent = 'ALAN';

  const geometry = startGeometryFor(state.level);
  state.loftStartStage = geometry.startStage;
  state.loftFixedCols = geometry.cols;
  state.loftStartRows = geometry.rows;
  syncLoftMechanism();

  window.PomaShiftLoftCore = {
    version: 2,
    stageLayouts: LEGACY_STAGE_LAYOUTS.map((stage) => ({ ...stage })),
    currentGeometry: () => ({ ...currentStage(), fixedCols: state.loftFixedCols, startRows: state.loftStartRows }),
  };
})();
