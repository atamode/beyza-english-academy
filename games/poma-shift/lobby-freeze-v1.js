(() => {
  let startingLevel = false;

  function freezeBehindLobby() {
    if (startingLevel || !document.body.classList.contains('poma-lobby-open')) return;
    try {
      if (typeof state !== 'undefined' && state.status === 'playing') state.status = 'lobby';
    } catch {}
  }

  document.addEventListener('pointerdown', (event) => {
    if (event.target.closest('[data-lobby-play]')) {
      startingLevel = true;
      window.setTimeout(() => { startingLevel = false; }, 400);
      return;
    }
    if (event.target.closest('[data-action="map"]')) startingLevel = false;
  }, true);

  window.setInterval(freezeBehindLobby, 50);
  window.setTimeout(freezeBehindLobby, 0);
})();
