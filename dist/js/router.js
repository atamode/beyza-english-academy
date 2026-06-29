const listeners = new Set();
export function getRoute() { return location.hash.replace(/^#\/?/, "") || "home"; }
export function navigate(route) { location.hash = `#/${route}`; }
export function onRouteChange(listener) {
  listeners.add(listener);
  const handler = () => listener(getRoute());
  window.addEventListener("hashchange", handler);
  return () => { listeners.delete(listener); window.removeEventListener("hashchange", handler); };
}
