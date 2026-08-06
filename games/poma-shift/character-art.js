(() => {
  const VISUALS = [
    { min: 1, max: 9, level: 1, id: 'poma', name: 'Poma', reward: 'Başlangıç karakteri' },
    { level: 10, id: 'genius', name: 'Poma Dahi', reward: 'Bilgisayar' },
    { level: 20, id: 'influencer', name: 'Influencer Poma', reward: 'Telefon' },
    { level: 30, id: 'archer', name: 'Okçu Poma', reward: 'Ok' },
    { level: 40, id: 'wolf', name: 'Bozkurt Poma', reward: 'Kurt Pençesi' },
    { level: 50, id: 'baby', name: 'Baby Poma', reward: 'Emzik Salyası' },
    { level: 60, id: 'elder', name: 'Dede Poma', reward: 'Asa Gücü' },
    { level: 70, id: 'fire', name: 'Fire Poma', reward: 'Alev Dalgası' },
    { level: 80, id: 'hero', name: 'PomaHero', reward: 'Sihirli Yaprak' },
  ];

  function characterForLevel(level, { activeFallback = false } = {}) {
    const exact = VISUALS.find((item) => item.level === level);
    if (exact) return exact;
    if (activeFallback && level >= 1 && level <= 9) return VISUALS[0];
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

  function goalState(node, character) {
    if (character.level === 1) return 'BAŞLANGIÇ';
    if (node.classList.contains('complete')) return 'AÇILDI';
    return 'BU LEVELDE AÇILIR';
  }

  function ensureGoalLabel(node, character) {
    let label = node.querySelector('.poma-character-goal');
    if (!label) {
      label = document.createElement('small');
      label.className = 'poma-character-goal';
      label.innerHTML = '<strong></strong><em></em>';
      node.appendChild(label);
    }
    const strong = label.querySelector('strong');
    const stateLabel = label.querySelector('em');
    const nextState = goalState(node, character);
    if (strong.textContent !== character.name) strong.textContent = character.name;
    if (stateLabel.textContent !== nextState) stateLabel.textContent = nextState;
    node.classList.add('has-character-goal');
  }

  function decorateMetaMap(root = document) {
    root.querySelectorAll('.meta-level-node[data-meta-level]').forEach((node) => {
      const level = Number(node.dataset.metaLevel);
      const character = characterForLevel(level, { activeFallback: node.classList.contains('active') });
      if (!character) return;
      node.querySelector('b')?.remove();
      if (!node.querySelector('.poma-character-portrait')) node.appendChild(portrait(character));
      if (character.level === level) ensureGoalLabel(node, character);
    });
  }

  function decorateLegacyMap(root = document) {
    root.querySelectorAll('.level-node[data-level]').forEach((node) => {
      const level = Number(node.dataset.level);
      const character = characterForLevel(level, { activeFallback: node.classList.contains('active') });
      if (!character) return;
      if (!node.querySelector('.poma-character-portrait')) {
        node.querySelector('.meta-map-marker')?.remove();
        node.querySelector('.poma-map-avatar')?.classList.add('is-replaced-by-character-art');
        node.appendChild(portrait(character));
      }
      if (character.level === level) ensureGoalLabel(node, character);
    });
  }

  function decorateUnlock(root = document) {
    root.querySelectorAll('.unlock-badge').forEach((badge) => {
      if (badge.querySelector('.poma-character-portrait')) return;
      const title = badge.querySelector('strong')?.textContent?.trim() || '';
      const character = VISUALS.find((item) => title.includes(item.name));
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
      if (!character || level < 10 || level > 80) return;
      badge.prepend(portrait(character, 'rush-character-art'));
    });
  }

  function decorateResult(root = document) {
    root.querySelectorAll('.result-view').forEach((view) => {
      if (view.querySelector('.poma-result-art')) return;
      const levelText = view.querySelector('.eyebrow')?.textContent || '';
      const match = levelText.match(/(\d+)/);
      const level = match ? Number(match[1]) : Number(window.state?.level || 0);
      if (!(level >= 1 && level <= 9)) return;

      view.querySelector('.poma-result-avatar')?.classList.add('is-replaced-by-character-art');
      const art = portrait(VISUALS[0], 'poma-result-art');
      view.prepend(art);

      if (!view.querySelector('.poma-scarfless-badge')) {
        const note = document.createElement('span');
        note.className = 'poma-scarfless-badge';
        note.append(portrait(VISUALS[0]));
        note.append(document.createTextNode('Başlangıç karakteri · Poma'));
        view.querySelector('h2')?.insertAdjacentElement('afterend', note);
      }
    });
  }

  function nextVisibleCharacterGoal(map) {
    for (const character of VISUALS.filter((item) => item.level >= 10)) {
      const node = map.querySelector(`.meta-level-node[data-meta-level="${character.level}"]`);
      if (node && !node.classList.contains('complete')) return character;
    }
    return null;
  }

  function decorateMapGoal(root = document) {
    root.querySelectorAll('.meta-map').forEach((map) => {
      const character = nextVisibleCharacterGoal(map);
      const existing = map.querySelector('.poma-next-goal');
      if (!character) {
        existing?.remove();
        return;
      }
      if (existing?.dataset.character === character.id) return;
      existing?.remove();

      const banner = document.createElement('div');
      banner.className = 'poma-next-goal';
      banner.dataset.character = character.id;
      banner.appendChild(portrait(character, 'poma-next-goal-art'));

      const copy = document.createElement('div');
      copy.innerHTML = `
        <small>SONRAKİ KARAKTER HEDEFİ</small>
        <strong>${character.name}</strong>
        <span>Level ${character.level} tamamlanınca açılır · ${character.reward}</span>
      `;
      banner.appendChild(copy);
      map.querySelector('.meta-map-nav')?.insertAdjacentElement('beforebegin', banner);
    });
  }

  function decorate(root = document) {
    decorateMetaMap(root);
    decorateLegacyMap(root);
    decorateUnlock(root);
    decorateRushMilestone(root);
    decorateResult(root);
    decorateMapGoal(root);
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
