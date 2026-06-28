export function speak(text, muted = false) {
  if (muted || !("speechSynthesis" in window)) return;
  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-GB";
  utterance.rate = .85;
  speechSynthesis.speak(utterance);
}
export function stopAudio() { if ("speechSynthesis" in window) speechSynthesis.cancel(); }
