const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const ui = {
  level: document.getElementById('levelValue'),
  score: document.getElementById('scoreValue'),
  shift: document.getElementById('shiftValue'),
  board: document.getElementById('boardValue'),
  message: document.getElementById('message'),
  restart: document.getElementById('restartBtn'),
  next: document.getElementById('nextBtn'),
};

const COLORS = ['#ffb703', '#8ecae6', '#90be6d', '#f28482', '#c77dff', '#ff7b54'];
const BOARD_STAGES = [
  { cols: 6, rows: 12 },
  { cols: 7, rows: 11 },
  { cols: 8, rows: 10 },
  { cols: 9, rows: 9 },
  { cols: 10, rows: 8 },
  { cols: 11, rows: 7 },
  { cols: 12, rows: 6 },
];
const SHAPES = [
  [[0,0]],
  [[0,0],[1,0]],
  [[0,0],[0,1]],
  [[0,0],[1,0],[2,0]],
  [[0,0],[0,1],[0,2]],
  [[0,0],[1,0],[0,1],[1,1]],
  [[0,0],[1,0],[2,0],[1,1]],
  [[0,0],[0,1],[1,1]],
  [[1,0],[0,1],[1,1]],
  [[0,0],[1,0],[1,1]],
  [[0,0],[0,1],[1,0]],
  [[0,0],[1,0],[2,0],[3,0]],
  [[0,0],[0,1],[0,2],[0,3]],
  [[0,0],[1,0],[1,1],[2,1]],
  [[1,0],[2,0],[0,1],[1,1]],
  [[0,0],[0,1],[0,2],[1,2]],
  [[1,0],[1,1],[1,2],[0,2]],
];

const state = {
  level: 1,
  score: 0,
  stageIndex: 0,
  linesTowardShift: 0,
  shiftEvery: 3,
  targetShifts: 3,
  shiftsDone: 0,
  grid: [],
  tray: [],
  drag: null,
  hover: null,
  status: 'playing',
  boardRect: null,
  trayRects: [],
};

function makeGrid(cols, rows) {
  return Array.from({ length: rows }, () => Array(cols).fill(null));
}

function pieceBounds(cells) {
  const maxX = Math.max(...cells.map(([x]) => x));
  const maxY = Math.max(...cells.map(([,y]) => y));
  return { w: maxX + 1, h: maxY + 1 };
}

function randomPiece() {
  const maxShapeIndex = Math.min(SHAPES.length, 7 + Math.floor(state.level / 4));
  const cells = SHAPES[Math.floor(Math.random() * maxShapeIndex)].map(([x,y]) => [x,y]);
  return {
    id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
    cells,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    used: false,
  };
}

function refillTray() {
  state.tray = [randomPiece(), randomPiece(), randomPiece()];
}

function currentStage() {
  return BOARD_STAGES[state.stageIndex];
}

function setupLevel(level = state.level) {
  state.level = level;
  state.score = 0;
  state.stageIndex = Math.min(Math.floor((level - 1) / 8), 2);
  state.linesTowardShift = 0;
  state.shiftEvery = Math.max(2, 3 - Math.floor(level / 25));
  state.targetShifts = Math.min(6, 2 + Math.floor(level / 3));
  state.shiftsDone = 0;
  const { cols, rows } = currentStage();
  state.grid = makeGrid(cols, rows);
  state.status = 'playing';
  state.drag = null;
  state.hover = null;
  refillTray();
  ui.next.hidden = true;
  ui.restart.hidden = true;
  setMessage('3 parçadan birini sürükle ve tahtaya bırak.');
  syncUi();
  render();
}

function syncUi() {
  const { cols, rows } = currentStage();
  ui.level.textContent = state.level;
  ui.score.textContent = state.score;
  ui.shift.textContent = `${state.linesTowardShift}/${state.shiftEvery}`;
  ui.board.textContent = `${cols}×${rows}`;
}

function setMessage(text) {
  ui.message.textContent = text;
}

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(rect.width * dpr);
  canvas.height = Math.round(rect.height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  render();
}

function layout() {
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  const stage = currentStage();
  const maxBoardW = w - 28;
  const maxBoardH = Math.min(h * 0.59, 455);
  const cell = Math.floor(Math.min(maxBoardW / stage.cols, maxBoardH / stage.rows));
  const boardW = cell * stage.cols;
  const boardH = cell * stage.rows;
  const x = Math.floor((w - boardW) / 2);
  const y = 72 + Math.max(0, Math.floor((maxBoardH - boardH) / 2));
  state.boardRect = { x, y, w: boardW, h: boardH, cell };

  const trayY = Math.min(h - 122, y + maxBoardH + 20);
  const slotW = Math.min(112, (w - 40) / 3);
  const gap = 8;
  const total = slotW * 3 + gap * 2;
  const startX = (w - total) / 2;
  state.trayRects = state.tray.map((_, i) => ({ x: startX + i * (slotW + gap), y: trayY, w: slotW, h: 100 }));
}

