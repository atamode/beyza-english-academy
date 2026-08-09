(() => {
  const cloud = window.PomaShiftCloudCore;
  if (!cloud) return;

  let shieldCharges = 0;

  function active() {
    return shieldCharges > 0;
  }

  function armShield() {
    shieldCharges = 1;
    cloud.setShielded(true);
    setMessage('💻 Güvenlik Kalkanı hazır: Şeker Bulutu’nun bir sonraki ilerlemesi engellenecek.');
    render();
  }

  function consumeShield() {
    if (!active()) return false;
    shieldCharges = 0;
    cloud.setShielded(false);
    cloud.playShieldBlock();

    state.shiftsDone += 1;
    state.score += 250;
    metric('shift', {
      stage: state.stageIndex,
      board: '7x9',
      shiftsDone: state.shiftsDone,
      cloudRows: cloud.cloudRows(),
      cloudBlocked: true,
      dahiShield: true,
    });
    metric('cloud_shield_block', { cloudRows: cloud.cloudRows(), shiftsDone: state.shiftsDone });
    setMessage('🛡️ Dahi Poma’nın kalkanı Şeker Bulutu’nu durdurdu!');
    syncUi();
    render();
    checkWin();
    window.dispatchEvent(new CustomEvent('poma-shift:cloud-blocked', { detail: { cloudRows: cloud.cloudRows() } }));
    return true;
  }

  // meta-system's legacy freezeMoves may still count down internally, but it is no longer
  // authoritative: this wrapper owns the computer power semantics from this point onward.
  performShift = function sugarCloudMetaPerformShift() {
    if (consumeShield()) return true;
    return cloud.advance({ dangerRows: 1 });
  };

  const baseSetupLevel = setupLevel;
  setupLevel = function sugarCloudMetaSetup(level = state.level) {
    shieldCharges = 0;
    cloud.setShielded(false);
    return baseSetupLevel(level);
  };

  function patchCopy() {
    const booster = window.PomaShiftMeta?.boosters?.computer;
    if (booster) {
      booster.name = 'Güvenlik Kalkanı';
      booster.description = 'Şeker Bulutu’nun bir sonraki ilerlemesini dijital kalkanla engeller.';
    }
    document.querySelectorAll('.shop-item').forEach((item) => {
      const strong = item.querySelector('strong');
      if (!strong) return;
      if (strong.textContent === 'Bilgisayar' || strong.textContent === 'Güvenlik Kalkanı') {
        strong.textContent = 'Güvenlik Kalkanı';
        const small = item.querySelector('small');
        if (small) small.textContent = 'Şeker Bulutu’nun bir sonraki ilerlemesini dijital kalkanla engeller.';
      }
    });
  }

  function latestComputerUseKey() {
    const events = window.PomaShiftMetrics?.export?.() || [];
    for (let i = events.length - 1; i >= 0; i -= 1) {
      const event = events[i];
      if (event.name === 'booster_used' && event.booster === 'computer') return `${event.at}:${event.level}`;
    }
    return '';
  }

  let lastComputerUse = latestComputerUseKey();

  window.addEventListener('poma-shift:metric', (event) => {
    const detail = event.detail || {};
    if (detail.name !== 'booster_used' || detail.booster !== 'computer') return;
    lastComputerUse = `${detail.at}:${detail.level}`;
    armShield();
  });

  // Fallback for sessions where analytics dispatch is unavailable.
  window.setInterval(() => {
    patchCopy();
    const events = window.PomaShiftMetrics?.export?.() || [];
    for (let i = events.length - 1; i >= 0; i -= 1) {
      const event = events[i];
      if (event.name !== 'booster_used' || event.booster !== 'computer') continue;
      const key = `${event.at}:${event.level}`;
      if (key !== lastComputerUse) {
        lastComputerUse = key;
        armShield();
      }
      break;
    }
  }, 180);

  patchCopy();
  window.PomaShiftCloudShield = {
    active,
    charges: () => shieldCharges,
    arm: armShield,
    consume: consumeShield,
  };
})();