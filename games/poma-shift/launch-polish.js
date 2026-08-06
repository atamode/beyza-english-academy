(() => {
  function installCanvasMaterial() {
    if (typeof drawBlock === 'function') {
      const baseDrawBlock = drawBlock;
      drawBlock = function polishedDrawBlock(x, y, size, color, alpha = 1) {
        const inset = Math.max(2, size * 0.06);
        const radius = Math.max(5, size * 0.17);

        // Cheap physical depth: a small painted shadow instead of canvas blur.
        ctx.save();
        ctx.globalAlpha = alpha * 0.28;
        roundedRect(
          x + inset + 1,
          y + inset + Math.max(2, size * 0.075),
          Math.max(2, size - inset * 2),
          Math.max(2, size - inset * 2),
          radius,
        );
        ctx.fillStyle = 'rgba(0, 5, 18, .72)';
        ctx.fill();
        ctx.restore();

        baseDrawBlock(x, y, size, color, alpha);

        // Sugar Cloud has its own candy treatment in meta-system.js.
        if (String(color).toLowerCase() === '#ff8fc8') return;

        ctx.save();
        ctx.globalAlpha = alpha;
        roundedRect(
          x + inset,
          y + inset,
          Math.max(2, size - inset * 2),
          Math.max(2, size - inset * 2),
          radius,
        );
        ctx.strokeStyle = 'rgba(255,255,255,.22)';
        ctx.lineWidth = Math.max(1, size * 0.025);
        ctx.stroke();

        // Soft-plastic gloss across the upper face.
        ctx.globalAlpha = alpha * 0.20;
        roundedRect(
          x + size * 0.20,
          y + size * 0.15,
          Math.max(2, size * 0.60),
          Math.max(2, size * 0.10),
          Math.max(2, size * 0.05),
        );
        ctx.fillStyle = '#ffffff';
        ctx.fill();

        // A restrained lower bevel keeps the blocks tactile without looking toy-like.
        ctx.globalAlpha = alpha * 0.14;
        roundedRect(
          x + size * 0.18,
          y + size * 0.72,
          Math.max(2, size * 0.64),
          Math.max(2, size * 0.08),
          Math.max(2, size * 0.04),
        );
        ctx.fillStyle = '#020716';
        ctx.fill();
        ctx.restore();
      };
    }

    if (typeof drawBoard === 'function') {
      const baseDrawBoard = drawBoard;
      drawBoard = function polishedDrawBoard() {
        const board = state.boardRect;
        if (board) {
          ctx.save();
          roundedRect(board.x - 10, board.y - 4, board.w + 20, board.h + 20, 22);
          ctx.fillStyle = 'rgba(0, 4, 15, .42)';
          ctx.fill();
          ctx.restore();
        }

        baseDrawBoard();

        if (!board) return;
        ctx.save();
        roundedRect(board.x - 6, board.y - 6, board.w + 12, board.h + 12, 18);
        ctx.strokeStyle = 'rgba(196, 220, 255, .10)';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.globalAlpha = 0.12;
        roundedRect(board.x + 4, board.y + 4, Math.max(2, board.w - 8), 3, 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.restore();
      };
    }
  }

  installCanvasMaterial();

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
