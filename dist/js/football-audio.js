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
  TROPHY: ["trophy"]
};

export function createFootballAudio({ muted = false, storage = localStorage } = {}) {
  let ctx = null, ambient = null, unlocked = false;
  const state = {
    muted: Boolean(muted),
    played: [],
    failures: 0,
    get unlocked() { return unlocked; }
  };
  const save = () => {
    try { storage.setItem("beyzaAcademy.games.football.v1.audio", JSON.stringify({ muted: state.muted })); } catch {}
  };
  const ensure = () => {
    if (state.muted) return null;
    if (!ctx) {
      const Ctor = globalThis.AudioContext || globalThis.webkitAudioContext;
      if (!Ctor) return null;
      try { ctx = new Ctor(); }
      catch { state.failures++; return null; }
    }
    unlocked = true;
    ctx.resume?.().catch?.(() => {});
    return ctx;
  };
  const tone = (freq, dur = 0.12, gain = 0.035, type = "sine") => {
    const audio = ensure();
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
  return {
    state,
    setMuted(value) { state.muted = Boolean(value); if (state.muted) this.stopAmbient(); save(); },
    unlock() { ensure(); },
    startAmbient() {
      const audio = ensure();
      if (!audio || ambient) return;
      try {
        const osc = audio.createOscillator(), g = audio.createGain();
        osc.type = "sine";
        osc.frequency.value = 95;
        g.gain.value = 0.006;
        osc.connect(g).connect(audio.destination);
        osc.start();
        ambient = { osc, g };
      } catch { state.failures++; }
    },
    stopAmbient() {
      try { ambient?.osc?.stop?.(); } catch {}
      ambient = null;
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
