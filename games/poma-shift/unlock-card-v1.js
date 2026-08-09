(() => {
  const MILESTONE_POWERS = {
    10: { id: 'computer', name: 'Güvenlik Kalkanı' },
    20: { id: 'phone', name: 'Telefon' },
    30: { id: 'arrow', name: 'Ok' },
    40: { id: 'claw', name: 'Kurt Pençesi' },
    50: { id: 'pacifier', name: 'Emzik Salyası' },
    60: { id: 'staff', name: 'Asa Gücü' },
    70: { id: 'firewave', name: 'Alev Dalgası' },
    80: { id: 'leaf', name: 'Sihirli Yaprak' },
  };

  const modalContent = document.querySelector('[data-modal-content]');
  if (!modalContent) return;

  function resultLevel(badge) {
    const view = badge.closest('.win-view');
    const text = view?.querySelector('.eyebrow')?.textContent || '';
    const match = text.match(/(\d+)/);
    return match ? Number(match[1]) : 0;
  }

  function decorateUnlockBadge(badge) {
    if (!(badge instanceof Element) || badge.dataset.unlockCardReady === '1') return;
    const level = resultLevel(badge);
    const power = MILESTONE_POWERS[level];
    if (!power) return;

    badge.dataset.unlockCardReady = '1';
    badge.dataset.unlockPower = power.id;
    badge.classList.add('poma-unlock-card');

    const copy = badge.querySelector(':scope > div');
    if (copy) {
      const legacyPowerCopy = copy.querySelector('small');
      if (legacyPowerCopy) legacyPowerCopy.textContent = `${power.name} açıldı · ilk kullanım ×1 hediye`;
      if (!copy.querySelector('.poma-unlock-kicker')) {
        const kicker = document.createElement('span');
        kicker.className = 'poma-unlock-kicker';
        kicker.textContent = 'YENİ GÜÇ AÇILDI · İLK KULLANIM ×1 HEDİYE';
        copy.prepend(kicker);
      }
    }

    let action = badge.querySelector('[data-unlock-shop]');
    if (!action) {
      action = document.createElement('button');
      action.type = 'button';
      action.className = 'poma-unlock-shop';
      action.dataset.unlockShop = power.id;
      action.setAttribute('aria-label', `${power.name} hediye stoğunu ve mağaza kartını aç`);
      action.innerHTML = '<span>🎁 ×1 HEDİYE · MAĞAZADA GÖR</span><b aria-hidden="true">→</b>';
      badge.appendChild(action);
    }
  }

  function decorate(root = document) {
    if (root.matches?.('.unlock-badge')) decorateUnlockBadge(root);
    root.querySelectorAll?.('.unlock-badge').forEach(decorateUnlockBadge);
  }

  function openPowerInLobby(id) {
    if (!id || typeof window.PomaShiftLobby?.open !== 'function') return false;
    window.PomaShiftLobby.open({ animate: false });

    const openPower = () => {
      const button = document.querySelector(`.poma-lobby [data-lobby-power="${id}"]`);
      if (!button) return false;
      button.click();
      return true;
    };

    if (!openPower()) window.setTimeout(openPower, 0);
    return true;
  }

  document.addEventListener('click', (event) => {
    const action = event.target.closest('[data-unlock-shop]');
    if (!action) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    openPowerInLobby(action.dataset.unlockShop);
  }, true);

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      mutation.addedNodes.forEach((node) => {
        if (node instanceof Element) decorate(node);
      });
    }
  });
  observer.observe(modalContent, { childList: true, subtree: true });

  decorate(modalContent);

  window.PomaShiftUnlockCards = {
    milestones: MILESTONE_POWERS,
    decorate,
    openPowerInLobby,
  };
})();