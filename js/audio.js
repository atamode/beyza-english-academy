export function createSpeechHelper({ muted = false, lang = "en-GB", rate = .85, synthesis = globalThis.speechSynthesis, Utterance = globalThis.SpeechSynthesisUtterance } = {}) {
  const state = { muted: Boolean(muted), failures: 0, spoken: [], stopped: false };
  return {
    state,
    setMuted(value) {
      state.muted = Boolean(value);
      if (state.muted) this.stop();
    },
    speak(text) {
      if (state.muted || !text || !synthesis || !Utterance) return false;
      try {
        synthesis.cancel?.();
        const utterance = new Utterance(String(text));
        utterance.lang = lang;
        utterance.rate = rate;
        synthesis.speak?.(utterance);
        state.spoken.push(String(text));
        state.stopped = false;
        return true;
      } catch {
        state.failures++;
        return false;
      }
    },
    stop() {
      try { synthesis?.cancel?.(); }
      catch { state.failures++; }
      state.stopped = true;
    }
  };
}

let sharedSpeech = null;

export function speak(text, muted = false) {
  sharedSpeech ||= createSpeechHelper({ muted });
  sharedSpeech.setMuted(muted);
  return sharedSpeech.speak(text);
}

export function stopAudio() {
  sharedSpeech ||= createSpeechHelper();
  sharedSpeech.stop();
}
