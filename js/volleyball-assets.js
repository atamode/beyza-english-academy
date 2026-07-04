export const VOLLEYBALL_ASSET_ROOT = "assets/games/poma-volleyball-v1/";
export const VOLLEYBALL_MANIFEST_URL = `${VOLLEYBALL_ASSET_ROOT}asset-manifest.json`;

const slash = value => String(value || "").replace(/\\/g, "/").replace(/^\/+/, "");
const urlFrom = (root, value) => `${root}${slash(value)}`;

export function createVolleyballManifestResolver(manifest, root = VOLLEYBALL_ASSET_ROOT) {
  const events = manifest?.events || {};
  const refs = manifest?.references || {};
  const labels = manifest?.labels || {};
  const url = value => urlFrom(root, value);
  const refAsset = (id, path, alt) => path ? ({ id, path, url: url(path), posterUrl: url(path), fallbackUrl: url(path), alt }) : null;
  const eventAsset = id => {
    const item = events[id];
    if (!item) return null;
    const poster = item.poster || item.fallback || refs.gameplayMaster || refs.idlePoster;
    return { id, ...item, path: poster, url: url(poster), posterUrl: url(poster), fallbackUrl: url(poster), alt: altText(id, labels) };
  };
  return {
    manifest,
    root,
    events,
    references: refs,
    labels,
    url,
    get(id) {
      return eventAsset(id) || refAsset(id, refs[id] || refs.gameplayMaster || refs.idlePoster, altText(id, labels));
    },
    state(id) {
      if (id === "MATCH_INTRO" || id === "IDLE") return refAsset(id, refs.idlePoster, "Poma voleybol sahasında hazır.");
      return refAsset(id, refs.gameplayMaster || refs.idlePoster, altText(id, labels));
    },
    result(id) {
      return eventAsset(id) || this.state(id);
    },
    video(id) {
      const item = events[id];
      if (!item?.video) return null;
      return { ...item, event: id, url: url(item.video), posterUrl: url(item.poster || refs.gameplayMaster || refs.idlePoster), fallbackUrl: url(item.poster || refs.gameplayMaster || refs.idlePoster) };
    }
  };
}

export async function loadVolleyballManifest(fetcher = fetch, manifestUrl = VOLLEYBALL_MANIFEST_URL) {
  try {
    const response = await fetcher(manifestUrl);
    if (!response.ok) throw new Error(`Manifest yuklenemedi: ${response.status}`);
    return createVolleyballManifestResolver(await response.json());
  } catch (error) {
    console.warn?.("Poma Volleyball manifest guvenli moda gecti.", error);
    return null;
  }
}

export function requiredVolleyballAssetPaths(manifest) {
  const refs = Object.values(manifest?.references || {});
  const events = Object.values(manifest?.events || {});
  return [...refs, ...events.flatMap(x => [x.poster, x.video, x.fallback].filter(Boolean))].map(slash);
}

export function volleyballVideoEvents(manifest) {
  return Object.entries(manifest?.events || {}).filter(([, value]) => value?.video).map(([key]) => key);
}

export function altText(id, labels = {}) {
  const map = {
    MATCH_INTRO: "Poma voleybol macina hazirlaniyor.",
    possession: "Servis kimde sorusu.",
    pass: "Manset ve pas hazirligi.",
    shot: "Poma smaca cikiyor.",
    serveSuccess: "Servis basarili, pas hazirligi basliyor.",
    passSuccess: "Top basariyla karsilandi.",
    passFailed: "Pas basarisiz oldu, top rakibe gecti.",
    shotSuccess: "Poma sayi kazandi.",
    shotMissed: "Smac bloklandi ya da disari gitti.",
    defenceSuccess: "Blok ve savunma basarili.",
    saveSuccess: "Top kurtarildi.",
    conceded: "Rakip sayi kazandi.",
    win: "Seti kazandin.",
    lose: "Bu set olmadi."
  };
  return labels[id] || map[id] || "Poma voleybol gorseli.";
}
