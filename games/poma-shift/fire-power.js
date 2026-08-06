(() => {
  const KEY = 'pomaShift.fireWave.v1';
  const UNLOCK_LEVEL = 70;
  const gameCard = document.querySelector('.game-card');
  const powerDock = document.querySelector('.power-dock');
  const canvasNode = document.getElementById('game');

  function read() {
    try {
      const parsed = JSON.parse(localStorage.getItem(KEY) || 'null');
      return parsed && typeof parsed === 'object' ? parsed : { granted: false, qty: 0 };
    } catch {
      return { granted: false, qty: 0 };
    }
  }

  function write(data) {
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch {}
  }

  function highestUnlocked() {
    return Number(window.PomaShiftMetrics?.progress?.().highestUnlocked || 1);
  }

  function unlocked() {
    return highestUnlocked() > UNLOCK_LEVEL;
  }

  function ensureFirstGrant() {
    const data = read();
    if (unlocked() && !data.granted) {
      data.granted = true;
      data.qty = Math.max(0, Number(data.qty) || 0) + 1;
      write(data);
      window.PomaShiftMetrics?.export && metric('character_power_unlock', { booster: 'firewave', character: 'Fire Poma' });
    }
    return data;
  }

  function quantity() {
    return Math.max(0, Number(ensureFirstGrant().qty) || 0);
  }

  function setQuantity(qty) {
    const data = ensureFirstGrant();
    data.qty = Math.max(0, Math.floor(Number(qty) || 0));
    write(data);
  }

  function boardHasTopBlocks() {
    return state.grid.slice(0, 2).some((row) => row?.some(Boolean));
  }

  function spawnAsh(left, top, width, height) {
    if (!gameCard) return;
    for (let i = 0; i < 24; i += 1) {
      const ash = document.createElement('i');
      ash.className = 'fire-ash';
      ash.style.left = `${left + Math.random() * width}px`;
      ash.style.top = `${top + Math.random() * height}px`;
      ash.style.setProperty('--ash-x', `${-20 + Math.random() * 40}px`);
      ash.style.setProperty('--ash-y', `${18 + Math.random() * 42}px`);
      gameCard.appendChild(ash);
      window.setTimeout(() => ash.remove(), 900);
    }
  }

  function fireFx() {
    if (!gameCard || !canvasNode || !state.boardRect) return;
    const rect = state.boardRect;
    const fx = document.createElement('div');
    fx.className = 'fire-wave-fx';
    fx.style.left = `${canvasNode.offsetLeft + rect.x}px`;
    fx.style.top = `${canvasNode.offsetTop + rect.y}px`;
    fx.style.width = `${rect.w}px`;
    fx.style.height = `${Math.min(rect.h, rect.cell * 2)}px`;
    gameCard.appendChild(fx);
    gameCard.classList.remove('fire-impact');
    void gameCard.offsetWidth;
    gameCard.classList.add('fire-impact');
    spawnAsh(canvasNode.offsetLeft + rect.x, canvasNode.offsetTop + rect.y, rect.w, Math.min(rect.h, rect.cell * 2));
    navigator.vibrate?.([24, 20, 36]);
    window.setTimeout(() => fx.remove(), 760);
  }

  function useFireWave() {
    if (!unlocked() || quantity() <= 0 || state.status !== 'playing') return false;
    if (!boardHasTopBlocks()) {
      setMessage('Alev Dalgası için üstte yakılacak blok yok.');
      return false;
    }

    fireFx();
    window.setTimeout(() => {
      let cleared = 0;
      for (let row = 0; row < Math.min(2, state.grid.length); row += 1) {
        for (let col = 0; col < state.grid[row].length; col += 1) {
          if (!state.grid[row][col]) continue;
          state.grid[row][col] = null;
          cleared += 1;
        }
      }
      setQuantity(quantity() - 1);
      metric('booster_used', { booster: 'firewave', level: state.level, cleared });
      setMessage(`🔥 Alev Dalgası: üstteki 2 satır yakıldı · ${cleared} blok kül oldu.`);
      render();
      syncButton();
    }, 330);
    return true;
  }

  function syncButton() {
    const list = powerDock?.querySelector('[data-power-list]');
    if (!list) return;
    let button = list.querySelector('[data-fire-wave]');
    if (!button) {
      button = document.createElement('button');
      button.type = 'button';
      button.dataset.fireWave = '1';
      list.appendChild(button);
    }
    const isUnlocked = unlocked();
    const qty = quantity();
    button.className = `power-button fire-power-button ${isUnlocked ? '' : 'locked'}`;
    button.disabled = !isUnlocked;
    button.innerHTML = `<span>🔥</span><strong>${qty}</strong><small>${isUnlocked ? 'Alev Dalgası' : 'Lv.70'}</small>`;
    button.title = 'Fire Poma · Üst bölgedeki ilk 2 satırı tamamen yakar.';
  }

  powerDock?.addEventListener('click', (event) => {
    const button = event.target.closest('[data-fire-wave]');
    if (!button) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (quantity() <= 0) {
      setMessage('Alev Dalgası stoğun yok.');
      return;
    }
    useFireWave();
  }, true);

  const observer = new MutationObserver(syncButton);
  if (powerDock) observer.observe(powerDock, { childList: true, subtree: true });
  window.setInterval(syncButton, 900);
  ensureFirstGrant();
  syncButton();

  window.PomaShiftFirePower = {
    unlocked,
    quantity,
    use: useFireWave,
    add(count = 1) { setQuantity(quantity() + Math.max(0, Number(count) || 0)); syncButton(); },
  };
})();
