(() => {
  const SAD_POMA = 'data:image/webp;base64,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';

  const style = document.createElement('style');
  style.textContent = `
    .meta-modal-close {
      display: grid !important;
      place-items: center !important;
      background: linear-gradient(180deg, #ff6a82, #e93f5b) !important;
      color: #fff !important;
      border: 1px solid rgba(255,255,255,.18) !important;
      box-shadow: 0 8px 20px rgba(233,63,91,.32) !important;
      line-height: 1 !important;
      padding: 0 !important;
    }
    .poma-life-icon {
      display: inline-block;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      vertical-align: middle;
      background-image: url('../../assets/brand/poma-academy/poma-shift-character-sprite.webp');
      background-size: 200% 400%;
      background-position: 0 0;
      background-repeat: no-repeat;
      border: 1px solid rgba(255,255,255,.18);
      box-shadow: 0 2px 6px rgba(0,0,0,.25);
    }
    .life-buy-row button {
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      gap: 5px !important;
      white-space: nowrap;
    }
    .poma-sad-result {
      display: block;
      width: 92px;
      height: 92px;
      object-fit: contain;
      margin: -4px auto 8px;
      filter: drop-shadow(0 10px 18px rgba(0,0,0,.28));
    }
    @media (max-width: 699px) {
      .poma-sad-result { width: 56px; height: 56px; margin: -2px auto 2px; }
    }
    @media (max-width: 699px) and (max-height: 700px) {
      .poma-sad-result { width: 44px; height: 44px; }
    }
  `;
  document.head.appendChild(style);

  function patchFail(root = document) {
    root.querySelectorAll?.('.fail-view').forEach((view) => {
      if (view.querySelector('.poma-sad-result')) return;
      view.querySelector('.poma-result-art')?.remove();
      const sad = document.createElement('img');
      sad.className = 'poma-sad-result';
      sad.src = SAD_POMA;
      sad.alt = 'Üzgün Poma';
      view.prepend(sad);
    });
  }

  function patchLives(root = document) {
    root.querySelectorAll?.('.life-buy-row button').forEach((button) => {
      const text = (button.textContent || '').replace(/\s+/g, ' ').trim();
      if (button.dataset.pomaLifePatched === '1') return;
      if (/100/.test(text) && /\+\s*1/.test(text)) {
        button.innerHTML = '100 🪙 → <span class="poma-life-icon" aria-hidden="true"></span> +1';
        button.dataset.pomaLifePatched = '1';
      } else if (/250/.test(text) && /\+\s*3/.test(text)) {
        button.innerHTML = '250 🪙 → <span class="poma-life-icon" aria-hidden="true"></span> +3';
        button.dataset.pomaLifePatched = '1';
      }
    });
  }

  function patchClose(root = document) {
    root.querySelectorAll?.('.meta-modal-close').forEach((button) => {
      button.textContent = '×';
      button.setAttribute('aria-label', 'Kapat');
    });
  }

  const baseDrawTray = drawTray;
  drawTray = function fittedDrawTray() {
    state.tray.forEach((piece, index) => {
      const rect = state.trayRects[index];
      roundedRect(rect.x, rect.y, rect.w, rect.h, 18);
      ctx.fillStyle = piece.used ? '#111a2d' : '#1a2949';
      ctx.fill();
      ctx.strokeStyle = piece.used ? '#1f2a3f' : '#334b78';
      ctx.stroke();

      if (piece.used) return;

      const { w, h } = pieceBounds(piece.cells);
      const maxByWidth = Math.floor((rect.w - 18) / Math.max(1, w));
      const maxByHeight = Math.floor((rect.h - 10) / Math.max(1, h));
      const unit = Math.max(14, Math.min(25, maxByWidth, maxByHeight));
      const pieceW = w * unit;
      const pieceH = h * unit;
      const ox = rect.x + (rect.w - pieceW) / 2;
      const oy = rect.y + (rect.h - pieceH) / 2;

      piece.cells.forEach(([dx, dy]) => {
        drawBlock(ox + dx * unit, oy + dy * unit, unit, piece.color);
      });
    });
  };

  function patch(root = document) {
    patchFail(root);
    patchLives(root);
    patchClose(root);
  }

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => mutation.addedNodes.forEach((node) => {
      if (node instanceof Element) patch(node);
    }));
    patch(document);
  });
  observer.observe(document.body, { childList: true, subtree: true });
  patch(document);
  render();
})();
