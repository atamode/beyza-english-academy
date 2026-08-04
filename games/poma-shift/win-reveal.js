(() => {
  const screen = document.querySelector('.modal-screen');
  const content = screen?.querySelector('[data-modal-content]');
  if (!screen || !content) return;

  let revealTimer = 0;
  let lastWinKey = '';

  function delayWinOnce() {
    const winView = content.querySelector('.win-view');
    if (!winView) return;

    // showWin() renders the result after the final SHIFT. Delay that result only once
    // so the transformed board remains visible, then leave the modal system alone.
    const key = `${state.level}:${state.shiftsDone}:${state.levelStartedAt}`;
    if (key === lastWinKey) return;
    lastWinKey = key;

    window.clearTimeout(revealTimer);
    screen.hidden = true;
    revealTimer = window.setTimeout(() => {
      // Only reopen if this same win screen is still the active modal.
      if (content.querySelector('.win-view')) screen.hidden = false;
    }, 420);
  }

  // Watch only modal content changes. Do NOT observe the hidden attribute: doing so
  // causes an open -> hide -> open loop and breaks Next Level / Map progression.
  const observer = new MutationObserver(() => delayWinOnce());
  observer.observe(content, {
    childList: true,
    subtree: true,
  });
})();
