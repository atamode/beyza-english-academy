(() => {
  const screen = document.querySelector('.modal-screen');
  if (!screen) return;

  let delaying = false;

  const observer = new MutationObserver(() => {
    if (delaying || screen.hidden) return;
    const winView = screen.querySelector('.win-view');
    if (!winView) return;

    // Level completion is caused by the target SHIFT. Keep the transformed board
    // visible long enough for the player to actually perceive the widen/lower mechanic.
    delaying = true;
    screen.hidden = true;
    window.setTimeout(() => {
      if (screen.querySelector('.win-view')) screen.hidden = false;
      delaying = false;
    }, 420);
  });

  observer.observe(screen, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['hidden'],
  });
})();
