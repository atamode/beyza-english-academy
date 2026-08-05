(() => {
  const dock = document.querySelector('.power-dock');
  if (!dock) return;

  const STORAGE_KEY = 'pomaShift.powerDockOpen.v1';
  const head = dock.querySelector('.power-dock-head');
  const list = dock.querySelector('.power-list');
  const title = head?.querySelector('span');
  let toggle = head?.querySelector('[data-power-toggle]');

  if (head && !toggle) {
    toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.dataset.powerToggle = '1';
    toggle.className = 'power-toggle';
    toggle.setAttribute('aria-expanded', 'false');
    head.insertBefore(toggle, head.querySelector('[data-meta-shop]'));
  }

  function unlockedCount() {
    try {
      const snapshot = window.PomaShiftMeta?.snapshot?.();
      const unlocked = snapshot?.meta?.unlocked || {};
      return Object.values(unlocked).filter(Boolean).length;
    } catch {
      return 0;
    }
  }

  function defaultOpen() {
    return window.matchMedia?.('(min-width: 700px)').matches || false;
  }

  function isOpen() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === '1') return true;
    if (stored === '0') return false;
    return defaultOpen();
  }

  function setOpen(open, { persist = true } = {}) {
    dock.classList.toggle('is-collapsed', !open);
    if (list) list.hidden = !open;
    if (toggle) {
      toggle.textContent = open ? 'KAPAT' : 'GÜÇLER';
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Karakter güçlerini kapat' : 'Karakter güçlerini aç');
    }
    if (persist) localStorage.setItem(STORAGE_KEY, open ? '1' : '0');
  }

  function syncPowerDockVisibility() {
    const count = unlockedCount();
    dock.hidden = count === 0;
    if (title) title.textContent = count ? `Karakter Güçleri · ${count}/7` : 'Karakter Güçleri';
    if (!dock.hidden) setOpen(isOpen(), { persist: false });
  }

  toggle?.addEventListener('click', () => setOpen(dock.classList.contains('is-collapsed')));

  syncPowerDockVisibility();
  window.setInterval(syncPowerDockVisibility, 1000);
})();
