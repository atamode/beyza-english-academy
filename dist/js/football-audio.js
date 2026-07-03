export const SPORT_MUSIC_URL = "assets/audio/sports/poma-sports-loop.mp3";

export const FOOTBALL_SOUND_EVENTS = {
  MATCH_INTRO: ["whistle"],
  PASS_SUCCESS: ["kick", "positive"],
  GIVE_AND_GO_SUCCESS: ["kick", "positive"],
  PASS_FAILED: ["negative"],
  SHOT_PREPARE: ["kick"],
  SHOT_MISSED_POST: ["post"],
  GOAL_SCORED: ["crowd"],
  SAVE_SUCCESS: ["catch"],
  GOAL_CONCEDED: ["shock"],
  passSuccess: ["kick", "positive"],
  shotSuccess: ["kick", "crowd"],
  shotMissed: ["negative"],
  defenceSuccess: ["catch", "positive"],
  saveSuccess: ["catch", "positive"],
  conceded: ["shock"],
  win: ["trophy"],
  lose: ["negative"],
  TROPHY: ["trophy"]
};

let sharedManager = null;

export function getSportAudioManager(options = {}) {
  if (!sharedManager) sharedManager = createSportAudioManager(options);
  if ("muted" in options) sharedManager.setMuted(Boolean(options.muted));
  return sharedManager;
}

export function createSportAudioManager({ muted = false, storage = globalThis.localStorage, musicUrl = SPORT_MUSIC_URL, AudioClass = globalThis.Audio } = {}) {
  let ctx = null, music = null, unlocked = false, ducked = false;
  const attachedVideos = new Set();
  const state = {
    muted: Boolean(muted),
    musicUrl,
    played: [],
    failures: 0,
    musicStarted: false,
    get unlocked() { return unlocked; },
    get ducked() { return ducked; },
    get attachedVideoCount() { return attachedVideos.size; }
  };
  const save = () => {
    try { storage?.setItem?.("beyzaAcademy.games.sport.audio", JSON.stringify({ muted: state.muted })); } catch {}
  };
  const ensureMusic = () => {
    if (music || !AudioClass) return music;
    try {
      music = new AudioClass(musicUrl);
      music.loop = true;
      music.volume = 0.22;
      music.preload = "auto";
    } catch {
      state.failures++;
      music = null;
    }
    return music;
  };
  const ensureCtx = () => {
    if (state.muted) return null;
    if (!ctx) {
      const Ctor = globalThis.AudioContext || globalThis.webkitAudioContext;
      if (!Ctor) return null;
      try { ctx = new Ctor(); }
      catch { state.failures++; return null; }
    }
    ctx.resume?.().catch?.(() => {});
    return ctx;
  };
  const tone = (freq, dur = 0.12, gain = 0.035, type = "sine") => {
    const audio = ensureCtx();
    if (!audio) return false;
    try {
      const osc = audio.createOscillator(), g = audio.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, audio.currentTime);
      g.gain.exponentialRampToValueAtTime(gain, audio.currentTime + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + dur);
      osc.connect(g).connect(audio.destination);
      osc.start();
      osc.stop(audio.currentTime + dur + 0.02);
      return true;
    } catch {
      state.failures++;
      return false;
    }
  };
  const setVideoMute = () => {
    for (const video of attachedVideos) {
      try { video.muted = state.muted; } catch {}
    }
  };
  const playMusic = (volume = 0.22) => {
    if (state.muted || !unlocked) return false;
    const player = ensureMusic();
    if (!player) return false;
    try {
      player.loop = true;
      player.volume = volume;
      const result = player.play?.();
      state.musicStarted = true;
      if (result?.catch) result.catch(() => { state.failures++; });
      return true;
    } catch {
      state.failures++;
      return false;
    }
  };
  return {
    state,
    setMuted(value) {
      state.muted = Boolean(value);
      setVideoMute();
      if (state.muted) this.stopAmbient();
      else if (unlocked && state.musicStarted) playMusic(ducked ? 0.06 : 0.22);
      save();
    },
    unlock() {
      unlocked = true;
      ensureMusic();
      ensureCtx();
      setVideoMute();
    },
    startAmbient() {
      this.unlock();
      ducked = false;
      return playMusic(0.22);
    },
    stopAmbient() {
      try { music?.pause?.(); } catch {}
      state.musicStarted = false;
      ducked = false;
    },
    duckForVideo(video, { resume = true } = {}) {
      this.attachVideo(video);
      ducked = true;
      if (music) {
        try {
          if (resume) music.volume = 0.06;
          else music.pause?.();
        } catch { state.failures++; }
      }
    },
    restoreAfterVideo({ resume = true } = {}) {
      ducked = false;
      if (!resume) return;
      if (unlocked && !state.muted) playMusic(0.22);
    },
    attachVideo(video) {
      if (!video) return () => {};
      attachedVideos.add(video);
      try { video.muted = state.muted; } catch {}
      return () => { attachedVideos.delete(video); };
    },
    play(name) {
      if (state.muted) return false;
      state.played.push(name);
      const ok = {
        whistle: () => tone(1300, 0.08, 0.025, "square"),
        kick: () => tone(110, 0.08, 0.04, "triangle"),
        positive: () => tone(660, 0.1, 0.025, "sine"),
        negative: () => tone(160, 0.16, 0.025, "sawtooth"),
        post: () => tone(980, 0.22, 0.035, "square"),
        crowd: () => { tone(440, 0.18, 0.02); return tone(660, 0.22, 0.02); },
        catch: () => tone(180, 0.12, 0.03, "triangle"),
        shock: () => tone(120, 0.18, 0.03, "sawtooth"),
        trophy: () => { tone(523, 0.09, 0.025); tone(784, 0.12, 0.025); return true; }
      }[name]?.();
      return Boolean(ok);
    },
    playForVisual(visual) {
      if (state.muted) return [];
      const list = FOOTBALL_SOUND_EVENTS[visual] || [];
      return list.map(name => this.play(name));
    }
  };
}

export function createFootballAudio(options = {}) {
  return getSportAudioManager(options);
}
