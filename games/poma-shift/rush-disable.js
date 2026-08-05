(() => {
  // Legacy RUSH used a short timer per 3-piece tray. That design was exploitable:
  // a player could wait for the tray to burn and fish for a better deal.
  // Keep that timer disabled permanently. The real RUSH rule now lives in rush-mode.js
  // and times the whole level instead of refreshing pieces.
  const nativeSetInterval = window.setInterval.bind(window);

  window.setInterval = function pomaShiftInterval(handler, timeout, ...args) {
    if (typeof handler === 'function' && handler.name === 'updateTrayTimer') return 0;
    return nativeSetInterval(handler, timeout, ...args);
  };

  window.PomaShiftLegacyTrayRushDisabled = true;
})();
