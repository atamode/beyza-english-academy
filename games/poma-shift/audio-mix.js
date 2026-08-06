(() => {
  const SOUND_KEY = 'pomaShift.sound.v1';
  const MUSIC_SRC = './poma-sports-loop.mp3';
  const MUSIC_VOLUME = 0.17;
  const MUSIC_DUCK_VOLUME = 0.075;

  let audioContext = null;
  let music = null;
  let musicUnlocked = false;
  let musicError = false;
  let duckTimer = 0;

  function soundEnabled() {
    return localStorage.getItem(SOUND_KEY) !== 'off';
  }

  function mapMusicVisible() {
    const metaMap = document.querySelector('.meta-modal:not([hidden]) .meta-map');
    const legacyMap = document.querySelector(
      '.modal-screen:not([hidden]) .map-view, .modal-screen:not([hidden]) .level-map, .modal-screen:not([hidden]) .level-path',
    );
    return Boolean(metaMap || legacyMap);
  }

  function ensureContext() {
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

  function ensureMusic() {
    if (music || musicError) return music;
    try {
      music = new Audio(MUSIC_SRC);
      music.loop = true;
      music.preload = 'auto';
      music.volume = MUSIC_VOLUME;
      music.setAttribute('playsinline', '');
      music.addEventListener('error', () => {
        musicError = true;
        music = null;
      }, { once: true });
      return music;
    } catch {
      musicError = true;
      music = null;
      return null;
    }
  }

  function playMusic() {
    if (!soundEnabled() || document.hidden || !mapMusicVisible()) {
      pauseMusic();
      return;
    }
    const track = ensureMusic();
    if (!track) return;
    track.volume = MUSIC_VOLUME;
    track.play().then(() => {
      musicUnlocked = true;
    }).catch(() => {});
  }

  function pauseMusic() {
    if (!music) return;
    music.pause();
  }

  function syncMusic() {
    if (!soundEnabled() || document.hidden || !mapMusicVisible()) {
      pauseMusic();
      return;
    }
    playMusic();
  }

  function duckMusic(duration = 240, level = MUSIC_DUCK_VOLUME) {
    if (!music || music.paused) return;
    window.clearTimeout(duckTimer);
    music.volume = Math.min(MUSIC_VOLUME, Math.max(0.035, level));
    duckTimer = window.setTimeout(() => {
      if (music && soundEnabled() && !music.paused) music.volume = MUSIC_VOLUME;
    }, duration);
  }

  function tone(frequency, duration = 0.07, type = 'triangle', gainValue = 0.06, delay = 0) {
    const audio = ensureContext();
    if (!audio) return;
    const start = audio.currentTime + delay;
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(Math.max(45, frequency), start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(Math.min(0.14, gainValue), start + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + Math.max(0.025, duration));
    oscillator.connect(gain);
    gain.connect(audio.destination);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.025);
  }

  function noise(duration = 0.12, gainValue = 0.075, highpass = 900) {
    const audio = ensureContext();
    if (!audio) return;
    const buffer = audio.createBuffer(1, Math.floor(audio.sampleRate * duration), audio.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) {
      const progress = i / data.length;
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - progress, 1.7);
    }
    const source = audio.createBufferSource();
    const filter = audio.createBiquadFilter();
    const gain = audio.createGain();
    source.buffer = buffer;
    filter.type = 'highpass';
    filter.frequency.value = highpass;
    gain.gain.setValueAtTime(Math.min(0.14, gainValue), audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + duration);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(audio.destination);
    source.start();
  }

  function playEnhancedSfx(name, payload = {}) {
    if (!soundEnabled()) return;

    if (name === 'piece_placed') {
      const cells = Math.max(1, Number(payload.cells) || 1);
      tone(310 + cells * 34, 0.045, 'triangle', 0.052);
      tone(900 + cells * 35, 0.027, 'square', 0.026, 0.012);
      return;
    }

    if (name === 'invalid_drop') {
      duckMusic(130, 0.10);
      tone(150, 0.075, 'square', 0.065);
      return;
    }

    if (name === 'line_clear') {
      const cleared = Math.max(1, Number(payload.cleared) || 1);
      duckMusic(300);
      noise(0.09, 0.052, 1250);
      tone(520, 0.075, 'triangle', 0.092);
      tone(cleared > 1 ? 930 : 780, 0.115, 'triangle', 0.082, 0.045);
      return;
    }

    if (name === 'shift') {
      duckMusic(420, 0.055);
      noise(0.17, 0.105, 760);
      tone(240, 0.12, 'sine', 0.095, 0.025);
      tone(430, 0.09, 'triangle', 0.055, 0.085);
      return;
    }

    if (name === 'line_combo') {
      const multiplier = Math.max(2, Number(payload.multiplier) || 2);
      duckMusic(340, 0.06);
      tone(690 + multiplier * 90, 0.095, 'triangle', 0.10);
      tone(930 + multiplier * 95, 0.13, 'triangle', 0.075, 0.065);
      return;
    }

    if (name === 'level_complete') {
      duckMusic(850, 0.045);
      tone(520, 0.11, 'triangle', 0.09);
      tone(760, 0.12, 'triangle', 0.09, 0.09);
      tone(1040, 0.20, 'triangle', 0.085, 0.19);
      window.setTimeout(pauseMusic, 620);
      return;
    }

    if (name === 'level_fail') {
      duckMusic(850, 0.04);
      tone(260, 0.14, 'sawtooth', 0.075);
      tone(175, 0.22, 'sawtooth', 0.065, 0.11);
      window.setTimeout(pauseMusic, 520);
    }
  }

  const baseMetric = metric;
  metric = function audioMixMetric(name, payload = {}) {
    const result = baseMetric(name, payload);
    playEnhancedSfx(name, payload);
    return result;
  };

  const baseSetupLevel = setupLevel;
  setupLevel = function audioMixSetupLevel(level = state.level) {
    const result = baseSetupLevel(level);
    window.setTimeout(syncMusic, 0);
    return result;
  };

  function unlockAudio() {
    ensureContext();
    if (!musicUnlocked && mapMusicVisible()) playMusic();
  }

  document.addEventListener('pointerdown', unlockAudio, { passive: true });
  document.addEventListener('keydown', unlockAudio, { passive: true });
  document.addEventListener('click', syncMusic);
  document.addEventListener('visibilitychange', syncMusic);

  const modalObserver = new MutationObserver(syncMusic);
  document.querySelectorAll('.meta-modal, .modal-screen').forEach((modal) => {
    modalObserver.observe(modal, { attributes: true, attributeFilter: ['hidden'], childList: true, subtree: true });
  });

  syncMusic();

  window.PomaShiftAudioMix = {
    sync: syncMusic,
    play: playMusic,
    pause: pauseMusic,
    isMapMusicVisible: mapMusicVisible,
    musicSource: MUSIC_SRC,
    musicVolume: MUSIC_VOLUME,
  };
})();
