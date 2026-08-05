(() => {
  // RUSH/series timer is intentionally disabled.
  // A timed tray refresh lets players wait for a better deal and undermines the puzzle economy.
  const nativeSetInterval = window.setInterval.bind(window);

  window.setInterval = function pomaShiftInterval(handler, timeout, ...args) {
    if (typeof handler === 'function' && handler.name === 'updateTrayTimer') return 0;
    return nativeSetInterval(handler, timeout, ...args);
  };

  const style = document.createElement('style');
  style.textContent = `
    .series-timer { display: none !important; }
    .level-node.rush small { display: none !important; }
  `;
  document.head.appendChild(style);

  function scrubRushUi(root = document) {
    root.querySelectorAll?.('.series-timer').forEach((timer) => {
      timer.hidden = true;
      timer.classList.remove('is-rush', 'is-hot', 'is-expired', 'is-paused');
    });

    root.querySelectorAll?.('.level-node.rush').forEach((node) => {
      node.classList.remove('rush');
      node.querySelector('small')?.remove();
    });

    root.querySelectorAll?.('.map-head p').forEach((copy) => {
      if (/RUSH|⚡/i.test(copy.textContent || '')) {
        copy.textContent = 'Aşağıdan başla, her bölümde yukarı çık.';
      }
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    scrubRushUi();
    const observer = new MutationObserver(() => scrubRushUi());
    observer.observe(document.body, { childList: true, subtree: true });
  });
})();
