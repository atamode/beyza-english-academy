(() => {
  const dock = document.querySelector('.power-dock');
  if (!dock) return;

  function syncPowerDockVisibility() {
    try {
      const snapshot = window.PomaShiftMeta?.snapshot?.();
      const unlocked = snapshot?.meta?.unlocked || {};
      dock.hidden = !Object.values(unlocked).some(Boolean);
    } catch {
      dock.hidden = true;
    }
  }

  syncPowerDockVisibility();
  window.setInterval(syncPowerDockVisibility, 1000);
})();
