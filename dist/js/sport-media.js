const esc = v => String(v ?? "").replace(/[&<>\"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

export function renderSportMedia(media, resolver, event, { useVideo = true, alt = "Spor oyunu gorseli" } = {}) {
  if (!media) return "";
  const video = useVideo ? resolver.video(event) : null;
  const poster = video?.posterUrl || media.posterUrl || media.fallbackUrl || media.url;
  const label = esc(media.alt || alt);
  return `<div class="football-media-stage" data-video-event="${esc(event)}"><img class="football-media-poster is-visible" src="${esc(poster)}" alt="${label}" loading="eager">${video ? `<video class="football-media-video" src="${esc(video.url)}" playsinline preload="metadata" aria-label="${label}"></video>` : ""}</div>`;
}
