(() => {
  const POMA_SRC = '../../assets/brand/poma-academy/poma-main-wave.png';
  const tutorial = document.querySelector('.tutorial-hint');
  const modalContent = document.querySelector('[data-modal-content]');

  function makePoma(className, alt = 'Poma') {
    const img = document.createElement('img');
    img.className = className;
    img.src = POMA_SRC;
    img.alt = alt;
    img.loading = 'eager';
    img.decoding = 'async';
    return img;
  }

  function decorateTutorial() {
    if (!tutorial || tutorial.querySelector('.poma-tutorial-avatar')) return;
    tutorial.classList.add('has-poma');
    tutorial.prepend(makePoma('poma-tutorial-avatar', 'Poma oyun rehberi'));
  }

  function decorateMap() {
    if (!modalContent) return;
    const path = modalContent.querySelector('.level-path');
    if (!path) return;

    modalContent.querySelectorAll('.poma-map-avatar').forEach((node) => node.remove());
    const active = path.querySelector('.level-node.active');
    if (!active) return;

    active.classList.add('has-poma');
    active.appendChild(makePoma('poma-map-avatar', 'Poma mevcut levelde'));
  }

  function decorateResult() {
    if (!modalContent) return;
    const win = modalContent.querySelector('.win-view');
    const fail = modalContent.querySelector('.fail-view');

    if (win && !win.querySelector('.poma-result-avatar')) {
      win.prepend(makePoma('poma-result-avatar poma-win', 'Poma kutluyor'));
    }
    if (fail && !fail.querySelector('.poma-result-avatar')) {
      fail.prepend(makePoma('poma-result-avatar poma-fail', 'Poma yeniden denemeni bekliyor'));
    }
  }

  function decorate() {
    decorateTutorial();
    decorateMap();
    decorateResult();
  }

  if (modalContent) {
    const observer = new MutationObserver(() => requestAnimationFrame(decorate));
    observer.observe(modalContent, { childList: true, subtree: true });
  }

  decorate();
})();