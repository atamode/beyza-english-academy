(() => {
  const LOADOUT_KEY = 'pomaShift.loadout.v2';

  function readLobbySelection() {
    try {
      const parsed = JSON.parse(localStorage.getItem(LOADOUT_KEY) || '[]');
      return Array.isArray(parsed) ? parsed.slice(0, 3) : [];
    } catch {
      return [];
    }
  }

  function sync() {
    const api = window.PomaShiftLoadout;
    if (typeof api?.setSelected !== 'function') return [];
    return api.setSelected(readLobbySelection());
  }

  document.addEventListener('click', (event) => {
    if (!event.target.closest('[data-lobby-play]')) return;
    sync();
  }, true);

  window.PomaShiftLoadoutSync = { sync };
})();
