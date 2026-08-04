(() => {
  const card = document.querySelector('.game-card');
  const timer = document.querySelector('.series-timer');
  if (!card || !timer) return;

  let beatHandle = 0;
  let audioContext = null;

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

  function thump(delay = 0, frequency = 72, gainValue = 0.012) {
    const audio = ensureAudio();
    if (!audio) return;
    const start = audio.currentTime + delay;
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(frequency, start);
    osc.frequency.exponentialRampToValueAtTime(Math.max(45, frequency - 18), start + 0.075);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(gainValue, start + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.095);
    osc.connect(gain);
    gain.connect(audio.destination);
    osc.start(start);
    osc.stop(start + 0.11);
  }

  function beat() {
    if (!card.classList.contains('timer-heartbeat') || document.hidden) return;
    if (card.dataset.shiftThreat === '2') return;

    // Two soft beats: enough to create urgency without turning the game into a siren.
    thump(0, 72, 0.011);
    thump(0.13, 64, 0.008);
    if (navigator.vibrate) navigator.vibrate([6, 72, 9]);
  }

  function startBeats() {
    if (beatHandle) return;
    beat();
    beatHandle = window.setInterval(beat, 1020);
  }

  function stopBeats() {
    window.clearInterval(beatHandle);
    beatHandle = 0;
    if (navigator.vibrate) navigator.vibrate(0);
  }

  function syncHeartbeat() {
    const active = timer.classList.contains('is-hot') &&
      !timer.classList.contains('is-paused') &&
      !timer.classList.contains('is-expired') &&
      state.status === 'playing' &&
      !document.hidden;

    card.classList.toggle('timer-heartbeat', active);
    if (active) startBeats();
    else stopBeats();
  }

  const observer = new MutationObserver(syncHeartbeat);
  observer.observe(timer, {
    attributes: true,
    attributeFilter: ['class'],
  });

  document.addEventListener('pointerdown', ensureAudio, { once: true, passive: true });
  document.addEventListener('visibilitychange', syncHeartbeat);
  syncHeartbeat();
})();