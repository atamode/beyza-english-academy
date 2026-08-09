(() => {
  const cloud = window.PomaShiftCloudCore;
  const rush = window.PomaShiftRush;
  if (!cloud || !rush) return;

  function patchIntroCopy() {
    const intro = document.querySelector('.rush-intro');
    if (!intro) return;
    const rules = intro.querySelectorAll('.rush-rule');
    if (rules[1]) rules[1].innerHTML = '☁️ Şeker Bulutu büyürken sıradaki <strong>2 tehlike satırı</strong> boş kalmalı.';
    const badge = intro.querySelector('.rush-intro-badge');
    if (badge) badge.textContent = '⚡ RUSH BÖLÜMÜ';
  }

  function fullRowsNow() {
    const rows = [];
    for (let row = 0; row < state.grid.length; row += 1) {
      if (state.grid[row].every(Boolean)) rows.push(row);
    }
    return rows;
  }

  function rushDangerBlocked(fullRows) {
    if (!rush.isRushLevel?.(state.level)) return false;
    if (window.PomaShiftCloudShield?.active?.()) return false;
    const start = cloud.cloudRows();
    for (let offset = 0; offset < 2; offset += 1) {
      const row = start + offset;
      if (row >= 9) return true;
      if (fullRows.includes(row)) continue;
      if (state.grid[row]?.some(Boolean)) return true;
    }
    return false;
  }

  // Apply the real danger zone relative to the current cloud edge. The legacy RUSH
  // layer remains underneath for timer/result handling, but no longer defines geometry.
  const baseClearLines = clearLines;
  clearLines = function sugarCloudRushClearLines() {
    if (!rush.isRushLevel?.(state.level) || state.status !== 'playing') return baseClearLines();
    const fullRows = fullRowsNow();
    const pendingShift = fullRows.length > 0 && state.linesTowardShift + fullRows.length >= state.shiftEvery;
    if (pendingShift && rushDangerBlocked(fullRows)) {
      metric('cloud_crush_danger_zone', { dangerRows: 2, cloudRows: cloud.cloudRows(), rush: true });
      lose('RUSH: Şeker Bulutu’nun önündeki 2 tehlike satırı boş olmalı.', 'cloud_crush');
      return;
    }
    return baseClearLines();
  };

  const baseDrawBoard = drawBoard;
  drawBoard = function sugarCloudRushDrawBoard() {
    baseDrawBoard();
    if (!rush.isRushLevel?.(state.level) || !state.boardRect || state.status !== 'playing') return;
    const { x, y, w, cell } = state.boardRect;
    const start = cloud.cloudRows();
    const armed = state.linesTowardShift >= state.shiftEvery - 1;
    ctx.save();
    for (let offset = 0; offset < 2; offset += 1) {
      const row = start + offset;
      if (row >= 9) continue;
      ctx.fillStyle = armed ? 'rgba(255,73,113,.17)' : 'rgba(255,111,149,.055)';
      ctx.fillRect(x + 1, y + row * cell + 1, w - 2, cell - 2);
      ctx.strokeStyle = armed ? 'rgba(255,137,161,.66)' : 'rgba(255,137,161,.22)';
      ctx.lineWidth = armed ? 2 : 1;
      ctx.strokeRect(x + 1.5, y + row * cell + 1.5, w - 3, cell - 3);
    }
    ctx.restore();
  };

  function recoverRushInput() {
    const intro = document.querySelector('.rush-intro');
    if (intro?.hidden) intro.style.pointerEvents = 'none';
    const canvasNode = document.getElementById('game');
    const gameCard = document.querySelector('.game-card');
    if (canvasNode && state.status === 'playing') {
      canvasNode.style.pointerEvents = 'auto';
      canvasNode.removeAttribute('inert');
    }
    if (gameCard && state.status === 'playing') {
      gameCard.style.pointerEvents = 'auto';
      gameCard.removeAttribute('inert');
    }
    if (state.status === 'playing') {
      state.drag = null;
      state.hover = null;
      render();
    }
  }

  function wireStartRecovery() {
    const intro = document.querySelector('.rush-intro');
    const start = intro?.querySelector('[data-rush-start]');
    if (!intro || !start || start.dataset.cloudRecovery === '1') return;
    start.dataset.cloudRecovery = '1';
    start.addEventListener('click', () => {
      // rush-mode owns the timer; this only guarantees the overlay cannot strand input.
      window.setTimeout(() => {
        if (state.status !== 'playing') return;
        intro.hidden = true;
        intro.style.pointerEvents = 'none';
        recoverRushInput();
      }, 40);
      window.setTimeout(recoverRushInput, 220);
    });
  }

  patchIntroCopy();
  wireStartRecovery();

  const observer = new MutationObserver(() => {
    patchIntroCopy();
    wireStartRecovery();
  });
  observer.observe(document.body, { childList: true, subtree: true });

  const watchdog = window.setInterval(() => {
    if (!rush.isRushLevel?.(state.level) || state.status !== 'playing') return;
    const intro = document.querySelector('.rush-intro');
    if (intro && !intro.hidden) {
      intro.style.pointerEvents = 'auto';
      return;
    }
    recoverRushInput();
  }, 700);

  window.addEventListener('pagehide', () => window.clearInterval(watchdog), { once: true });
  window.PomaShiftRushCloudV3 = { recoverInput: recoverRushInput };
})();