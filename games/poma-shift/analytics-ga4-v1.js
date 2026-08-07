(() => {
  const CONSENT_KEY = 'poma.analytics.consent.v1';
  const MAX_BUFFER = 100;
  const config = window.PomaShiftAnalyticsConfig || {};
  const measurementId = String(config.measurementId || '').trim();
  const testing = Boolean(config.testing);

  const REMOTE_EVENTS = new Set([
    'session_start',
    'level_start',
    'level_complete',
    'level_fail',
    'level_restart',
    'continue_rewarded',
    'ad_complete',
    'booster_purchase',
    'booster_pack_purchase',
    'booster_used',
    'life_purchase',
    'return_gift_claimed',
    'coin_reward',
    'character_unlocked',
    'rush_start',
    'rush_complete',
    'rush_timeout',
  ]);

  const PARAM_ALIASES = new Map([
    ['level', 'level'],
    ['reason', 'reason'],
    ['format', 'format'],
    ['placement', 'placement'],
    ['booster', 'booster'],
    ['price', 'price'],
    ['reward', 'reward'],
    ['coins', 'coins'],
    ['quantity', 'quantity'],
    ['count', 'count'],
    ['source', 'source'],
    ['character', 'character'],
    ['power', 'power'],
    ['moves', 'moves'],
    ['movesUsed', 'moves_used'],
    ['moves_used', 'moves_used'],
    ['shifts', 'shifts'],
    ['targetShifts', 'target_shifts'],
    ['target_shifts', 'target_shifts'],
    ['durationMs', 'duration_ms'],
    ['duration_ms', 'duration_ms'],
    ['remainingMs', 'remaining_ms'],
    ['remaining_ms', 'remaining_ms'],
    ['continueCount', 'continue_count'],
    ['continue_count', 'continue_count'],
    ['rows', 'rows'],
    ['cols', 'cols'],
    ['stage', 'stage'],
  ]);

  let consent = readConsent();
  let tagReady = false;
  let buffer = [];
  const seen = new Set();

  function readConsent() {
    try {
      const value = localStorage.getItem(CONSENT_KEY);
      return value === 'granted' || value === 'denied' ? value : 'unknown';
    } catch {
      return 'unknown';
    }
  }

  function writeConsent(value) {
    try { localStorage.setItem(CONSENT_KEY, value); } catch {}
  }

  function currentLevel() {
    try {
      return typeof state !== 'undefined' ? Number(state.level || 0) : 0;
    } catch {
      return 0;
    }
  }

  function surface() {
    try {
      return window.Capacitor?.isNativePlatform?.() ? 'android' : 'web';
    } catch {
      return 'web';
    }
  }

  function clearAnalyticsCookies() {
    if (!document.cookie) return;
    for (const part of document.cookie.split(';')) {
      const name = part.split('=')[0]?.trim();
      if (name === '_ga' || name?.startsWith('_ga_')) {
        document.cookie = `${name}=; Max-Age=0; path=/; SameSite=Lax`;
      }
    }
  }

  function safeValue(value) {
    if (typeof value === 'boolean') return value ? 1 : 0;
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string') return value.replace(/[\r\n\t]+/g, ' ').slice(0, 100);
    return undefined;
  }

  function safeParams(payload = {}) {
    const params = { surface: surface() };
    const fallbackLevel = currentLevel();
    const payloadLevel = safeValue(payload.level);
    params.level = typeof payloadLevel === 'number' ? payloadLevel : fallbackLevel;

    for (const [input, output] of PARAM_ALIASES) {
      if (output === 'level' || !(input in payload)) continue;
      const value = safeValue(payload[input]);
      if (value !== undefined) params[output] = value;
    }
    return params;
  }

  function remoteName(name) {
    if (!REMOTE_EVENTS.has(name)) return '';
    return `ps_${name}`.replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 40);
  }

  function fingerprint(name, payload = {}) {
    return `${name}|${payload.at || ''}|${payload.level ?? ''}|${payload.reason || ''}|${payload.placement || ''}|${payload.booster || ''}`;
  }

  function ensureTag() {
    if (!measurementId || consent !== 'granted') return false;
    window[`ga-disable-${measurementId}`] = false;
    window.dataLayer ||= [];
    window.gtag ||= function gtag() { window.dataLayer.push(arguments); };
    window.gtag('consent', 'update', {
      analytics_storage: 'granted',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
    });

    if (tagReady) return true;
    tagReady = true;
    if (!testing && !document.querySelector('script[data-poma-shift-ga4]')) {
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
      script.dataset.pomaShiftGa4 = '';
      document.head.appendChild(script);
    }
    window.gtag('js', new Date());
    window.gtag('config', measurementId, {
      send_page_view: false,
      transport_type: 'beacon',
    });
    return true;
  }

  function send(event) {
    if (!ensureTag()) return false;
    window.gtag('event', event.remoteName, event.params);
    return true;
  }

  function track(name, payload = {}) {
    const eventName = remoteName(name);
    if (!eventName) return false;
    const key = fingerprint(name, payload);
    if (seen.has(key)) return false;
    seen.add(key);

    const event = {
      remoteName: eventName,
      params: safeParams(payload),
    };
    if (consent === 'granted') return send(event);
    if (consent === 'unknown') {
      buffer.push(event);
      if (buffer.length > MAX_BUFFER) buffer = buffer.slice(-MAX_BUFFER);
    }
    return false;
  }

  function bootstrap(events = []) {
    if (!Array.isArray(events)) return 0;
    const before = seen.size;
    events.slice(-MAX_BUFFER).forEach((event) => {
      if (!event || typeof event.name !== 'string') return;
      track(event.name, event);
    });
    return seen.size - before;
  }

  function flush() {
    if (consent !== 'granted' || !buffer.length) return 0;
    const pending = buffer;
    buffer = [];
    let sent = 0;
    pending.forEach((event) => { if (send(event)) sent += 1; });
    return sent;
  }

  function removeConsentPanel() {
    document.querySelector('[data-poma-shift-analytics-consent]')?.remove();
  }

  function setConsent(value) {
    if (value !== 'granted' && value !== 'denied') return consent;
    consent = value;
    writeConsent(value);
    removeConsentPanel();

    if (value === 'granted') {
      ensureTag();
      flush();
    } else {
      buffer = [];
      if (measurementId) window[`ga-disable-${measurementId}`] = true;
      window.gtag?.('consent', 'update', {
        analytics_storage: 'denied',
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied',
      });
      clearAnalyticsCookies();
    }
    syncSettingsButton();
    return consent;
  }

  function ensureStyles() {
    if (document.querySelector('style[data-poma-shift-analytics-style]')) return;
    const style = document.createElement('style');
    style.dataset.pomaShiftAnalyticsStyle = '';
    style.textContent = `
      .ps-analytics-consent{position:fixed;z-index:10050;left:12px;right:12px;bottom:max(12px,env(safe-area-inset-bottom));max-width:520px;margin:auto;padding:12px;border:1px solid rgba(159,192,255,.24);border-radius:16px;background:rgba(7,18,39,.97);box-shadow:0 14px 38px rgba(0,0,0,.38);color:#eef6ff;font:600 12px/1.35 system-ui,sans-serif}
      .ps-analytics-consent strong{display:block;margin-bottom:4px;font-size:13px}.ps-analytics-consent p{margin:0;color:#b9c9e5}.ps-analytics-consent div{display:flex;gap:8px;margin-top:10px}.ps-analytics-consent button{flex:1;min-height:38px;border-radius:11px;border:1px solid rgba(255,255,255,.16);background:#182b4d;color:#f5f8ff;font:800 12px system-ui,sans-serif}.ps-analytics-consent button[data-choice="granted"]{background:#ffd052;color:#101826;border-color:#ffd052}
      .poma-analytics-settings{min-height:32px;padding:5px 9px;border:1px solid rgba(255,255,255,.14);border-radius:999px;background:rgba(6,18,39,.58);color:#c9d8ef;font:800 9px system-ui,sans-serif;letter-spacing:.02em}
    `;
    document.head.appendChild(style);
  }

  function openSettings() {
    ensureStyles();
    removeConsentPanel();
    const panel = document.createElement('section');
    panel.className = 'ps-analytics-consent';
    panel.dataset.pomaShiftAnalyticsConsent = '';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Analitik tercihi');
    panel.innerHTML = `
      <strong>Analitik tercihi</strong>
      <p>Poma Shift'i geliştirmek için Google Analytics'e yalnız oyun kullanımı, level sonucu, reklam tamamlanması ve güç kullanımı gibi teknik olayları göndermek istiyoruz. İsim, e-posta veya yazdığın içerikler gönderilmez. Reddetsen de oyun aynı şekilde çalışır.</p>
      <div><button type="button" data-choice="denied">Reddet</button><button type="button" data-choice="granted">Kabul Et</button></div>
    `;
    panel.addEventListener('click', (event) => {
      const choice = event.target.closest('[data-choice]')?.dataset.choice;
      if (choice) setConsent(choice);
    });
    document.body.appendChild(panel);
    return panel;
  }

  function syncSettingsButton() {
    const topbar = document.querySelector('.poma-lobby-topbar');
    if (!topbar) return false;
    let button = topbar.querySelector('[data-poma-shift-analytics-settings]');
    if (!button) {
      button = document.createElement('button');
      button.type = 'button';
      button.className = 'poma-analytics-settings';
      button.dataset.pomaShiftAnalyticsSettings = '';
      button.addEventListener('click', openSettings);
      const wallet = topbar.querySelector('.poma-lobby-wallet');
      topbar.insertBefore(button, wallet || null);
    }
    button.textContent = consent === 'granted' ? 'Analitik ✓' : 'Analitik';
    button.setAttribute('aria-label', `Analitik ayarları · ${consent === 'granted' ? 'açık' : consent === 'denied' ? 'kapalı' : 'seçilmedi'}`);
    return true;
  }

  function initUi() {
    ensureStyles();
    syncSettingsButton();
    const observer = new MutationObserver(() => {
      if (syncSettingsButton()) observer.disconnect();
    });
    if (!document.querySelector('.poma-lobby-topbar')) observer.observe(document.body, { childList: true, subtree: true });
    if (consent === 'unknown') window.setTimeout(openSettings, 700);
  }

  window.PomaShiftAnalytics = {
    track,
    bootstrap,
    setConsent,
    openSettings,
    status() {
      return {
        consent,
        measurementId,
        testing,
        buffered: buffer.length,
        tagReady,
        surface: surface(),
      };
    },
  };

  if (consent === 'granted') ensureTag();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initUi, { once: true });
  else initUi();
})();
