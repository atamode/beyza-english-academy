(() => {
  const BOARD_COLS = 7;
  const BOARD_ROWS = 9;
  const MAX_CLOUD_ROWS = BOARD_ROWS - 1;
  const TOKEN_BY_COLOR = {
    '#ffb703': 'star',
    '#8ecae6': 'drop',
    '#90be6d': 'leaf',
    '#f28482': 'heart',
    '#c77dff': 'crystal',
    '#ff7b54': 'energy',
  };

  // Keep legacy stage-based consumers alive, but geometry is now globally fixed.
  BOARD_STAGES.splice(0, BOARD_STAGES.length, ...Array.from({ length: BOARD_ROWS }, () => ({ cols: BOARD_COLS, rows: BOARD_ROWS })));

  const baseLevelConfig = levelConfig;
  levelConfig = function sugarCloudLevelConfig(level) {
    const config = { ...baseLevelConfig(level) };
    config.startStage = 0;
    config.targetShifts = Math.max(1, Math.min(6, Number(config.targetShifts || 1)));
    return config;
  };

  currentStage = function sugarCloudCurrentStage() {
    return { cols: BOARD_COLS, rows: BOARD_ROWS };
  };

  function cloudRows() {
    return Math.max(0, Math.min(MAX_CLOUD_ROWS, Number(state.cloudRows || 0)));
  }

  function nextOpenRow() {
    return cloudRows();
  }

  function firstOccupiedRow() {
    for (let row = cloudRows(); row < BOARD_ROWS; row += 1) {
      if (state.grid[row]?.some(Boolean)) return row;
    }
    return null;
  }

  function dangerGap() {
    const occupied = firstOccupiedRow();
    if (occupied == null) return BOARD_ROWS - cloudRows();
    return Math.max(0, occupied - cloudRows());
  }

  function nextRowsClear(count = 1) {
    const start = nextOpenRow();
    for (let offset = 0; offset < Math.max(1, count); offset += 1) {
      const row = start + offset;
      if (row >= BOARD_ROWS) return false;
      if (state.grid[row]?.some(Boolean)) return false;
    }
    return true;
  }

  const baseSetupLevel = setupLevel;
  setupLevel = function sugarCloudSetupLevel(level = state.level) {
    state.cloudRows = 0;
    state.stageIndex = 0;
    const result = baseSetupLevel(level);
    state.cloudRows = 0;
    state.stageIndex = 0;
    state.grid = makeGrid(BOARD_COLS, BOARD_ROWS);
    state.targetShifts = Math.max(1, Math.min(6, Number(state.targetShifts || 1)));
    syncUi();
    syncCloudThreat();
    render();
    return result;
  };

  layout = function sugarCloudLayout() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    const maxBoardW = w - 28;
    const maxBoardH = Math.min(h * 0.58, 455);
    const cell = Math.max(12, Math.floor(Math.min(maxBoardW / BOARD_COLS, maxBoardH / BOARD_ROWS)));
    const boardW = cell * BOARD_COLS;
    const boardH = cell * BOARD_ROWS;
    const x = Math.floor((w - boardW) / 2);
    const y = 88 + Math.max(0, Math.floor((maxBoardH - boardH) / 2));

    state.boardRect = { x, y, w: boardW, h: boardH, cell };

    const trayY = Math.min(h - 122, y + boardH + 18);
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

  const baseCanPlace = canPlace;
  canPlace = function sugarCloudCanPlace(piece, col, row) {
    const blocked = cloudRows();
    const touchesCloud = piece.cells.some(([, dy]) => row + dy < blocked);
    if (touchesCloud) return false;
    return baseCanPlace(piece, col, row);
  };

  function drawStar(cx, cy, radius) {
    ctx.beginPath();
    for (let point = 0; point < 10; point += 1) {
      const angle = -Math.PI / 2 + point * Math.PI / 5;
      const r = point % 2 === 0 ? radius : radius * 0.46;
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;
      if (!point) ctx.moveTo(x, y); else ctx.lineTo(x, y);
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

  drawBlock = function sugarCloudTokenBlock(x, y, size, color, alpha = 1) {
    const tokenType = TOKEN_BY_COLOR[String(color).toLowerCase()] || null;
    ctx.save();
    ctx.globalAlpha = alpha;
    roundedRect(x + 2, y + 2, size - 4, size - 4, Math.max(5, size * 0.18));
    ctx.fillStyle = color;
    ctx.shadowColor = 'rgba(0,0,0,.28)';
    ctx.shadowBlur = Math.max(2, size * 0.08);
    ctx.shadowOffsetY = Math.max(1, size * 0.05);
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.globalAlpha = alpha * 0.36;
    roundedRect(x + 6, y + 5, Math.max(2, size - 12), Math.max(2, size * 0.16), 4);
    ctx.fillStyle = '#fff';
    ctx.fill();
    if (tokenType) {
      ctx.globalAlpha = alpha * 0.72;
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = 'rgba(15,25,45,.18)';
      ctx.lineWidth = Math.max(1, size * 0.035);
      if (drawTokenSymbol(tokenType, x + size / 2, y + size / 2 + size * 0.035, size * 0.24)) {
        ctx.fill();
        ctx.stroke();
      }
    }
    ctx.restore();
  };

  drawShiftMeter = function sugarCloudShiftMeter() {
    const w = canvas.clientWidth;
    const x = 94;
    const y = 22;
    const meterW = Math.max(90, w - 122);
    const meterH = 12;
    roundedRect(x, y, meterW, meterH, 10);
    ctx.fillStyle = '#263557';
    ctx.fill();
    const ratio = state.linesTowardShift / Math.max(1, state.shiftEvery);
    if (ratio > 0) {
      roundedRect(x, y, meterW * Math.min(1, ratio), meterH, 10);
      ctx.fillStyle = ratio >= 0.66 ? '#e88bd3' : '#65d7cf';
      ctx.fill();
    }
    ctx.fillStyle = '#d9e5ff';
    ctx.font = '800 11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`BULUT ${state.linesTowardShift}/${state.shiftEvery}  •  ${state.shiftsDone}/${state.targetShifts}`, x + meterW / 2, 52);
  };

  drawBoard = function sugarCloudDrawBoard() {
    const { x, y, cell } = state.boardRect;
    const blocked = cloudRows();
    roundedRect(x - 7, y - 7, BOARD_COLS * cell + 14, BOARD_ROWS * cell + 14, 18);
    ctx.fillStyle = '#182646';
    ctx.fill();

    for (let row = 0; row < BOARD_ROWS; row += 1) {
      for (let col = 0; col < BOARD_COLS; col += 1) {
        const px = x + col * cell;
        const py = y + row * cell;
        const swallowed = row < blocked;
        ctx.fillStyle = swallowed ? '#231b37' : '#101a32';
        ctx.fillRect(px + 1, py + 1, cell - 2, cell - 2);
        ctx.strokeStyle = swallowed ? 'rgba(232,139,211,.18)' : '#26385e';
        ctx.lineWidth = 1;
        ctx.strokeRect(px + 1.5, py + 1.5, cell - 3, cell - 3);
        if (!swallowed && state.grid[row]?.[col]) drawBlock(px, py, cell, state.grid[row][col]);
      }
    }

    if (state.drag && state.hover) {
      const valid = canPlace(state.drag.piece, state.hover.col, state.hover.row);
      for (const [dx, dy] of state.drag.piece.cells) {
        const col = state.hover.col + dx;
        const row = state.hover.row + dy;
        if (col < 0 || col >= BOARD_COLS || row < 0 || row >= BOARD_ROWS) continue;
        drawBlock(x + col * cell, y + row * cell, cell, valid ? state.drag.piece.color : '#ff5d73', 0.48);
      }
    }
  };

  let audioContext = null;
  function soundEnabled() {
    return localStorage.getItem('pomaShift.sound.v1') !== 'off';
  }

  function playCloudSound(blocked = false) {
    if (!soundEnabled()) return;
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      audioContext ||= new AudioContextClass();
      if (audioContext.state === 'suspended') audioContext.resume().catch(() => {});
      const now = audioContext.currentTime;
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      osc.type = blocked ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(blocked ? 420 : 190, now);
      osc.frequency.exponentialRampToValueAtTime(blocked ? 180 : 95, now + 0.28);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(blocked ? 0.035 : 0.025, now + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);
      osc.connect(gain);
      gain.connect(audioContext.destination);
      osc.start(now);
      osc.stop(now + 0.34);
    } catch {}
  }

  const gameCard = document.querySelector('.game-card');
  let cloudThreat = null;
  let shielded = false;

  function ensureCloudThreat() {
    if (cloudThreat || !gameCard) return cloudThreat;
    cloudThreat = document.createElement('div');
    cloudThreat.className = 'sugar-cloud-threat';
    cloudThreat.setAttribute('aria-hidden', 'true');
    cloudThreat.innerHTML = `
      <div class="sugar-cloud-body">
        <i class="puff p1"></i><i class="puff p2"></i><i class="puff p3"></i><i class="puff p4"></i><i class="puff p5"></i>
        <i class="cloud-spark s1"></i><i class="cloud-spark s2"></i><i class="cloud-spark s3"></i>
        <i class="cloud-lightning l1">ϟ</i><i class="cloud-lightning l2">ϟ</i>
        <strong>ŞEKER BULUTU</strong>
      </div>
      <div class="cloud-shield"><span></span></div>
    `;
    gameCard.appendChild(cloudThreat);
    return cloudThreat;
  }

  function syncCloudThreat() {
    const cloud = ensureCloudThreat();
    if (!cloud || !state.boardRect || !canvas) return;
    const board = state.boardRect;
    const cardRect = gameCard.getBoundingClientRect();
    const canvasRect = canvas.getBoundingClientRect();
    const rows = cloudRows();
    const gap = dangerGap();
    const safeRows = BOARD_ROWS - rows;
    cloud.style.left = `${canvasRect.left - cardRect.left + board.x}px`;
    cloud.style.top = `${canvasRect.top - cardRect.top + board.y - 42}px`;
    cloud.style.width = `${board.w}px`;
    cloud.style.height = `${46 + rows * board.cell}px`;
    cloud.classList.toggle('is-warning', gap <= 2 || safeRows <= 3);
    cloud.classList.toggle('is-critical', gap <= 1 || safeRows <= 2);
    cloud.classList.toggle('is-shielded', shielded);
    cloud.dataset.rows = String(rows);
    cloud.dataset.gap = String(gap);
  }

  function animateAdvance() {
    const cloud = ensureCloudThreat();
    if (!cloud) return;
    cloud.classList.remove('is-advancing');
    void cloud.offsetWidth;
    cloud.classList.add('is-advancing');
    window.setTimeout(() => cloud.classList.remove('is-advancing'), 620);
    playCloudSound(false);
    navigator.vibrate?.([16, 24, 26]);
  }

  function setShielded(active) {
    shielded = Boolean(active);
    syncCloudThreat();
  }

  function playShieldBlock() {
    const cloud = ensureCloudThreat();
    if (cloud) {
      cloud.classList.remove('is-shield-hit');
      void cloud.offsetWidth;
      cloud.classList.add('is-shield-hit');
      window.setTimeout(() => cloud.classList.remove('is-shield-hit'), 680);
    }
    playCloudSound(true);
    navigator.vibrate?.([12, 18, 12]);
  }

  function advanceCloud({ dangerRows = 1 } = {}) {
    if (state.status !== 'playing') return false;
    const rows = cloudRows();
    if (rows >= MAX_CLOUD_ROWS) {
      lose('Şeker Bulutu oyun alanını kapladı.', 'cloud_full');
      return false;
    }
    if (!nextRowsClear(dangerRows)) {
      lose(dangerRows > 1 ? 'Şeker Bulutu RUSH tehlike bölgesine ulaştı.' : 'Şeker Bulutu bloklara ulaştı.', 'cloud_crush');
      return false;
    }

    state.cloudRows = rows + 1;
    state.stageIndex = state.cloudRows;
    state.shiftsDone += 1;
    state.score += 250;
    metric('shift', {
      stage: state.stageIndex,
      board: `${BOARD_COLS}x${BOARD_ROWS}`,
      shiftsDone: state.shiftsDone,
      cloudRows: state.cloudRows,
      sugarCloud: true,
    });
    setMessage(`SHIFT! Şeker Bulutu 1 satır büyüdü · alan 7×9.`);
    animateAdvance();
    syncUi();
    render();
    checkWin();
    window.dispatchEvent(new CustomEvent('poma-shift:cloud-advanced', { detail: { cloudRows: state.cloudRows } }));
    return true;
  }

  performShift = function sugarCloudPerformShift() {
    return advanceCloud({ dangerRows: 1 });
  };

  const baseRender = render;
  render = function sugarCloudRender() {
    const result = baseRender();
    syncCloudThreat();
    return result;
  };

  const shiftLabel = ui.shift?.closest('div')?.querySelector('.label');
  const boardLabel = ui.board?.closest('div')?.querySelector('.label');
  if (shiftLabel) shiftLabel.textContent = 'BULUT';
  if (boardLabel) boardLabel.textContent = 'ALAN';

  window.PomaShiftCloudCore = {
    version: 3,
    board: { cols: BOARD_COLS, rows: BOARD_ROWS },
    cloudRows,
    nextOpenRow,
    dangerGap,
    nextRowsClear,
    advance: advanceCloud,
    setShielded,
    playShieldBlock,
    sync: syncCloudThreat,
  };

  // game.js already booted once before this layer loaded; normalize that first attempt.
  setupLevel(state.level);
})();