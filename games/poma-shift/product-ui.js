(() => {
  const UI_STORAGE = {
    tutorial: 'pomaShift.tutorialDone.v1',
    sound: 'pomaShift.sound.v1',
  };

  const topbar = document.querySelector('.topbar');
  const card = document.querySelector('.game-card');
  const moveValue = document.getElementById('moveValue');

  const toolbar = document.createElement('div');
  toolbar.className = 'game-toolbar';
  toolbar.innerHTML = `
    <button class="tool-button" type="button" data-action="map" aria-label="Level haritasını aç">🗺️ <span>Harita</span></button>
    <div class="goal-pill" aria-live="polite"><span>HEDEF</span><strong data-goal>1 SHIFT</strong></div>
    <button class="tool-button sound-button" type="button" data-action="sound" aria-label="Sesi aç veya kapat">🔊 <span>Ses</span></button>
  `;
  topbar.insertAdjacentElement('afterend', toolbar);

  const tutorial = document.createElement('div');
  tutorial.className = 'tutorial-hint';
  tutorial.hidden = true;
  tutorial.innerHTML = '<strong></strong><span></span>';
  toolbar.insertAdjacentElement('afterend', tutorial);

  const seriesTimer = document.createElement('div');
  seriesTimer.className = 'series-timer';
  seriesTimer.innerHTML = `
    <div class="series-timer-copy"><span>SERİ</span><strong data-series-time>HAZIR</strong></div>
    <div class="series-timer-track"><i data-series-bar></i></div>
  `;
  tutorial.insertAdjacentElement('afterend', seriesTimer);

  const screen = document.createElement('div');
  screen.className = 'modal-screen';
  screen.hidden = true;
  screen.innerHTML = `
    <div class="modal-backdrop" data-close></div>
    <section class="modal-card" role="dialog" aria-modal="true">
      <button class="modal-close" type="button" data-close aria-label="Kapat">×</button>
      <div data-modal-content></div>
    </section>
  `;
  document.body.appendChild(screen);

  const content = screen.querySelector('[data-modal-content]');
  const mapButton = toolbar.querySelector('[data-action="map"]');
  const soundButton = toolbar.querySelector('[data-action="sound"]');
  const goalValue = toolbar.querySelector('[data-goal]');
  const seriesTime = seriesTimer.querySelector('[data-series-time]');
  const seriesBar = seriesTimer.querySelector('[data-series-bar]');

  let tutorialStep = 0;
  let audioContext = null;
  let soundEnabled = localStorage.getItem(UI_STORAGE.sound) !== 'off';
  let currentMoveLimit = 18;
  let trayTimerHandle = 0;
  let trayTimerEndsAt = 0;
  let trayTimerDuration = 0;
  let trayTimerRunning = false;
  let pausedTimerRemaining = 0;
  let modalPausesTimer = false;
  let visibilityPaused = false;

  function moveLimitFor(level) {
    const config = levelConfig(level);
    return 18 + Math.max(0, config.targetShifts - 1) * 14 + config.startStage * 2;
  }

  function trayWindowForLevel(level) {
    if (level <= 1) return 0;
    if (level === 2) return 7000;
    return 5000;
  }

  function updateMoveHud() {
    if (!moveValue) return;
    moveValue.textContent = `${state.moves}/${currentMoveLimit}`;
    const ratio = currentMoveLimit ? state.moves / currentMoveLimit : 0;
    moveValue.parentElement?.classList.toggle('is-danger', ratio >= 0.82);
  }

  function setSoundLabel() {
    soundButton.firstChild.textContent = soundEnabled ? '🔊 ' : '🔇 ';
    soundButton.classList.toggle('is-muted', !soundEnabled);
    soundButton.setAttribute('aria-pressed', String(!soundEnabled));
  }

  function ensureAudio() {
    if (!soundEnabled) return null;
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

  function tone(frequency, duration = 0.07, type = 'sine', gainValue = 0.035, delay = 0) {
    const audio = ensureAudio();
    if (!audio) return;
    const start = audio.currentTime + delay;
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(gainValue, start + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain);
    gain.connect(audio.destination);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.02);
  }

  function sliceNoise() {
    const audio = ensureAudio();
    if (!audio) return;
    const duration = 0.16;
    const buffer = audio.createBuffer(1, Math.floor(audio.sampleRate * duration), audio.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) {
      const envelope = 1 - i / data.length;
      data[i] = (Math.random() * 2 - 1) * envelope;
    }
    const source = audio.createBufferSource();
    const filter = audio.createBiquadFilter();
    const gain = audio.createGain();
    source.buffer = buffer;
    filter.type = 'highpass';
    filter.frequency.value = 1250;
    gain.gain.setValueAtTime(0.055, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + duration);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(audio.destination);
    source.start();
  }

  function haptic(pattern) {
    if (navigator.vibrate) navigator.vibrate(pattern);
  }

  function pieceSound(payload) {
    const shape = payload.shape;
    const cells = payload.cells || 1;
    const isStraight = [3, 4, 11, 12].includes(shape);
    const isSquare = shape === 5;

    if (cells === 1) {
      tone(980, 0.032, 'square', 0.018);
      haptic(5);
      return;
    }
    if (isStraight) {
      tone(cells >= 4 ? 760 : 700, 0.038, 'square', 0.022);
      tone(cells >= 4 ? 1120 : 980, 0.026, 'triangle', 0.014, 0.018);
      haptic([7, 7, 8]);
      return;
    }
    if (isSquare) {
      tone(270, 0.055, 'sine', 0.024);
      haptic(11);
      return;
    }
    tone(380 + cells * 38, 0.048, 'triangle', 0.021);
    haptic(7);
  }

  function playSound(name, payload = {}) {
    if (!soundEnabled) return;
    if (name === 'piece_placed') pieceSound(payload);
    if (name === 'invalid_drop') tone(120, 0.08, 'square', 0.018);
    if (name === 'line_clear') {
      tone(440, 0.07, 'triangle', 0.035);
      tone(payload.cleared > 1 ? 760 : 610, 0.10, 'triangle', 0.03, 0.048);
    }
    if (name === 'shift') {
      sliceNoise();
      tone(170, 0.08, 'sine', 0.032, 0.035);
    }
    if (name === 'tray_timeout') {
      tone(180, 0.08, 'square', 0.020);
      tone(120, 0.12, 'square', 0.015, 0.07);
      haptic([20, 22, 20]);
    }
    if (name === 'level_complete') {
      tone(440, 0.09, 'triangle', 0.035);
      tone(660, 0.10, 'triangle', 0.035, 0.08);
      tone(880, 0.16, 'triangle', 0.032, 0.17);
      haptic([16, 22, 18, 22, 30]);
    }
    if (name === 'level_fail') {
      tone(230, 0.12, 'sawtooth', 0.022);
      tone(150, 0.18, 'sawtooth', 0.018, 0.10);
      haptic([30, 35, 45]);
    }
  }

  function renderTimerWaiting(ready = true) {
    const windowMs = trayWindowForLevel(state.level);
    seriesTimer.hidden = false;
    seriesTime.textContent = windowMs === 0 ? 'SERBEST' : ready ? 'HAZIR' : '—';
    seriesBar.style.transform = 'scaleX(1)';
    seriesTimer.classList.remove('is-hot', 'is-expired', 'is-paused');
  }

  function stopTrayTimer({ ready = true } = {}) {
    trayTimerRunning = false;
    trayTimerEndsAt = 0;
    pausedTimerRemaining = 0;
    window.clearInterval(trayTimerHandle);
    trayTimerHandle = 0;
    renderTimerWaiting(ready);
  }

  function pauseTrayTimer() {
    if (!trayTimerRunning) return;
    pausedTimerRemaining = Math.max(0, trayTimerEndsAt - performance.now());
    trayTimerRunning = false;
    window.clearInterval(trayTimerHandle);
    trayTimerHandle = 0;
    seriesTimer.classList.add('is-paused');
    seriesTime.textContent = 'DURDU';
  }

  function resumeTrayTimer() {
    if (trayTimerRunning || pausedTimerRemaining <= 0 || state.status !== 'playing') return;
    trayTimerEndsAt = performance.now() + pausedTimerRemaining;
    pausedTimerRemaining = 0;
    trayTimerRunning = true;
    seriesTimer.classList.remove('is-paused');
    window.clearInterval(trayTimerHandle);
    trayTimerHandle = window.setInterval(updateTrayTimer, 50);
    updateTrayTimer();
  }

  function updateTrayTimer() {
    if (!trayTimerRunning || state.status !== 'playing') return;
    const remaining = Math.max(0, trayTimerEndsAt - performance.now());
    const ratio = trayTimerDuration ? remaining / trayTimerDuration : 0;
    seriesTime.textContent = `${(remaining / 1000).toFixed(1)}s`;
    seriesBar.style.transform = `scaleX(${ratio})`;
    seriesTimer.classList.toggle('is-hot', ratio <= 0.35);

    if (remaining > 0) return;
    if (state.drag) {
      trayTimerEndsAt = performance.now() + 220;
      return;
    }
    expireTray();
  }

  function startTrayTimer() {
    const duration = trayWindowForLevel(state.level);
    if (!duration || trayTimerRunning || state.status !== 'playing') return;
    trayTimerDuration = duration;
    trayTimerEndsAt = performance.now() + duration;
    pausedTimerRemaining = 0;
    trayTimerRunning = true;
    seriesTimer.classList.remove('is-expired', 'is-paused');
    window.clearInterval(trayTimerHandle);
    trayTimerHandle = window.setInterval(updateTrayTimer, 50);
    updateTrayTimer();
  }

  function extendActiveTimer(ms) {
    if (trayTimerRunning) trayTimerEndsAt += ms;
    else if (pausedTimerRemaining > 0) pausedTimerRemaining += ms;
  }

  function expireTray() {
    if (!trayTimerRunning || state.status !== 'playing') return;
    trayTimerRunning = false;
    window.clearInterval(trayTimerHandle);
    trayTimerHandle = 0;

    const remaining = state.tray.filter((piece) => !piece.used);
    if (!remaining.length) {
      stopTrayTimer();
      return;
    }

    state.drag = null;
    state.hover = null;
    const penalty = remaining.length;
    state.moves += penalty;
    remaining.forEach((piece) => { piece.used = true; });
    metric('tray_timeout', { penaltyMoves: penalty, remainingPieces: penalty });
    seriesTimer.classList.add('is-expired');
    setMessage(`Seri kaçtı: +${penalty} hamle cezası.`);
    updateMoveHud();

    if (state.moves >= currentMoveLimit) {
      lose('Hamle hakkın bitti.', 'move_limit');
      stopTrayTimer({ ready: false });
      return;
    }

    refillTray();
    stopTrayTimer();
    syncUi();
    render();
  }

  function tutorialDone() {
    return localStorage.getItem(UI_STORAGE.tutorial) === 'done';
  }

  function showTutorial(step = tutorialStep) {
    if (tutorialDone() || state.level !== 1 || state.status !== 'playing') {
      tutorial.hidden = true;
      return;
    }
    tutorialStep = step;
    const strong = tutorial.querySelector('strong');
    const span = tutorial.querySelector('span');
    if (step === 0) {
      strong.textContent = '1. Parçayı tut';
      span.textContent = 'Alttaki şekillerden birini boş alana sürükle.';
    } else if (step === 1) {
      strong.textContent = '2. Satırı doldur';
      span.textContent = 'Bir yatay satırı tamamen doldurunca satır temizlenir.';
    } else if (step === 2) {
      strong.textContent = '3. SHIFT geliyor';
      span.textContent = '3 satır temizle: tahta genişler ama tavan bir sıra iner.';
    } else {
      tutorial.hidden = true;
      localStorage.setItem(UI_STORAGE.tutorial, 'done');
      return;
    }
    tutorial.hidden = false;
  }

  function updateGoal() {
    if (!goalValue) return;
    const remaining = Math.max(0, state.targetShifts - state.shiftsDone);
    goalValue.textContent = remaining === 1 ? '1 SHIFT' : `${remaining} SHIFT`;
  }

  function hideModal({ resumeTimer = true } = {}) {
    screen.hidden = true;
    content.innerHTML = '';
    if (modalPausesTimer) {
      modalPausesTimer = false;
      if (resumeTimer && !visibilityPaused) resumeTrayTimer();
    }
  }

  function showModal(markup, { closable = true, pauseTimer = false } = {}) {
    if (pauseTimer) {
      pauseTrayTimer();
      modalPausesTimer = true;
    }
    content.innerHTML = markup;
    screen.hidden = false;
    screen.classList.toggle('no-close', !closable);
    const close = screen.querySelector('.modal-close');
    close.hidden = !closable;
  }

  function createLevelMapMarkup() {
    const progress = getProgress();
    const highest = Math.max(1, progress.highestUnlocked || 1);
    const current = state.level;
    const maxVisible = Math.max(30, Math.min(100, highest + 15));
    const nodes = [];

    for (let level = maxVisible; level >= 1; level -= 1) {
      const locked = level > highest;
      const complete = level < highest;
      const active = level === current;
      nodes.push(`
        <button class="level-node ${locked ? 'locked' : ''} ${complete ? 'complete' : ''} ${active ? 'active' : ''}"
          type="button" data-level="${level}" ${locked ? 'disabled' : ''} aria-label="Level ${level}${locked ? ' kilitli' : ''}">
          <span>${complete ? '✓' : level}</span>
        </button>
      `);
    }
    return `
      <div class="map-head">
        <span class="eyebrow">POMA SHIFT</span>
        <h2>Level Yolu</h2>
        <p>Aşağıdan başla, her bölümde yukarı çık.</p>
      </div>
      <div class="level-path">${nodes.join('')}</div>
    `;
  }

  function showMap() {
    showModal(createLevelMapMarkup(), { pauseTimer: state.status === 'playing' });
    const activeNode = content.querySelector('.level-node.active') || content.querySelector('.level-node:not(.locked):last-child');
    requestAnimationFrame(() => activeNode?.scrollIntoView({ block: 'center', behavior: 'smooth' }));
  }

  function showWin() {
    stopTrayTimer({ ready: false });
    ui.next.hidden = true;
    const nextLevel = state.level + 1;
    showModal(`
      <div class="result-view win-view">
        <div class="result-icon">✓</div>
        <span class="eyebrow">LEVEL ${state.level}</span>
        <h2>Tamamlandı</h2>
        <p>${state.shiftsDone} SHIFT · ${state.linesCleared} satır · ${state.moves}/${currentMoveLimit} hamle</p>
        <button class="primary-action" type="button" data-next>LEVEL ${nextLevel}</button>
        <button class="secondary-action" type="button" data-map>Haritaya Bak</button>
      </div>
    `, { closable: false });
  }

  function showFail(reason = 'Hamle kalmadı.') {
    stopTrayTimer({ ready: false });
    ui.restart.hidden = true;
    showModal(`
      <div class="result-view fail-view">
        <div class="result-icon">×</div>
        <span class="eyebrow">LEVEL ${state.level}</span>
        <h2>Tekrar dene</h2>
        <p>${reason}</p>
        <p class="result-sub">${state.moves}/${currentMoveLimit} hamle · ${state.shiftsDone}/${state.targetShifts} SHIFT</p>
        <button class="primary-action" type="button" data-retry>YENİDEN OYNA</button>
        <button class="secondary-action" type="button" data-map>Haritaya Bak</button>
      </div>
    `, { closable: false });
  }

  mapButton.addEventListener('click', () => {
    ensureAudio();
    showMap();
  });

  soundButton.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    localStorage.setItem(UI_STORAGE.sound, soundEnabled ? 'on' : 'off');
    setSoundLabel();
    if (soundEnabled) {
      ensureAudio();
      tone(520, 0.07, 'sine', 0.025);
    }
  });

  screen.addEventListener('click', (event) => {
    const target = event.target.closest('button,[data-close]');
    if (!target) return;
    if (target.matches('[data-close]') && !screen.classList.contains('no-close')) {
      hideModal();
      return;
    }
    if (target.matches('[data-level]')) {
      const level = Number(target.dataset.level);
      if (!Number.isFinite(level)) return;
      hideModal({ resumeTimer: false });
      setupLevel(level);
      return;
    }
    if (target.matches('[data-next]')) {
      hideModal({ resumeTimer: false });
      setupLevel(state.level + 1);
      return;
    }
    if (target.matches('[data-retry]')) {
      hideModal({ resumeTimer: false });
      setupLevel(state.level);
      return;
    }
    if (target.matches('[data-map]')) showMap();
  });

  document.addEventListener('pointerdown', () => ensureAudio(), { once: true, passive: true });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      visibilityPaused = true;
      pauseTrayTimer();
    } else {
      visibilityPaused = false;
      if (!modalPausesTimer) resumeTrayTimer();
    }
  });

  const baseMetric = metric;
  metric = function productMetric(name, payload = {}) {
    baseMetric(name, payload);
    playSound(name, payload);

    if (name === 'piece_placed') {
      const usedCount = state.tray.filter((piece) => piece.used).length;
      if (usedCount === 1) startTrayTimer();
      if (usedCount >= 3) stopTrayTimer();
      updateMoveHud();
    }

    // Do not charge the player for mandatory feedback animations.
    if (name === 'line_clear') extendActiveTimer(130);
    if (name === 'shift') extendActiveTimer(230);

    if (!tutorialDone() && state.level === 1) {
      if (name === 'piece_placed' && tutorialStep === 0) showTutorial(1);
      if (name === 'line_clear' && tutorialStep <= 1) showTutorial(2);
      if (name === 'shift') showTutorial(3);
    }
    updateGoal();
  };

  const basePlacePiece = placePiece;
  placePiece = function productPlacePiece(piece, col, row) {
    const placed = basePlacePiece(piece, col, row);
    if (!placed) return false;
    updateMoveHud();
    if (state.status === 'playing' && state.moves >= currentMoveLimit) {
      lose('Hamle hakkın bitti.', 'move_limit');
    }
    return true;
  };

  const baseSetupLevel = setupLevel;
  setupLevel = function productSetupLevel(level = state.level) {
    hideModal({ resumeTimer: false });
    stopTrayTimer({ ready: false });
    currentMoveLimit = moveLimitFor(level);
    const result = baseSetupLevel(level);
    updateMoveHud();
    updateGoal();
    stopTrayTimer();
    if (level === 1 && !tutorialDone()) {
      tutorialStep = 0;
      window.setTimeout(() => showTutorial(0), 250);
    } else {
      tutorial.hidden = true;
    }
    return result;
  };

  const baseCheckWin = checkWin;
  checkWin = function productCheckWin() {
    const before = state.status;
    const result = baseCheckWin();
    if (before === 'playing' && state.status === 'won') {
      window.setTimeout(showWin, 360);
    }
    return result;
  };

  const baseLose = lose;
  lose = function productLose(reason, reasonCode = 'unknown') {
    if (state.status === 'lost') return;
    stopTrayTimer({ ready: false });
    const result = baseLose(reason, reasonCode);
    window.setTimeout(() => showFail(reason), 260);
    return result;
  };

  currentMoveLimit = moveLimitFor(state.level);
  setSoundLabel();
  updateMoveHud();
  updateGoal();
  stopTrayTimer();
  if (!tutorialDone() && state.level === 1) window.setTimeout(() => showTutorial(0), 450);
})();