function roundedRect(x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function drawBlock(x, y, size, color, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  roundedRect(x + 2, y + 2, size - 4, size - 4, Math.max(5, size * 0.16));
  ctx.fillStyle = color;
  ctx.fill();
  ctx.globalAlpha = alpha * 0.35;
  roundedRect(x + 6, y + 5, Math.max(2, size - 12), Math.max(2, size * 0.18), 4);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.restore();
}

function render() {
  if (!ctx || !canvas.clientWidth) return;
  layout();
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  ctx.clearRect(0, 0, w, h);

  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, '#101b37');
  bg.addColorStop(1, '#071022');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  drawShiftMeter();
  drawBoard();
  drawTray();
  if (state.drag) drawDraggedPiece();
}

function drawShiftMeter() {
  const w = canvas.clientWidth;
  const x = 28;
  const y = 22;
  const meterW = w - 56;
  const meterH = 12;
  roundedRect(x, y, meterW, meterH, 10);
  ctx.fillStyle = '#263557';
  ctx.fill();
  const ratio = state.linesTowardShift / state.shiftEvery;
  if (ratio > 0) {
    roundedRect(x, y, meterW * ratio, meterH, 10);
    ctx.fillStyle = ratio >= 0.66 ? '#ff9f1c' : '#49dcb1';
    ctx.fill();
  }
  ctx.fillStyle = '#d9e5ff';
  ctx.font = '700 12px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`SHIFT ${state.linesTowardShift}/${state.shiftEvery}`, w / 2, 52);
}

function drawBoard() {
  const { x, y, cell } = state.boardRect;
  const { cols, rows } = currentStage();

  roundedRect(x - 7, y - 7, cols * cell + 14, rows * cell + 14, 18);
  ctx.fillStyle = '#182646';
  ctx.fill();

  const warning = state.linesTowardShift === state.shiftEvery - 1 && state.stageIndex < BOARD_STAGES.length - 1;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const px = x + c * cell;
      const py = y + r * cell;
      ctx.fillStyle = warning && r === 0 ? '#4a2633' : '#101a32';
      ctx.fillRect(px + 1, py + 1, cell - 2, cell - 2);
      ctx.strokeStyle = '#26385e';
      ctx.lineWidth = 1;
      ctx.strokeRect(px + 1.5, py + 1.5, cell - 3, cell - 3);
      if (state.grid[r][c]) drawBlock(px, py, cell, state.grid[r][c]);
    }
  }

  if (warning) {
    ctx.fillStyle = '#ff8a8a';
    ctx.font = '800 11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('⚠ SONRAKİ SHIFT: ÜST SATIR EZİLECEK', x + (cols * cell) / 2, y - 14);
  }

  if (state.drag && state.hover) {
    const valid = canPlace(state.drag.piece, state.hover.col, state.hover.row);
    for (const [dx, dy] of state.drag.piece.cells) {
      const c = state.hover.col + dx;
      const r = state.hover.row + dy;
      if (c < 0 || c >= cols || r < 0 || r >= rows) continue;
      drawBlock(x + c * cell, y + r * cell, cell, valid ? state.drag.piece.color : '#ff5d73', 0.48);
    }
  }
}

function drawTray() {
  state.tray.forEach((piece, i) => {
    const rect = state.trayRects[i];
    roundedRect(rect.x, rect.y, rect.w, rect.h, 18);
    ctx.fillStyle = piece.used ? '#111a2d' : '#1a2949';
    ctx.fill();
    ctx.strokeStyle = piece.used ? '#1f2a3f' : '#334b78';
    ctx.stroke();
    if (piece.used) return;

    const { w, h } = pieceBounds(piece.cells);
    const unit = Math.min(25, Math.floor((rect.w - 22) / Math.max(w, h)));
    const pw = w * unit;
    const ph = h * unit;
    const ox = rect.x + (rect.w - pw) / 2;
    const oy = rect.y + (rect.h - ph) / 2;
    piece.cells.forEach(([dx,dy]) => drawBlock(ox + dx * unit, oy + dy * unit, unit, piece.color));
  });
}

function drawDraggedPiece() {
  const { piece, x, y } = state.drag;
  const { w, h } = pieceBounds(piece.cells);
  const unit = 30;
  const ox = x - (w * unit) / 2;
  const oy = y - (h * unit) / 2;
  piece.cells.forEach(([dx,dy]) => drawBlock(ox + dx * unit, oy + dy * unit, unit, piece.color, 0.86));
}

function pointInRect(x, y, rect) {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}

function pointerPosition(event) {
  const rect = canvas.getBoundingClientRect();
  return { x: event.clientX - rect.left, y: event.clientY - rect.top };
}

function boardCellFromPoint(x, y, piece) {
  const b = state.boardRect;
  const { w, h } = pieceBounds(piece.cells);
  const col = Math.round((x - b.x) / b.cell - w / 2);
  const row = Math.round((y - b.y) / b.cell - h / 2);
  return { col, row };
}

