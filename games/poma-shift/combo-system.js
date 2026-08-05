(() => {
  // Action-based combo: no timer, no waiting exploit.
  // Every successfully placed piece that clears at least one row extends the chain.
  // A placed piece that clears no row resets it.
  const MAX_MULTIPLIER = 5;
  const card = document.querySelector('.game-card');
  if (!card) return;

  let chain = 0;
  let hideTimer = 0;

  const badge = document.createElement('div');
  badge.className = 'combo-badge';
  badge.hidden = true;
  badge.setAttribute('aria-live', 'polite');
  badge.innerHTML = '<strong data-combo-title></strong><span data-combo-points></span>';
  card.appendChild(badge);

  const title = badge.querySelector('[data-combo-title]');
  const points = badge.querySelector('[data-combo-points]');

  const style = document.createElement('style');
  style.textContent = `
    .combo-badge {
      position: absolute;
      z-index: 12;
      left: 50%;
      top: 72px;
      transform: translate(-50%, -8px) scale(.92);
      min-width: 128px;
      padding: 8px 14px 7px;
      border-radius: 16px;
      text-align: center;
      pointer-events: none;
      background: rgba(7,16,34,.88);
      border: 1px solid rgba(255,209,102,.48);
      box-shadow: 0 10px 30px rgba(0,0,0,.30), 0 0 24px rgba(255,183,3,.12);
      opacity: 0;
    }
    .combo-badge[hidden] { display: none; }
    .combo-badge.is-showing { animation: comboPop .72s cubic-bezier(.2,.8,.2,1); }
    .combo-badge strong {
      display: block;
      color: #ffd166;
      font-size: 17px;
      line-height: 1.05;
      letter-spacing: .03em;
    }
    .combo-badge span {
      display: block;
      margin-top: 3px;
      color: #dce8ff;
      font-size: 11px;
      font-weight: 850;
    }
    @keyframes comboPop {
      0% { opacity: 0; transform: translate(-50%, 4px) scale(.78); }
      20% { opacity: 1; transform: translate(-50%, -5px) scale(1.08); }
      72% { opacity: 1; transform: translate(-50%, -8px) scale(1); }
      100% { opacity: 0; transform: translate(-50%, -15px) scale(.98); }
    }
    @media (max-width: 699px) {
      .combo-badge { top: 48px; min-width: 112px; padding: 6px 11px; border-radius: 13px; }
      .combo-badge strong { font-size: 15px; }
      .combo-badge span { font-size: 10px; }
    }
    @media (prefers-reduced-motion: reduce) {
      .combo-badge.is-showing { animation-duration: .01ms !important; }
    }
  `;
  document.head.appendChild(style);

  function showCombo(cleared, multiplier, awardedPoints) {
    window.clearTimeout(hideTimer);
    badge.hidden = false;
    title.textContent = chain <= 1 ? (cleared > 1 ? `${cleared} SATIR!` : 'TEMİZ!') : `COMBO ×${multiplier}`;
    points.textContent = `+${awardedPoints} PUAN${cleared > 1 ? ` · ${cleared} SATIR` : ''}`;
    badge.classList.remove('is-showing');
    void badge.offsetWidth;
    badge.classList.add('is-showing');
    hideTimer = window.setTimeout(() => {
      badge.classList.remove('is-showing');
      badge.hidden = true;
    }, 740);
  }

  function resetCombo() {
    chain = 0;
  }

  const basePlacePiece = placePiece;
  placePiece = function comboPlacePiece(piece, col, row) {
    const beforeMoves = state.moves;
    const beforeLines = state.linesCleared;
    const result = basePlacePiece(piece, col, row);

    // Ignore invalid drops and other calls that did not actually place a piece.
    if (!result || state.moves <= beforeMoves) return result;

    const cleared = Math.max(0, state.linesCleared - beforeLines);
    if (!cleared) {
      resetCombo();
      return result;
    }

    chain += 1;
    const multiplier = Math.min(MAX_MULTIPLIER, chain);
    const baseClearPoints = cleared * cleared * 100;
    const bonus = baseClearPoints * (multiplier - 1);
    if (bonus > 0) state.score += bonus;

    const awardedPoints = baseClearPoints + bonus;
    showCombo(cleared, multiplier, awardedPoints);
    metric('line_combo', {
      chain,
      multiplier,
      cleared,
      baseClearPoints,
      bonus,
      awardedPoints,
      score: state.score,
    });
    return result;
  };

  const baseSetupLevel = setupLevel;
  setupLevel = function comboSetupLevel(level = state.level) {
    resetCombo();
    badge.hidden = true;
    return baseSetupLevel(level);
  };

  window.PomaShiftCombo = {
    snapshot() {
      return { chain, multiplier: Math.min(MAX_MULTIPLIER, Math.max(1, chain)) };
    },
  };
})();
