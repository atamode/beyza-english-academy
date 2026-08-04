(() => {
  const UI_STORAGE = {
    tutorial: 'pomaShift.tutorialDone.v1',
    sound: 'pomaShift.sound.v1',
  };

  const shell = document.querySelector('.app-shell');
  const topbar = document.querySelector('.topbar');
  const card = document.querySelector('.game-card');

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

  let tutorialStep = 0;
  let audioContext = null;
  let soundEnabled = localStorage.getItem(UI_STORAGE.sound) !== 'off';

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
    gain.gain.exponentialRampToValueAtTime(gainValue, start + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain);
    gain.connect(audio.destination);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.02);
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

  function hideModal() {
    screen.hidden = true;
    content.innerHTML = '';
  }

  function showModal(markup, { closable = true } = {}) {
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
    showModal(createLevelMapMarkup());
    const activeNode = content.querySelector('.level-node.active') || content.querySelector('.level-node:not(.locked):last-child');
    requestAnimationFrame(() => activeNode?.scrollIntoView({ block: 'center', behavior: 'smooth' }));
  }

  function showWin() {
    ui.next.hidden = true;
    const nextLevel = state.level + 1;
    showModal(`
      <div class="result-view win-view">
        <div class="result-icon">✓</div>
        <span class="eyebrow">LEVEL ${state.level}</span>
        <h2>Tamamlandı</h2>
        <p>${state.shiftsDone} SHIFT · ${state.linesCleared} satır · ${state.moves} hamle</p>
        <button class="primary-action" type="button" data-next>LEVEL ${nextLevel}</button>
        <button class="secondary-action" type="button" data-map>Haritaya Bak</button>
      </div>
    `, { closable: false });
  }

  function showFail(reason = 'Hamle kalmadı.') {
    ui.restart.hidden = true;
    showModal(`
      <div class="result-view fail-view">
        <div class="result-icon">×</div>
        <span class="eyebrow">LEVEL ${state.level}</span>
        <h2>Tekrar dene</h2>
        <p>${reason}</p>
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
      hideModal();
      setupLevel(level);
      return;
    }
    if (target.matches('[data-next]')) {
      hideModal();
      setupLevel(state.level + 1);
      return;
    }
    if (target.matches('[data-retry]')) {
      hideModal();
      setupLevel(state.level);
      return;
    }
    if (target.matches('[data-map]')) showMap();
  });

  document.addEventListener('pointerdown', () => ensureAudio(), { once: true, passive: true });

  const baseMetric = metric;
  metric = function productMetric(name, payload = {}) {
    baseMetric(name, payload);
    playSound(name, payload);

    if (!tutorialDone() && state.level === 1) {
      if (name === 'piece_placed' && tutorialStep === 0) showTutorial(1);
      if (name === 'line_clear' && tutorialStep <= 1) showTutorial(2);
      if (name === 'shift') showTutorial(3);
    }
    updateGoal();
  };

  const baseSetupLevel = setupLevel;
  setupLevel = function productSetupLevel(level = state.level) {
    hideModal();
    const result = baseSetupLevel(level);
    updateGoal();
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
    const result = baseLose(reason, reasonCode);
    window.setTimeout(() => showFail(reason), 260);
    return result;
  };

  setSoundLabel();
  updateGoal();
  if (!tutorialDone() && state.level === 1) window.setTimeout(() => showTutorial(0), 450);
})();