function canPlace(piece, col, row) {
  const { cols, rows } = currentStage();
  return piece.cells.every(([dx,dy]) => {
    const c = col + dx;
    const r = row + dy;
    return c >= 0 && c < cols && r >= 0 && r < rows && !state.grid[r][c];
  });
}

function placePiece(piece, col, row) {
  if (!canPlace(piece, col, row)) return false;
  piece.cells.forEach(([dx,dy]) => {
    state.grid[row + dy][col + dx] = piece.color;
  });
  piece.used = true;
  state.score += piece.cells.length * 10;
  clearLines();
  if (state.status !== 'playing') return true;

  if (state.tray.every(p => p.used)) refillTray();
  checkNoMoves();
  syncUi();
  return true;
}

function clearLines() {
  let cleared = 0;
  for (let r = state.grid.length - 1; r >= 0; r--) {
    if (state.grid[r].every(Boolean)) {
      state.grid.splice(r, 1);
      state.grid.unshift(Array(currentStage().cols).fill(null));
      cleared++;
      r++;
    }
  }
  if (!cleared) return;

  state.score += cleared * cleared * 100;
  state.linesTowardShift += cleared;
  setMessage(cleared > 1 ? `${cleared} satır! Combo.` : 'Satır temizlendi.');

  while (state.linesTowardShift >= state.shiftEvery && state.status === 'playing') {
    state.linesTowardShift -= state.shiftEvery;
    performShift();
  }
}

function performShift() {
  if (state.stageIndex >= BOARD_STAGES.length - 1) {
    state.shiftsDone++;
    state.score += 250;
    checkWin();
    return;
  }

  const old = currentStage();
  const next = BOARD_STAGES[state.stageIndex + 1];
  const removedRows = old.rows - next.rows;
  for (let r = 0; r < removedRows; r++) {
    if (state.grid[r].some(Boolean)) {
      lose('Tavan bloklara çarptı.');
      return;
    }
  }

  const surviving = state.grid.slice(removedRows);
  const extraCols = next.cols - old.cols;
  const leftAdd = Math.floor(extraCols / 2);
  const rightAdd = extraCols - leftAdd;
  state.grid = surviving.map(row => [
    ...Array(leftAdd).fill(null),
    ...row,
    ...Array(rightAdd).fill(null),
  ]);
  state.stageIndex++;
  state.shiftsDone++;
  state.score += 250;
  setMessage(`SHIFT! Tahta ${next.cols}×${next.rows} oldu.`);
  checkWin();
}

function checkWin() {
  if (state.shiftsDone >= state.targetShifts) {
    state.status = 'won';
    state.score += 1000;
    setMessage(`Level ${state.level} tamamlandı.`);
    ui.next.hidden = false;
    ui.restart.hidden = true;
  }
}

function anyPlacementFor(piece) {
  if (piece.used) return false;
  const { cols, rows } = currentStage();
  const { w, h } = pieceBounds(piece.cells);
  for (let r = 0; r <= rows - h; r++) {
    for (let c = 0; c <= cols - w; c++) {
      if (canPlace(piece, c, r)) return true;
    }
  }
  return false;
}

function checkNoMoves() {
  if (state.status !== 'playing') return;
  const available = state.tray.filter(p => !p.used);
  if (available.length && available.some(anyPlacementFor)) return;
  lose('Yer kalmadı.');
}

function lose(reason) {
  state.status = 'lost';
  setMessage(`${reason} Tekrar dene.`);
  ui.restart.hidden = false;
  ui.next.hidden = true;
}

canvas.addEventListener('pointerdown', (event) => {
  if (state.status !== 'playing') return;
  const p = pointerPosition(event);
  const index = state.trayRects.findIndex(rect => pointInRect(p.x, p.y, rect));
  if (index < 0 || state.tray[index].used) return;
  canvas.setPointerCapture(event.pointerId);
  state.drag = { piece: state.tray[index], trayIndex: index, x: p.x, y: p.y };
  state.hover = boardCellFromPoint(p.x, p.y, state.drag.piece);
  render();
});

canvas.addEventListener('pointermove', (event) => {
  if (!state.drag) return;
  const p = pointerPosition(event);
  state.drag.x = p.x;
  state.drag.y = p.y;
  state.hover = boardCellFromPoint(p.x, p.y, state.drag.piece);
  render();
});

canvas.addEventListener('pointerup', (event) => {
  if (!state.drag) return;
  const p = pointerPosition(event);
  const target = boardCellFromPoint(p.x, p.y, state.drag.piece);
  placePiece(state.drag.piece, target.col, target.row);
  state.drag = null;
  state.hover = null;
  render();
});

canvas.addEventListener('pointercancel', () => {
  state.drag = null;
  state.hover = null;
  render();
});

ui.restart.addEventListener('click', () => setupLevel(state.level));
ui.next.addEventListener('click', () => setupLevel(state.level + 1));
window.addEventListener('resize', resizeCanvas);

setupLevel(1);
resizeCanvas();
