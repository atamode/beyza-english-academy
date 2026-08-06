(() => {
  const CHARACTER_LEVELS = {
    poma: 0,
    genius: 10,
    influencer: 20,
    archer: 30,
    wolf: 40,
    baby: 50,
    elder: 60,
    hero: 70,
  };

  const BOOSTER_LEVELS = {
    computer: 10,
    phone: 20,
    arrow: 30,
    claw: 40,
    pacifier: 50,
    staff: 60,
    leaf: 70,
  };

  const RUSH_MILESTONES = {
    20: { character: 'Influencer Poma', item: 'Telefon', icon: '📱' },
    30: { character: 'Okçu Poma', item: 'Ok', icon: '🏹' },
    40: { character: 'Bozkurt Poma', item: 'Kurt Pençesi', icon: '🐾' },
    50: { character: 'Baby Poma', item: 'Emzik Salyası', icon: '🍼' },
    60: { character: 'Dede Poma', item: 'Asa Gücü', icon: '🪄' },
    70: { character: 'Hero Poma', item: 'Sihirli Yaprak', icon: '🍃' },
  };

  const meta = window.PomaShiftMeta;
  if (meta?.characters) {
    meta.characters.forEach((character) => {
      if (Object.hasOwn(CHARACTER_LEVELS, character.id)) character.level = CHARACTER_LEVELS[character.id];
    });
  }

  if (meta?.boosters) {
    Object.entries(BOOSTER_LEVELS).forEach(([id, level]) => {
      if (meta.boosters[id]) meta.boosters[id].unlockLevel = level;
    });
  }

  const visuals = window.PomaShiftCharacterArt?.visuals;
  if (Array.isArray(visuals)) {
    visuals.forEach((visual) => {
      if (visual.id === 'poma') {
        visual.level = null;
        visual.min = 1;
        visual.max = 10;
        return;
      }
      if (Object.hasOwn(CHARACTER_LEVELS, visual.id)) visual.level = CHARACTER_LEVELS[visual.id];
    });
    window.PomaShiftCharacterArt.decorate(document);
  }

  function refreshRushMilestone(root = document) {
    root.querySelectorAll?.('.rush-milestone:not([hidden])').forEach((badge) => {
      const reward = RUSH_MILESTONES[Number(window.state?.level || 0)];
      if (!reward) return;
      badge.textContent = `${reward.icon} ${reward.character} · Tamamlayınca ${reward.item} açılır.`;
      window.PomaShiftCharacterArt?.decorate?.(badge);
    });
  }

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      mutation.addedNodes.forEach((node) => {
        if (node instanceof Element) refreshRushMilestone(node);
      });
    }
    refreshRushMilestone(document);
  });
  observer.observe(document.body, { childList: true, subtree: true });
  refreshRushMilestone(document);

  window.PomaShiftProgressionV2 = {
    characterLevels: { ...CHARACTER_LEVELS },
    boosterLevels: { ...BOOSTER_LEVELS },
  };
})();
