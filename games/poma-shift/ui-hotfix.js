(() => {
  const SAD_POMA_SRC = '../../assets/brand/poma-academy/poma-sad.png';

  const style = document.createElement('style');
  style.textContent = `
    .meta-modal-close {
      display: grid !important;
      place-items: center !important;
      width: 36px !important;
      height: 36px !important;
      padding: 0 !important;
      border-radius: 50% !important;
      border: 1px solid rgba(255,255,255,.18) !important;
      background: linear-gradient(180deg,#ff667c,#df2948) !important;
      color: #fff !important;
      font-size: 24px !important;
      font-weight: 900 !important;
      line-height: 1 !important;
      text-align: center !important;
      box-shadow: 0 8px 22px rgba(223,41,72,.35) !important;
    }

    .life-buy-row button[data-poma-life-button="1"] {
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      gap: 6px !important;
      white-space: nowrap !important;
    }

    .life-buy-row .poma-life-token {
      width: 20px !important;
      height: 20px !important;
      flex: 0 0 20px !important;
      border-width: 1px !important;
      box-shadow: none !important;
      vertical-align: middle;
    }

    .fail-view .poma-result-sad {
      display: block;
      width: 104px;
      height: 112px;
      object-fit: contain;
      margin: -8px auto 2px;
      border: 0;
      border-radius: 0;
      background: transparent;
      filter: drop-shadow(0 10px 18px rgba(0,0,0,.25));
    }

    @media (max-width: 699px) {
      .meta-modal-close {
        width: 34px !important;
        height: 34px !important;
        font-size: 22px !important;
      }
      .fail-view .poma-result-sad {
        width: 74px;
        height: 82px;
        margin: -5px auto 0;
      }
    }

    @media (max-width: 699px) and (max-height: 700px) {
      .fail-view .poma-result-sad {
        width: 60px;
        height: 66px;
      }
    }
  `;
  document.head.appendChild(style);

  function pomaLifeToken() {
    const token = document.createElement('span');
    token.className = 'poma-character-portrait char-poma poma-life-token';
    token.setAttribute('role', 'img');
    token.setAttribute('aria-label', 'Poma');
    return token;
  }

  function patchLifeButtons(root = document) {
    root.querySelectorAll?.('.life-buy-row button').forEach((button) => {
      if (button.dataset.pomaLifeButton === '1') return;
      const text = (button.textContent || '').replace(/\s+/g, ' ').trim();
      const match = text.match(/^(100|250)\s*🪙\s*→\s*\+(1|3)$/);
      if (!match) return;

      button.textContent = '';
      button.append(document.createTextNode(`${match[1]} 🪙 → `));
      button.append(pomaLifeToken());
      button.append(document.createTextNode(` +${match[2]}`));
      button.dataset.pomaLifeButton = '1';
    });
  }

  function patchCloseButtons(root = document) {
    root.querySelectorAll?.('.meta-modal-close').forEach((button) => {
      if (button.textContent !== '×') button.textContent = '×';
      if (button.getAttribute('aria-label') !== 'Kapat') button.setAttribute('aria-label', 'Kapat');
    });
  }

  function patchFailArt(root = document) {
    root.querySelectorAll?.('.fail-view').forEach((view) => {
      const art = view.querySelector('.poma-result-art');
      if (!art || art.classList.contains('poma-result-sad')) return;
      if (art.dataset.sadPomaPending === '1') return;

      art.dataset.sadPomaPending = '1';
      const sad = document.createElement('img');
      sad.className = 'poma-result-art poma-result-sad';
      sad.alt = 'Üzgün Poma';

      sad.addEventListener('load', () => {
        if (art.isConnected) art.replaceWith(sad);
      }, { once: true });

      sad.addEventListener('error', () => {
        delete art.dataset.sadPomaPending;
      }, { once: true });

      sad.src = SAD_POMA_SRC;
    });
  }

  function patchUi(root = document) {
    patchLifeButtons(root);
    patchCloseButtons(root);
    patchFailArt(root);
  }

  // Fix tray rendering at the source: every shape scales against BOTH slot width and slot height.
  // This prevents vertical 4-cell pieces from escaping the tray card on desktop and mobile.
  if (typeof drawTray === 'function') {
    drawTray = function fittedDrawTray() {
      state.tray.forEach((piece, index) => {
        const rect = state.trayRects[index];
        if (!rect) return;

        roundedRect(rect.x, rect.y, rect.w, rect.h, 18);
        ctx.fillStyle = piece.used ? '#111a2d' : '#1a2949';
        ctx.fill();
        ctx.strokeStyle = piece.used ? '#1f2a3f' : '#334b78';
        ctx.stroke();

        if (piece.used) return;

        const bounds = pieceBounds(piece.cells);
        const byWidth = Math.floor((rect.w - 22) / Math.max(1, bounds.w));
        const byHeight = Math.floor((rect.h - 16) / Math.max(1, bounds.h));
        const unit = Math.max(12, Math.min(25, byWidth, byHeight));
        const pieceW = bounds.w * unit;
        const pieceH = bounds.h * unit;
        const ox = rect.x + (rect.w - pieceW) / 2;
        const oy = rect.y + (rect.h - pieceH) / 2;

        piece.cells.forEach(([dx, dy]) => {
          drawBlock(ox + dx * unit, oy + dy * unit, unit, piece.color);
        });
      });
    };
  }

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      mutation.addedNodes.forEach((node) => {
        if (node instanceof Element) patchUi(node);
      });
    }
  });

  function start() {
    patchUi(document);
    observer.observe(document.body, { childList: true, subtree: true });
    if (typeof render === 'function') render();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
