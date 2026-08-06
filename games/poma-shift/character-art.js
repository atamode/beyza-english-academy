(() => {
  const VISUALS = [
    { min: 1, max: 10, level: 10, id: 'poma', name: 'Atkısız Poma' },
    { level: 20, id: 'genius', name: 'Poma Dahi' },
    { level: 30, id: 'influencer', name: 'Influencer Poma' },
    { level: 40, id: 'archer', name: 'Okçu Poma' },
    { level: 50, id: 'wolf', name: 'Bozkurt Poma' },
    { level: 60, id: 'baby', name: 'Baby Poma' },
    { level: 70, id: 'elder', name: 'Dede Poma' },
    { level: 80, id: 'hero', name: 'Hero Poma' },
  ];

  function characterForLevel(level, { activeFallback = false } = {}) {
    const exact = VISUALS.find((item) => item.level === level);
    if (exact) return exact;
    if (activeFallback && level >= 1 && level <= 10) return VISUALS[0];
    return null;
  }

  function portrait(character, extraClass = '') {
    const node = document.createElement('span');
    node.className = `poma-character-portrait char-${character.id} ${extraClass}`.trim();
    node.setAttribute('role', 'img');
    node.setAttribute('aria-label', character.name);
    node.title = character.name;
    return node;
  }

  function decorateMetaMap(root = document) {
    root.querySelectorAll('.meta-level-node[data-meta-level]').forEach((node) => {
      if (node.querySelector('.poma-character-portrait')) return;
      const level = Number(node.dataset.metaLevel);
      const character = characterForLevel(level, { activeFallback: node.classList.contains('active') });
      if (!character) return;
      node.querySelector('b')?.remove();
      node.appendChild(portrait(character));
    });
  }

  function decorateLegacyMap(root = document) {
    root.querySelectorAll('.level-node[data-level]').forEach((node) => {
      const level = Number(node.dataset.level);
      const character = characterForLevel(level, { activeFallback: node.classList.contains('active') });
      if (!character || node.querySelector('.poma-character-portrait')) return;
      node.querySelector('.meta-map-marker')?.remove();
      node.querySelector('.poma-map-avatar')?.classList.add('is-replaced-by-character-art');
      node.appendChild(portrait(character));
    });
  }

  function decorateUnlock(root = document) {
    root.querySelectorAll('.unlock-badge').forEach((badge) => {
      if (badge.querySelector('.poma-character-portrait')) return;
      const title = badge.querySelector('strong')?.textContent?.trim() || '';
      const character = VISUALS.find((item) => title.includes(item.name.replace('Atkısız ', '')));
      if (!character) return;
      const emoji = badge.querySelector(':scope > span');
      emoji?.replaceWith(portrait(character));
    });
  }

  function decorateRushMilestone(root = document) {
    root.querySelectorAll('.rush-milestone:not([hidden])').forEach((badge) => {
      if (badge.querySelector('.poma-character-portrait')) return;
      const level = Number(window.state?.level || 0);
      const character = characterForLevel(level);
      if (!character || level < 20 || level > 80) return;
      badge.prepend(portrait(character, 'rush-character-art'));
    });
  }

  function decorateResult(root = document) {
    root.querySelectorAll('.result-view').forEach((view) => {
      if (view.querySelector('.poma-result-art')) return;
      const levelText = view.querySelector('.eyebrow')?.textContent || '';
      const match = levelText.match(/(\d+)/);
      const level = match ? Number(match[1]) : Number(window.state?.level || 0);
      if (!(level >= 1 && level <= 10)) return;

      view.querySelector('.poma-result-avatar')?.classList.add('is-replaced-by-character-art');
      const art = portrait(VISUALS[0], 'poma-result-art');
      view.prepend(art);

      if (!view.querySelector('.poma-scarfless-badge')) {
        const note = document.createElement('span');
        note.className = 'poma-scarfless-badge';
        note.append(portrait(VISUALS[0]));
        note.append(document.createTextNode('İlk 10 level · Atkısız Poma'));
        view.querySelector('h2')?.insertAdjacentElement('afterend', note);
      }
    });
  }

  function decorate(root = document) {
    decorateMetaMap(root);
    decorateLegacyMap(root);
    decorateUnlock(root);
    decorateRushMilestone(root);
    decorateResult(root);
  }

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      mutation.addedNodes.forEach((node) => {
        if (!(node instanceof Element)) return;
        decorate(node);
      });
    }
    decorate(document);
  });

  observer.observe(document.body, { childList: true, subtree: true });
  decorate(document);

  window.PomaShiftCharacterArt = {
    visuals: VISUALS,
    decorate,
  };
})();
