(() => {
  // Legacy RUSH used a short timer per 3-piece tray. That design is permanently invalid.
  // The authoritative RUSH timer lives in rush-mode.js and times the whole level.
  const nativeSetInterval = window.setInterval.bind(window);
  const functionSource = Function.prototype.toString;

  function isLegacyTrayTimer(handler, timeout) {
    if (typeof handler !== 'function') return false;
    if (handler.name === 'updateTrayTimer') return true;
    if (Number(timeout) !== 50) return false;

    try {
      const source = functionSource.call(handler);
      return source.includes('trayTimerEndsAt') ||
        source.includes('trayTimerDuration') ||
        source.includes('expireTray()');
    } catch {
      return false;
    }
  }

  window.setInterval = function pomaShiftInterval(handler, timeout, ...args) {
    if (isLegacyTrayTimer(handler, timeout)) return 0;
    return nativeSetInterval(handler, timeout, ...args);
  };

  window.PomaShiftLegacyTrayRushDisabled = true;
})();
