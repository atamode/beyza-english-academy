(() => {
  const FIRST_RUSH_LEVEL = 11;
  const BOSS_FIRST_LEVEL = 90;
  const BOSS_STEP = 30;
  const TICK_MS = 100;

  const MILESTONES = {
    20: { character: 'Poma Dahi', item: 'Bilgisayar', icon: '💻' },
    30: { character: 'Influencer Poma', item: 'Telefon', icon: '📱' },
    40: { character: 'Okçu Poma', item: 'Ok', icon: '🏹' },
    50: { character: 'Bozkurt Poma', item: 'Kurt Pençesi', icon: '🐾' },
    60: { character: 'Baby Poma', item: 'Emzik Salyası', icon: '🍼' },
    70: { character: 'Dede Poma', item: 'Asa Gücü', icon: '🪄' },
    80: { character: 'Hero Poma', item: 'Sihirli Yaprak', icon: '🍃' },
  };

  function isBossLevel(level) {
    return level >= BOSS_FIRST_LEVEL && (level - BOSS_FIRST_LEVEL) % BOSS_STEP === 0;
  }

  function isRushLevel(level) {
    const n = Number(level || 0);
    if (n < FIRST_RUSH_LEVEL || isBossLevel(n)) return false;
    return n === FIRST_RUSH_LEVEL || n % 5 === 0;
  }

  function dangerRowsForLevel(level) {
    return isRushLevel(level) ? 2 : 1;
  }

  function rushTargetForLevel(level) {
    if (Number(level) === FIRST_RUSH_LEVEL) return 2;
    if (Number(level) < 50) return 3;
    return 4;
  }

  function rushDurationForLevel(level) {
    const n = Number(level || 0);
    if (n === FIRST_RUSH_LEVEL) return 60_000;
    if (n < 25) return 50_000;
    if (n < 50) return 45_000;
    return 40_000;
  }

  const timer = document.querySelector('.series-timer');
  const timerLabel = timer?.querySelector('.series-timer-copy span');
  const timerValue = timer?.querySelector('[data-series-time]');
  const timerBar = timer?.querySelector('[data-series-bar]');
  const mapButton = document.querySelector('[data-action="map"]');

  const style = document.createElement('style');
  style.textContent = `
    .rush-intro {
      position: fixed;
      inset: 0;
      z-index: 120;
      display: grid;
      place-items: center;
      padding: 20px;
    }
    .rush-intro[hidden] { display: none !important; }
    .rush-intro-backdrop {
      position: absolute;
      inset: 0;
      background: rgba(3, 9, 24, .84);
      backdrop-filter: blur(7px);
    }
    .rush-intro-card {
      position: relative;
      width: min(420px, 100%);
      padding: 24px 22px 22px;
      border-radius: 24px;
      text-align: center;
      color: #edf4ff;
      background: linear-gradient(180deg, #172a50, #0c1830);
      border: 1px solid rgba(255, 194, 71, .4);
      box-shadow: 0 24px 70px rgba(0,0,0,.48), 0 0 36px rgba(255,183,3,.12);
    }
    .rush-intro-badge {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      padding: 7px 11px;
      border-radius: 999px;
      background: rgba(255, 183, 3, .14);
      color: #ffd166;
      font-size: 12px;
      font-weight: 900;
      letter-spacing: .08em;
    }
    .rush-intro-card h2 { margin: 12px 0 6px; font-size: 28px; }
    .rush-intro-card > p { margin: 0 0 14px; color: #b8c9e8; }
    .rush-rules {
      display: grid;
      gap: 8px;
      margin: 16px 0 18px;
      text-align: left;
    }
    .rush-rule {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      border-radius: 14px;
      background: rgba(255,255,255,.055);
      font-weight: 800;
      font-size: 14px;
    }
    .rush-milestone {
      margin: 12px 0 0;
      padding: 11px 12px;
      border-radius: 14px;
      background: rgba(86, 223, 177, .09);
      color: #bdf5df;
      font-size: 13px;
      font-weight: 800;
    }
    .rush-start {
      width: 100%;
      min-height: 48px;
      border: 0;
      border-radius: 15px;
      background: linear-gradient(180deg, #ffcc54, #ffae19);
      color: #182038;
      font: 900 16px/1 system-ui, sans-serif;
      cursor: pointer;
      box-shadow: 0 10px 24px rgba(255,174,25,.22);
    }
    .series-timer.rush-level-timer .series-timer-copy span { color: #ffd166; }
    .series-timer.rush-level-timer.is-hot strong { color: #ff7b8f; }
    @media (max-width: 699px) {
      .rush-intro { padding: 14px; }
      .rush-intro-card { padding: 20px 17px 18px; border-radius: 21px; }
      .rush-intro-card h2 { font-size: 24px; }
      .rush-rule { font-size: 13px; }
    }
  `;
  document.head.appendChild(style);

  const intro = document.createElement('div');
  intro.className = 'rush-intro';
  intro.hidden = true;
  intro.innerHTML = `
    <div class="rush-intro-backdrop"></div>
    <section class="rush-intro-card" role="dialog" aria-modal="true" aria-labelledby="rushTitle">
      <span class="rush-intro-badge">⚡ RUSH BÖLÜMÜ</span>
      <h2 id="rushTitle">Bu levelin kuralı</h2>
      <p data-rush-level></p>
      <div class="rush-rules">
        <div class="rush-rule">⏱️ <span data-rush-time></span></div>
        <div class="rush-rule">🔴 SHIFT sırasında üstteki <strong>2 tehlike satırı</strong> boş kalmalı.</div>
        <div class="rush-rule">🎯 <span data-rush-target></span></div>
      </div>
      <div class="rush-milestone" data-rush-milestone hidden></div>
      <button class="rush-start" type="button" data-rush-start>BAŞLA</button>
    </section>
  `;
  document.body.appendChild(intro);

  let rushHandle = 0;
  let rushEndsAt = 0;
  let rushDuration = 0;
  let pausedRemaining = 0;
  let rushActive = false;
  let introOpen = false;

  function setTimerVisible(visible) {
    if (!timer) return;
    timer.hidden = !visible;
    timer.classList.toggle('rush-level-timer', visible);
    if (visible && timerLabel) timerLabel.textContent = 'RUSH';
  }

  function paintTimer(remaining) {
    if (!timer || !timerValue || !timerBar) return;
    const safe = Math.max(0, remaining);
    const ratio = rushDuration ? safe / rushDuration : 1;
    timerValue.textContent = `${(safe / 1000).toFixed(safe < 10_000 ? 1 : 0)}s`;
    timerBar.style.transform = `scaleX(${Math.max(0, Math.min(1, ratio))})`;
    timer.classList.toggle('is-hot', ratio <= 0.30);
    timer.classList.toggle('is-expired', safe <= 0);
    timer.classList.toggle('is-paused', Boolean(pausedRemaining));
  }

  function clearRushInterval() {
    window.clearInterval(rushHandle);
    rushHandle = 0;
  }

  function stopRushTimer({ hide = false } = {}) {
    clearRushInterval();
    rushActive = false;
    rushEndsAt = 0;
    pausedRemaining = 0;
    if (hide) setTimerVisible(false);
  }

  function updateRushTimer() {
    if (!rushActive || state.status !== 'playing') {
      clearRushInterval();
      return;
    }
    const remaining = Math.max(0, rushEndsAt - performance.now());
    paintTimer(remaining);
    if (remaining > 0) return;

    stopRushTimer();
    metric('rush_timeout', {
      durationMs: rushDuration,
      shifts: state.shiftsDone,
      targetShifts: state.targetShifts,
    });
    lose('RUSH süresi bitti.', 'rush_timeout');
  }

  function startRushTimer() {
    if (!isRushLevel(state.level) || state.status !== 'playing') return;
    introOpen = false;
    intro.hidden = true;
    rushDuration = rushDurationForLevel(state.level);
    rushEndsAt = performance.now() + rushDuration;
    pausedRemaining = 0;
    rushActive = true;
    state.levelStartedAt = performance.now();
    setTimerVisible(true);
    paintTimer(rushDuration);
    clearRushInterval();
    rushHandle = window.setInterval(updateRushTimer, TICK_MS);
    metric('rush_start', {
      durationMs: rushDuration,
      dangerRows: 2,
      targetShifts: state.targetShifts,
    });
    setMessage(`⚡ RUSH: ${Math.round(rushDuration / 1000)} sn · 2 tehlike satırı · ${state.targetShifts} SHIFT`);
  }

  function pauseRushTimer() {
    if (!rushActive || pausedRemaining > 0) return;
    pausedRemaining = Math.max(0, rushEndsAt - performance.now());
    rushActive = false;
    clearRushInterval();
    paintTimer(pausedRemaining);
  }

  function resumeRushTimer() {
    if (!pausedRemaining || document.hidden || state.status !== 'playing' || introOpen) return;
    rushEndsAt = performance.now() + pausedRemaining;
    pausedRemaining = 0;
    rushActive = true;
    clearRushInterval();
    rushHandle = window.setInterval(updateRushTimer, TICK_MS);
    updateRushTimer();
  }

  function showRushIntro() {
    if (!isRushLevel(state.level)) {
      intro.hidden = true;
      introOpen = false;
      setTimerVisible(false);
      return;
    }

    stopRushTimer();
    introOpen = true;
    const duration = rushDurationForLevel(state.level);
    const target = rushTargetForLevel(state.level);
    state.targetShifts = target;
    syncUi();

    intro.querySelector('[data-rush-level]').textContent = `LEVEL ${state.level}`;
    intro.querySelector('[data-rush-time]').textContent = `${Math.round(duration / 1000)} saniye içinde leveli tamamla.`;
    intro.querySelector('[data-rush-target]').textContent = `Hedef: ${target} SHIFT`;

    const milestone = intro.querySelector('[data-rush-milestone]');
    const reward = MILESTONES[state.level];
    if (reward) {
      milestone.hidden = false;
      milestone.textContent = `${reward.icon} ${reward.character} milestone'u · Tamamlayınca ${reward.item} açılır.`;
    } else {
      milestone.hidden = true;
      milestone.textContent = '';
    }

    setTimerVisible(true);
    rushDuration = duration;
    paintTimer(duration);
    if (timer) timer.classList.add('is-paused');
    intro.hidden = false;
    metric('rush_intro_shown', { durationMs: duration, dangerRows: 2, targetShifts: target });
  }

  intro.querySelector('[data-rush-start]').addEventListener('click', startRushTimer);

  // The old tray-by-tray timer is disabled in rush-disable.js. RUSH now times the whole level.
  const baseSetupLevel = setupLevel;
  setupLevel = function rushSetupLevel(level = state.level) {
    stopRushTimer({ hide: true });
    intro.hidden = true;
    introOpen = false;
    const result = baseSetupLevel(level);
    if (isRushLevel(state.level)) showRushIntro();
    else setTimerVisible(false);
    return result;
  };

  // Morph Crush must look at the real ceiling BEFORE line-clear gravity creates empty rows.
  // Normal: top 1 danger row. RUSH: top 2 danger rows.
  const baseClearLines = clearLines;
  clearLines = function ceilingAwareClearLines() {
    const fullRows = [];
    for (let row = 0; row < state.grid.length; row += 1) {
      if (state.grid[row].every(Boolean)) fullRows.push(row);
    }

    const pendingShift =
      fullRows.length > 0 &&
      state.linesTowardShift + fullRows.length >= state.shiftEvery &&
      state.stageIndex < BOARD_STAGES.length - 1;

    const freezeMoves = Number(window.PomaShiftMeta?.snapshot?.().runtime?.freezeMoves || 0);
    const dangerRows = dangerRowsForLevel(state.level);
    const shouldCrush = pendingShift && freezeMoves <= 0 && Array.from({ length: dangerRows }, (_, row) => row)
      .some((row) => !fullRows.includes(row) && state.grid[row]?.some(Boolean));

    if (!shouldCrush) return baseClearLines();

    const activePerformShift = performShift;
    let crushConsumed = false;
    performShift = function ceilingCrushShift() {
      if (!crushConsumed) {
        crushConsumed = true;
        metric('morph_crush_danger_zone', { dangerRows, rush: isRushLevel(state.level) });
        lose(
          isRushLevel(state.level)
            ? 'RUSH tavanındaki 2 tehlike satırına blok değdi.'
            : 'Tavan satırına blok değdi.',
          'morph_crush',
        );
        return;
      }
      return activePerformShift();
    };

    try {
      return baseClearLines();
    } finally {
      performShift = activePerformShift;
    }
  };

  const baseDrawBoard = drawBoard;
  drawBoard = function rushDangerDrawBoard() {
    baseDrawBoard();
    if (!state.boardRect || state.stageIndex >= BOARD_STAGES.length - 1) return;

    const { x, y, w, cell } = state.boardRect;
    const dangerRows = dangerRowsForLevel(state.level);
    const armed = state.linesTowardShift === state.shiftEvery - 1;

    ctx.save();
    for (let row = 0; row < dangerRows; row += 1) {
      ctx.fillStyle = armed
        ? (isRushLevel(state.level) ? 'rgba(255,64,92,.18)' : 'rgba(255,91,112,.13)')
        : (isRushLevel(state.level) ? 'rgba(255,64,92,.075)' : 'rgba(255,91,112,.035)');
      ctx.fillRect(x + 1, y + row * cell + 1, w - 2, cell - 2);
      ctx.strokeStyle = armed ? 'rgba(255,120,138,.72)' : 'rgba(255,120,138,.28)';
      ctx.lineWidth = armed ? 2 : 1;
      ctx.strokeRect(x + 1.5, y + row * cell + 1.5, w - 3, cell - 3);
    }
    ctx.restore();
  };

  const baseLose = lose;
  lose = function rushLose(reason, reasonCode = 'unknown') {
    if (isRushLevel(state.level)) stopRushTimer();
    intro.hidden = true;
    introOpen = false;
    return baseLose(reason, reasonCode);
  };

  const baseCheckWin = checkWin;
  checkWin = function rushCheckWin() {
    const before = state.status;
    const result = baseCheckWin();
    if (before === 'playing' && state.status === 'won' && isRushLevel(state.level)) {
      const remainingMs = rushActive ? Math.max(0, rushEndsAt - performance.now()) : pausedRemaining;
      stopRushTimer();
      metric('rush_complete', {
        remainingMs: Math.round(remainingMs || 0),
        durationMs: rushDurationForLevel(state.level),
        dangerRows: 2,
      });
    }
    return result;
  };

  function normalizeMapRushNodes(root = document) {
    root.querySelectorAll?.('.level-node[data-level]').forEach((node) => {
      const level = Number(node.dataset.level || 0);
      const shouldRush = isRushLevel(level);
      node.classList.toggle('rush', shouldRush);
      let marker = node.querySelector('small');
      if (shouldRush && !marker) {
        marker = document.createElement('small');
        marker.textContent = '⚡';
        node.appendChild(marker);
      }
      if (!shouldRush && marker?.textContent?.includes('⚡')) marker.remove();
    });
  }

  const observer = new MutationObserver(() => normalizeMapRushNodes());
  observer.observe(document.body, { childList: true, subtree: true });
  normalizeMapRushNodes();

  document.addEventListener('visibilitychange', () => {
    if (!isRushLevel(state.level) || introOpen) return;
    if (document.hidden) pauseRushTimer();
    else resumeRushTimer();
  });

  // Map is intentionally unavailable during an active RUSH so the clock cannot be gamed.
  mapButton?.addEventListener('click', (event) => {
    if (!isRushLevel(state.level) || !rushActive) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    setMessage('⚡ RUSH aktif. Harita bölüm bitince açılır.');
  }, true);

  window.PomaShiftRush = {
    isRushLevel,
    isBossLevel,
    dangerRowsForLevel,
    rushDurationForLevel,
    rushTargetForLevel,
    active() { return rushActive; },
    introOpen() { return introOpen; },
    remainingMs() {
      if (rushActive) return Math.max(0, rushEndsAt - performance.now());
      return pausedRemaining;
    },
  };

  // setupLevel ran once before this late-loaded controller. Apply the locked rule to that current level too.
  if (isRushLevel(state.level)) showRushIntro();
  else setTimerVisible(false);
})();
