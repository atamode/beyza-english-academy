(() => {
  const SHIELD_NAME = 'Güvenlik Kalkanı';
  const SHIELD_COPY = 'Şeker Bulutu’nun bir sonraki ilerlemesini dijital kalkanla engeller.';

  function patch(root = document) {
    const mini = root.querySelector?.('[data-lobby-power="computer"]') || document.querySelector('[data-lobby-power="computer"]');
    if (mini) mini.setAttribute('aria-label', SHIELD_NAME);

    const detail = root.matches?.('.poma-lobby-detail') ? root : root.querySelector?.('.poma-lobby-detail');
    const liveDetail = detail || document.querySelector('.poma-lobby-detail');
    if (liveDetail && !liveDetail.hidden && liveDetail.querySelector('[data-detail-buy="computer"], [data-detail-slot="computer"]')) {
      const title = liveDetail.querySelector('h2');
      const description = liveDetail.querySelector('p');
      if (title) title.textContent = SHIELD_NAME;
      if (description) description.textContent = SHIELD_COPY;
    }
  }

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      mutation.addedNodes.forEach((node) => {
        if (node instanceof Element) patch(node);
      });
    }
    patch(document);
  });
  observer.observe(document.body, { childList: true, subtree: true });
  patch(document);
})();