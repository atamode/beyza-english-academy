export const POMA_ASSET_ROOT = "assets/games/poma-football-v1/";
export const POMA_MANIFEST_URL = `${POMA_ASSET_ROOT}asset-manifest.json`;

const slash = value => String(value || "").replace(/\\/g, "/").replace(/^\/+/, "");

export function createPomaManifestResolver(manifest, root = POMA_ASSET_ROOT) {
  const assets = Array.isArray(manifest?.assets) ? manifest.assets : [];
  const videos = Array.isArray(manifest?.videos) ? manifest.videos : [];
  const byId = new Map(assets.map(item => [item.id, item]));
  const videoByEvent = new Map(videos.map(item => [item.event, item]));
  const aliases = manifest?.aliases || {};
  const url = value => `${root}${slash(value)}`;
  const fallbackAsset = assets.find(item => item.id === "MATCH_INTRO") || assets[0] || null;
  const resolveAlias = id => aliases[id] ? assets.find(item => item.path === aliases[id]) || { id, path: aliases[id], type: "alias" } : null;

  return {
    manifest,
    root,
    assets,
    videos,
    url,
    get(id) {
      return byId.get(id) || resolveAlias(id) || fallbackAsset;
    },
    state(id) {
      const item = this.get(id);
      return item ? { ...item, url: url(item.path), alt: altText(id) } : null;
    },
    video(event) {
      const item = videoByEvent.get(event);
      if (!item) return null;
      return { ...item, url: url(item.path), posterUrl: url(item.poster || item.fallback), fallbackUrl: url(item.fallback || item.poster) };
    },
    result(event) {
      const item = this.get(event);
      const video = this.video(event);
      return item ? { ...item, url: url(item.path), posterUrl: url(item.poster || item.path), fallbackUrl: url(item.poster || item.path), video } : null;
    }
  };
}

export async function loadPomaManifest(fetcher = fetch, manifestUrl = POMA_MANIFEST_URL) {
  try {
    const response = await fetcher(manifestUrl);
    if (!response.ok) throw new Error(`Manifest yüklenemedi: ${response.status}`);
    return createPomaManifestResolver(await response.json());
  } catch (error) {
    console.warn?.("Poma Football manifest güvenli moda geçti.", error);
    return null;
  }
}

export function requiredPomaAssetPaths(manifest) {
  const assets = Array.isArray(manifest?.assets) ? manifest.assets : [];
  const videos = Array.isArray(manifest?.videos) ? manifest.videos : [];
  return [...assets.map(x => x.path), ...videos.map(x => x.path), ...videos.flatMap(x => [x.poster, x.fallback].filter(Boolean))]
    .map(slash);
}

export function pomaVideoEvents(manifest) {
  return (manifest?.videoPlayback?.eventsWithVideo || []).slice();
}

export function altText(id) {
  const map = {
    MATCH_INTRO: "Futbol maçı başlıyor.",
    POSSESSION_POMA: "Poma topu kontrol ediyor.",
    PASS_SUCCESS: "Başarılı pas.",
    PASS_FAILED: "Pas rakibe geçti.",
    GIVE_AND_GO_SUCCESS: "Ver-kaç başarılı.",
    SHOT_PREPARE: "Şut hazırlığı.",
    GOAL_SCORED: "Gol attın.",
    GOAL_CELEBRATION: "Gol sevinci.",
    SHOT_MISSED_POST: "Şut direkten döndü.",
    OPPONENT_ATTACK: "Rakip hücum ediyor.",
    DEFENCE_SUCCESS: "Savunma başarılı.",
    DEFENCE_FAILED: "Savunma geçildi.",
    OPPONENT_SHOT_PREPARE: "Rakip şuta hazırlanıyor.",
    SAVE_SUCCESS: "Kaleci kurtardı.",
    GOAL_CONCEDED: "Gol yedin."
  };
  return map[id] || "Futbol oyunu görseli.";
}
