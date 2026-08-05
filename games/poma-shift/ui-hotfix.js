(() => {
  const SAD_POMA_SRC = '../../assets/brand/poma-academy/poma-sad.png';

  function normalizeGameCopy(value) {
    if (typeof value !== 'string') return value;
    return value
      .replace(/RUSH tavanındaki 2 tehlike satırına blok değdi\./gi, 'RUSH: Blok loft bölgesine değdi.')
      .replace(/Tavan satırına blok değdi\./gi, 'Blok lofta değdi.')
      .replace(/Tavan bloklara çarptı\./gi, 'Blok lofta değdi.')
      .replace(/TAVAN/g, 'LOFT')
      .replace(/Tavan/g, 'Loft')
      .replace(/tavan/g, 'loft');
  }

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

    .fail-view {
      gap: 8px !important;
      padding-top: 2px !important;
      padding-bottom: 2px !important;
    }

    .fail-view .result-icon {
      display: none !important;
    }

    .fail-view .poma-result-sad {
      display: block !important;
      width: 88px !important;
      height: 96px !important;
      object-fit: contain !important;
      margin: -8px auto 0 !important;
      border: 0 !important;
      border-radius: 0 !important;
      background: transparent !important;
      box-shadow: none !important;
      filter: drop-shadow(0 9px 16px rgba(0,0,0,.24));
    }

    .fail-view .eyebrow {
      margin-top: -2px !important;
    }

    .fail-view h2 {
      margin: 2px 0 0 !important;
      line-height: 1.05 !important;
    }

    .fail-view > p {
      margin: 2px 0 !important;
    }

    .fail-view .continue-ad-action,
    .fail-view .primary-action,
    .fail-view .secondary-action {
      margin-top: 6px !important;
    }

    .fail-view .fail-life-line {
      margin: 2px 0 0 !important;
    }

    @media (max-width: 699px) {
      .meta-modal-close {
        width: 34px !important;
        height: 34px !important;
        font-size: 22px !important;
      }
      .fail-view .poma-result-sad {
        width: 72px !important;
        height: 78px !important;
        margin: -5px auto -1px !important;
      }
    }

    @media (max-width: 699px) and (max-height: 700px) {
      .fail-view .poma-result-sad {
        width: 60px !important;
        height: 64px !important;
      }
      .fail-view { gap: 5px !important; }
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

  function patchVisibleCopy(root = document) {
    const nodes = [];
    if (root.nodeType === Node.TEXT_NODE) nodes.push(root);
    if (root.nodeType === Node.ELEMENT_NODE || root.nodeType === Node.DOCUMENT_NODE) {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      let node = walker.nextNode();
      while (node) {
        nodes.push(node);
        node = walker.nextNode();
      }
    }
    nodes.forEach((node) => {
      const next = normalizeGameCopy(node.nodeValue || '');
      if (next !== node.nodeValue) node.nodeValue = next;
    });
  }

  function patchFailArt(root = document) {
    root.querySelectorAll?.('.fail-view').forEach((view) => {
      const currentSad = view.querySelector('.poma-result-sad');
      if (currentSad) {
        currentSad.classList.add('poma-result-avatar', 'poma-result-art');
        currentSad.src = SAD_POMA_SRC;
        currentSad.alt = 'Üzgün Poma';
        return;
      }

      view.querySelectorAll('.poma-result-avatar, .poma-result-art').forEach((node) => node.remove());
      view.querySelector('.result-icon')?.remove();

      const sad = document.createElement('img');
      sad.className = 'poma-result-avatar poma-result-art poma-result-sad';
      sad.alt = 'Üzgün Poma';
      sad.src = SAD_POMA_SRC;
      view.prepend(sad);
    });
  }

  function patchUi(root = document) {
    patchLifeButtons(root);
    patchCloseButtons(root);
    patchFailArt(root);
    patchVisibleCopy(root);
  }

  if (typeof setMessage === 'function') {
    const baseSetMessage = setMessage;
    setMessage = function loftSetMessage(text) {
      return baseSetMessage(normalizeGameCopy(text));
    };
  }

  if (typeof lose === 'function') {
    const baseLose = lose;
    lose = function loftLose(reason, reasonCode = 'unknown') {
      return baseLose(normalizeGameCopy(reason), reasonCode);
    };
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
        if (node instanceof Element || node.nodeType === Node.TEXT_NODE) patchUi(node);
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
