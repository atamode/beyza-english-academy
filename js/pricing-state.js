const KEY = "pomaAcademy.pricing.selection.v1";
const TTL_MS = 30 * 60 * 1000;
const PAID_PLAN_CODES = new Set(["FAMILY_MONTHLY", "FAMILY_YEARLY", "TEACHER_MONTHLY"]);

export function savePricingSelection(planCode, storage = globalThis.sessionStorage, now = Date.now()) {
  if (!PAID_PLAN_CODES.has(planCode)) return false;
  try { storage.setItem(KEY, JSON.stringify({ planCode, expiresAt: now + TTL_MS })); return true; } catch { return false; }
}

export function readPricingSelection(storage = globalThis.sessionStorage, now = Date.now()) {
  try {
    const value = JSON.parse(storage.getItem(KEY) || "null");
    if (!PAID_PLAN_CODES.has(value?.planCode) || Number(value?.expiresAt) <= now) { storage.removeItem(KEY); return null; }
    return value.planCode;
  } catch { try { storage.removeItem(KEY); } catch {} return null; }
}

export function consumePricingSelection(storage = globalThis.sessionStorage, now = Date.now()) {
  const planCode = readPricingSelection(storage, now);
  if (planCode) try { storage.removeItem(KEY); } catch {}
  return planCode;
}

export { KEY as PRICING_SELECTION_KEY, TTL_MS as PRICING_SELECTION_TTL_MS, PAID_PLAN_CODES };
