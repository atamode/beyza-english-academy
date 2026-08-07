(() => {
  // Lobby pause is event driven. Never poll/mutate gameplay state every few ms.
  document.addEventListener('poma:lobby-state', (event) => {
    if (!event.detail?.open) return;
    try {
      if (typeof state !== 'undefined' && state.status === 'playing') state.status = 'lobby';
    } catch {}
  });
})();
