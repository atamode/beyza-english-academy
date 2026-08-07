(() => {
  const CONTINUE_BONUS_MS = 10_000;
  const TICK_MS = 100;
  const MAX_CONTINUES = 5;

  const rush = window.PomaShiftRush;
  if (!rush || typeof rush.isRushLevel !== 'function') return;

  const timer = document.querySelector('.series-timer');
  const timerValue = timer?.querySelector('[data-series-time]');
  const timerBar = timer?.querySelector('[data-series-bar]');
  const modal = document.querySelector('.modal-screen');
  const modalContent = document.querySelector('[data-modal-content]');

  const baseActive = typeof rush.active === 'function' ? rush.active.bind(rush) : () => false;
  const baseRemainingMs = typeof rush.remainingMs === 'function' ? rush.remainingMs.bind(rush) : () => 0;

  let mirrorDurationMs = 0;
  let mirrorEndsAt = 0;
  let mirrorPausedMs = 0;
  let mirrorActive = false;

  let continuationMode = false;
  let continuationEndsAt = 0;
  let continuationPausedMs = 0;
  let continuationWindowMs = 0;
  let continuationHandle = 0;
  let lastFailureRemainingMs = 0;

  function currentLevel() {
    return Number(state.level || 0);
  }

  function isCurrentRush() {
    return rush.isRushLevel(currentLevel());
  }

  function clearContinuationInterval() {
    window.clearInterval(continuationHandle);
    continuationHandle = 0;
  }

  function mirrorRemainingMs() {
    if (!mirrorActive) return 0;
    if (mirrorPausedMs > 0) return mirrorPausedMs;
    return Math.max(0, mirrorEndsAt - performance.now());
  }

  function continuationRemainingMs() {
    if (!continuationMode) return 0;
    if (continuationPausedMs > 0) return continuationPausedMs;
    return Math.max(0, continuationEndsAt - performance.now());
  }

  function setTimerVisible() {
    if (!timer) return;
    timer.hidden = false;
    timer.classList.add('rush-level-timer');
  }

  function paintContinuationTimer(remainingMs) {
    if (!timer || !timerValue || !timerBar) return;
    const safe = Math.max(0, remainingMs);
    const denominator = Math.max(CONTINUE_BONUS_MS, continuationWindowMs || CONTINUE_BONUS_MS);
    const ratio = Math.max(0, Math.min(1, safe / denominator));
    setTimerVisible();
    timerValue.textContent = `${(safe / 1000).toFixed(safe < 10_000 ? 1 : 0)}s`;
    timerBar.style.transform = `scaleX(${ratio})`;
    timer.classList.toggle('is-hot', ratio <= 0.30);
    timer.classList.toggle('is-expired', safe <= 0);
    timer.classList.toggle('is-paused', continuationPausedMs > 0);
  }

  function stopContinuation({ paintZero = false } = {}) {
    if (paintZero) paintContinuationTimer(0);
    clearContinuationInterval();
    continuationMode = false;
    continuationEndsAt = 0;
    continuationPausedMs = 0;
    continuationWindowMs = 0;
  }

  function expireContinuation() {
    if (!continuationMode || state.status !== 'playing') return;
    stopContinuation({ paintZero: true });
    lastFailureRemainingMs = 0;
    if (typeof window.metric === 'function') {
      window.metric('rush_timeout', {
        durationMs: CONTINUE_BONUS_MS,
        continuation: true,
        shifts: Number(state.shiftsDone || 0),
        targetShifts: Number(state.targetShifts || 0),
      });
    }
    if (typeof window.lose === 'function') window.lose('RUSH süresi bitti.', 'rush_timeout');
  }

  function tickContinuation() {
    if (!continuationMode) {
      clearContinuationInterval();
      return;
    }
    if (state.status !== 'playing') {
      clearContinuationInterval();
      return;
    }
    const remaining = continuationRemainingMs();
    paintContinuationTimer(remaining);
    if (remaining <= 0) expireContinuation();
  }

  function startContinuation(remainingBeforeFailMs) {
    const bonusBase = Math.max(0, Number(remainingBeforeFailMs || 0));
    continuationWindowMs = bonusBase + CONTINUE_BONUS_MS;
    continuationEndsAt = performance.now() + continuationWindowMs;
    continuationPausedMs = 0;
    continuationMode = true;
    mirrorActive = false;
    mirrorEndsAt = 0;
    mirrorPausedMs = 0;
    clearContinuationInterval();
    continuationHandle = window.setInterval(tickContinuation, TICK_MS);
    paintContinuationTimer(continuationWindowMs);
  }

  function continueCount() {
    try {
      const snapshot = window.PomaShiftMeta?.snapshot?.();
      return Number(snapshot?.meta?.continueAdsByLevel?.[String(currentLevel())] || 0);
    } catch {
      return 0;
    }
  }

  function livesRemaining() {
    try {
      return Number(window.PomaShiftMeta?.snapshot?.()?.meta?.lives ?? 0);
    } catch {
      return 0;
    }
  }

  function patchContinueCopy(root = document) {
    if (!isCurrentRush()) return;
    root.querySelectorAll?.('button[data-meta-continue]').forEach((button) => {
      const used = continueCount();
      const next = `🎬 Reklam İzle · +3 Hamle +10 sn (${used}/${MAX_CONTINUES})`;
      if (button.textContent !== next) button.textContent = next;
    });
  }

  function patchTerminalFail(root = document) {
    if (!isCurrentRush() || continueCount() < MAX_CONTINUES) return;
    const fail = root.querySelector?.('.fail-view') || document.querySelector('.fail-view');
    if (!fail) return;

    // Keep result-flow's hidden [data-meta-continue] sentinel intact. Only a real
    // rewarded-ad CTA should disappear at 5/5; removing the sentinel would let
    // the legacy fail decorator re-enter its terminal MutationObserver loop.
    fail.querySelector('button[data-meta-continue]')?.remove();

    let note = fail.querySelector('[data-rush-continue-limit]');
    if (!note) {
      note = document.createElement('p');
      note.dataset.rushContinueLimit = '1';
      note.className = 'result-sub';
      const retry = fail.querySelector('[data-retry]');
      if (retry) retry.insertAdjacentElement('beforebegin', note);
      else fail.appendChild(note);
    }
    const noteText = livesRemaining() > 0
      ? '5/5 reklam devamı kullanıldı. Bu deneme bitti.'
      : '5/5 reklam devamı kullanıldı. Devam etmek için can al veya haritaya dön.';
    if (note.textContent !== noteText) note.textContent = noteText;

    fail.querySelectorAll('button').forEach((button) => {
      button.disabled = false;
      button.style.pointerEvents = 'auto';
    });

    if (modal) {
      modal.hidden = false;
      modal.style.pointerEvents = 'auto';
    }
  }

  function patchFailUiSoon() {
    window.setTimeout(() => {
      patchContinueCopy(modalContent || document);
      patchTerminalFail(modalContent || document);
    }, 330);
  }

  window.addEventListener('poma-shift:metric', (event) => {
    const detail = event.detail || {};
    if (!rush.isRushLevel(Number(detail.level || currentLevel()))) return;

    if (detail.name === 'rush_start') {
      mirrorDurationMs = Math.max(0, Number(detail.durationMs || rush.rushDurationForLevel?.(currentLevel()) || 0));
      mirrorEndsAt = performance.now() + mirrorDurationMs;
      mirrorPausedMs = 0;
      mirrorActive = true;
      lastFailureRemainingMs = 0;
      stopContinuation();
      return;
    }

    if (detail.name === 'level_fail') {
      lastFailureRemainingMs = continuationMode
        ? continuationRemainingMs()
        : mirrorRemainingMs();
      mirrorActive = false;
      mirrorEndsAt = 0;
      mirrorPausedMs = 0;
      stopContinuation();
      patchFailUiSoon();
      return;
    }

    if (detail.name === 'continue_rewarded') {
      startContinuation(lastFailureRemainingMs);
      const used = Number(detail.count || continueCount());
      if (typeof window.setMessage === 'function') {
        window.setMessage(`🎬 RUSH devamı: +3 hamle · +10 sn (${used}/${MAX_CONTINUES}).`);
      }
      window.setTimeout(() => patchContinueCopy(document), 0);
      return;
    }

    if (detail.name === 'level_complete') {
      mirrorActive = false;
      mirrorEndsAt = 0;
      mirrorPausedMs = 0;
      stopContinuation();
    }
  });

  document.addEventListener('visibilitychange', () => {
    if (!isCurrentRush()) return;

    if (document.hidden) {
      if (mirrorActive && mirrorPausedMs <= 0) {
        mirrorPausedMs = mirrorRemainingMs();
        mirrorEndsAt = 0;
      }
      if (continuationMode && continuationPausedMs <= 0) {
        continuationPausedMs = continuationRemainingMs();
        continuationEndsAt = 0;
        clearContinuationInterval();
        paintContinuationTimer(continuationPausedMs);
      }
      return;
    }

    if (mirrorActive && mirrorPausedMs > 0) {
      mirrorEndsAt = performance.now() + mirrorPausedMs;
      mirrorPausedMs = 0;
    }
    if (continuationMode && continuationPausedMs > 0 && state.status === 'playing') {
      continuationEndsAt = performance.now() + continuationPausedMs;
      continuationPausedMs = 0;
      clearContinuationInterval();
      continuationHandle = window.setInterval(tickContinuation, TICK_MS);
      tickContinuation();
    }
  });

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      mutation.addedNodes.forEach((node) => {
        if (!(node instanceof Element)) return;
        patchContinueCopy(node);
        patchTerminalFail(node);
      });
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  rush.active = function rushActiveWithContinue() {
    return continuationMode || baseActive();
  };
  rush.remainingMs = function rushRemainingWithContinue() {
    if (continuationMode) return continuationRemainingMs();
    return baseRemainingMs();
  };
  rush.continueBonusMs = CONTINUE_BONUS_MS;

  patchContinueCopy(document);
})();