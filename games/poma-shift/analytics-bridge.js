(() => {
  if (typeof window.metric !== 'function') return;

  const baseMetric = window.metric;
  let providerErrorCount = 0;

  function currentLevel() {
    try {
      return typeof state !== 'undefined' ? Number(state.level || 0) : 0;
    } catch {
      return 0;
    }
  }

  function provider() {
    return window.PomaShiftAnalytics;
  }

  function sendToProvider(name, payload) {
    const target = provider();
    if (!target || typeof target.track !== 'function') return;
    try {
      const result = target.track(name, payload);
      if (result && typeof result.catch === 'function') {
        result.catch(() => { providerErrorCount += 1; });
      }
    } catch {
      providerErrorCount += 1;
    }
  }

  window.metric = function analyticsMetric(name, payload = {}) {
    baseMetric(name, payload);
    const envelope = {
      name,
      at: Date.now(),
      ...payload,
      level: Number(payload.level ?? currentLevel()),
    };
    window.dispatchEvent(new CustomEvent('poma-shift:metric', { detail: envelope }));
    sendToProvider(name, envelope);
  };

  function bootstrapProvider() {
    const target = provider();
    if (!target || typeof target.bootstrap !== 'function') return;
    try {
      const events = window.PomaShiftMetrics?.export?.() || [];
      target.bootstrap(events);
    } catch {
      providerErrorCount += 1;
    }
  }

  function summarize() {
    const events = window.PomaShiftMetrics?.export?.() || [];
    const count = eventName => events.filter(event => event.name === eventName).length;
    const failReasons = {};
    const adPlacements = {};
    let coinsEarned = 0;
    let coinsSpent = 0;

    events.forEach((event) => {
      if (event.name === 'level_fail') {
        const reason = event.reason || 'unknown';
        failReasons[reason] = (failReasons[reason] || 0) + 1;
      }
      if (event.name === 'ad_complete') {
        const placement = event.placement || 'unknown';
        adPlacements[placement] = (adPlacements[placement] || 0) + 1;
      }
      if (event.name === 'coin_reward') coinsEarned += Number(event.reward || 0);
      if (event.name === 'return_gift_claimed') coinsEarned += Number(event.coins || 0);
      if (event.name === 'booster_purchase') coinsSpent += Number(event.price || 0);
      if (event.name === 'booster_pack_purchase') coinsSpent += Number(event.price || 0);
      if (event.name === 'life_purchase') coinsSpent += Number(event.price || 0);
    });

    const starts = count('level_start');
    const completes = count('level_complete');
    const fails = count('level_fail');
    return {
      events: events.length,
      sessions: count('session_start'),
      levelStarts: starts,
      levelCompletes: completes,
      levelFails: fails,
      completionRate: starts ? completes / starts : 0,
      restarts: count('level_restart'),
      continues: count('continue_rewarded'),
      rewardedAds: events.filter(event => event.name === 'ad_complete' && event.format === 'rewarded').length,
      interstitialAds: events.filter(event => event.name === 'ad_complete' && event.format === 'interstitial').length,
      adPlacements,
      failReasons,
      coinsEarned,
      coinsSpent,
      boosterPurchases: count('booster_purchase') + count('booster_pack_purchase'),
      boosterUses: count('booster_used'),
      fairnessAdjustments: count('fairness_adjustment'),
      rushTimeouts: count('rush_timeout'),
      sugarCloudFills: count('sugar_cloud_fill'),
      providerErrorCount,
      progress: window.PomaShiftMetrics?.progress?.() || null,
    };
  }

  window.PomaShiftAnalyticsBridge = {
    summarize,
    providerErrors() { return providerErrorCount; },
  };

  bootstrapProvider();
})();
