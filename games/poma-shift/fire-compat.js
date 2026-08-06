(() => {
  function fireApi() {
    return window.PomaShiftCharacterProgression?.fire || null;
  }

  window.PomaShiftFirePower = {
    unlocked() {
      return Boolean(fireApi()?.state?.unlocked);
    },
    quantity() {
      return Math.max(0, Number(fireApi()?.state?.inventory || 0));
    },
    use() {
      return fireApi()?.use?.();
    },
  };
})();
