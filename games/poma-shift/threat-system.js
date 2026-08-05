(() => {
  const card = document.querySelector('.game-card');
  const shiftBox = document.querySelector('.topbar > div:nth-child(3)');
  if (!card || !shiftBox) return;

  const vignette = document.createElement('div');
  vignette.className = 'shift-threat-vignette';
  vignette.setAttribute('aria-hidden', 'true');
  card.appendChild(vignette);

  let lastThreat = -1;
  let audioContext = null;

  function threatLevel() {
    if (state.status !== 'playing') return 0;
    if (state.stageIndex >= BOARD_STAGES.length - 1) return 0;
    const ratio = state.linesTowardShift / Math.max(1, state.shiftEvery);
    if (ratio >= 2 / 3) return 2;
    if (ratio >= 1 / 3) return 1;
    return 0;
  }

  function soundEnabled() {
    return localStorage.getItem('pomaShift.sound.v1') !== 'off';
  }

  function ensureAudio() {
    if (!soundEnabled()) return null;
    try {
      if (!audioContext) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return null;
        audioContext = new AudioContextClass();
      }
      if (audioContext.state === 'suspended') audioContext.resume().catch(() => {});
      return audioContext;
    } catch {
      return null;
    }
  }

  function warningBeep(level) {
    const audio = ensureAudio();
    if (!audio) return;
    const now = audio.currentTime;
    const frequencies = level === 2 ? [540, 540] : [360];
    frequencies.forEach((frequency, index) => {
      const start = now + index * 0.115;
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      osc.type = level === 2 ? 'square' : 'triangle';
      osc.frequency.setValueAtTime(frequency, start);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(level === 2 ? 0.022 : 0.012, start + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.07);
      osc.connect(gain);
      gain.connect(audio.destination);
      osc.start(start);
      osc.stop(start + 0.09);
    });
  }

  function setThreatVisual(force = false) {
    const level = threatLevel();
    card.dataset.shiftThreat = String(level);
    shiftBox.dataset.shiftThreat = String(level);

    if (level === lastThreat && !force) return;
    if (level > lastThreat && state.level > 0) {
      if (level === 1) {
        if (navigator.vibrate) navigator.vibrate(18);
        warningBeep(1);
      }
      if (level === 2) {
        if (navigator.vibrate) navigator.vibrate([28, 55, 28]);
        warningBeep(2);
      }
    }
    lastThreat = level;
  }

  function drawThreatOverlay() {
    if (!state.boardRect || state.stageIndex >= BOARD_STAGES.length - 1) return;

    const { x, y, cell, w } = state.boardRect;
    const level = threatLevel();
    const progress = Math.min(state.shiftEvery, state.linesTowardShift);
    const topRowOccupied = state.grid[0]?.some(Boolean);

    ctx.save();

    // The top row is the LOFT crush zone. It is never a safe auto-clear zone.
    const rowAlpha = level === 2 ? 0.38 : level === 1 ? 0.22 : 0.08;
    ctx.fillStyle = `rgba(255, 72, 92, ${rowAlpha})`;
    ctx.fillRect(x, y, w, cell);

    if (level >= 1 || topRowOccupied) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(x, y, w, cell);
      ctx.clip();
      ctx.strokeStyle = `rgba(255, 126, 139, ${level === 2 ? 0.72 : 0.34})`;
      ctx.lineWidth = 3;
      const step = Math.max(12, Math.floor(cell * 0.55));
      for (let d = -cell; d < w + cell; d += step) {
        ctx.beginPath();
        ctx.moveTo(x + d, y + cell);
        ctx.lineTo(x + d + cell, y);
        ctx.stroke();
      }
      ctx.restore();
    }

    ctx.fillStyle = level === 2 ? '#ffd7dc' : '#ff9aa7';
    ctx.font = `${level === 2 ? '900' : '800'} ${Math.max(9, Math.min(12, cell * 0.31))}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const rowCopy = topRowOccupied
      ? '⚠ LOFT İNERSE KAYBEDERSİN'
      : 'LOFT SINIRI';
    ctx.fillText(rowCopy, x + w / 2, y + cell / 2);

    if (level >= 1) {
      const remaining = Math.max(1, state.shiftEvery - progress);
      const text = level === 2
        ? topRowOccupied
          ? 'ALARM • 1 SATIR SONRA ÇARPIŞMA'
          : 'ALARM • 1 SATIR SONRA LOFT İNER'
        : `${remaining} SATIR SONRA SHIFT`;
      const boxW = Math.min(w, level === 2 ? 238 : 174);
      const boxH = level === 2 ? 30 : 24;
      const bx = x + (w - boxW) / 2;
      const by = Math.max(56, y - (level === 2 ? 43 : 34));
      roundedRect(bx, by, boxW, boxH, 10);
      ctx.fillStyle = level === 2 ? 'rgba(118, 12, 28, .94)' : 'rgba(112, 70, 9, .86)';
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = `900 ${level === 2 ? 12 : 10}px system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, bx + boxW / 2, by + boxH / 2);
    }

    ctx.restore();
  }

  const baseDrawBoard = drawBoard;
  drawBoard = function threatDrawBoard() {
    baseDrawBoard();
    drawThreatOverlay();
  };

  const baseMetric = metric;
  metric = function threatMetric(name, payload = {}) {
    const result = baseMetric(name, payload);
    if (name === 'line_clear' || name === 'shift' || name === 'level_start' || name === 'level_complete' || name === 'level_fail') {
      setThreatVisual();
      requestAnimationFrame(render);
    }
    if (name === 'piece_placed' && threatLevel() === 2) {
      if (navigator.vibrate) navigator.vibrate([10, 24, 10]);
    }
    return result;
  };

  const baseSetupLevel = setupLevel;
  setupLevel = function threatSetupLevel(level = state.level) {
    lastThreat = -1;
    const result = baseSetupLevel(level);
    setThreatVisual(true);
    requestAnimationFrame(render);
    return result;
  };

  document.addEventListener('pointerdown', ensureAudio, { once: true, passive: true });
  setThreatVisual(true);
  requestAnimationFrame(render);
})();
