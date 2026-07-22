export function sportPlayerName(state = {}, fallback = "Poma") {
  const name = String(state?.profile?.name || "").trim().replace(/\s+/g, " ");
  return name ? name.slice(0, 32) : fallback;
}
