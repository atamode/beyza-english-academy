(() => {
  function normalize(value) {
    if (typeof value !== 'string') return value;
    return value
      .replace(/LOFT SINIRI/gi, 'ŞEKER BULUTU')
      .replace(/LOFT İNERSE KAYBEDERSİN/gi, 'BULUT BÜYÜRSE KAYBEDERSİN')
      .replace(/LOFT İNER/gi, 'ŞEKER BULUTU BÜYÜR')
      .replace(/LOFT bölgesine/gi, 'Şeker Bulutu bölgesine')
      .replace(/loft bölgesine/gi, 'Şeker Bulutu bölgesine')
      .replace(/lofta/gi, "Şeker Bulutu'na")
      .replace(/LOFT/g, 'BULUT')
      .replace(/Loft/g, 'Bulut')
      .replace(/loft/g, 'bulut');
  }

  function patch(root = document) {
    const label = document.querySelector('.topbar > div:nth-child(3) .label');
    if (label) label.textContent = 'BULUT';
    const boardValue = document.getElementById('boardValue');
    if (boardValue && typeof state !== 'undefined' && state.status === 'playing') boardValue.textContent = '7×9';

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node = walker.nextNode();
    while (node) {
      const next = normalize(node.nodeValue || '');
      if (next !== node.nodeValue) node.nodeValue = next;
      node = walker.nextNode();
    }
  }

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      mutation.addedNodes.forEach((node) => {
        if (node instanceof Element) patch(node);
      });
    }
  });

  patch(document);
  observer.observe(document.body, { childList: true, subtree: true });
  window.setInterval(() => patch(document), 1200);
})();