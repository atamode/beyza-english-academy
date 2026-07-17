const listeners = new Set();
function hashParts() {
  const raw = location.hash.replace(/^#\/?/, "");
  const split = raw.indexOf("?");
  return split < 0 ? [raw, ""] : [raw.slice(0, split), raw.slice(split + 1)];
}
export function getRoute() { return hashParts()[0] || "home"; }
export function getRouteParams() { return new URLSearchParams(hashParts()[1]); }
export function navigate(route) { location.hash = `#/${route}`; }
export function onRouteChange(listener) {
  listeners.add(listener);
  const handler = () => listener(getRoute());
  window.addEventListener("hashchange", handler);
  return () => { listeners.delete(listener); window.removeEventListener("hashchange", handler); };
}
