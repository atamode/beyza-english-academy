import { getRouteParams } from "./router.js";

export const PARTNER_ATTRIBUTION_KEY = "pomaAcademy.partnerAttribution";
export const PARTNER_ATTRIBUTION_TTL_MS = 24 * 60 * 60 * 1000;
const PATTERN = /^[A-Z0-9]{3,24}$/;

export function normalizePartnerCode(value) {
  const code = String(value || "").trim().toUpperCase();
  return PATTERN.test(code) ? code : "";
}
function storageOrNull(storage) { if (storage) return storage; try { return sessionStorage; } catch { return null; } }
export function clearPartnerAttribution(expectedCode = "", storage) {
  const target = storageOrNull(storage); if (!target) return;
  if (expectedCode && readPartnerAttribution(target)?.code !== normalizePartnerCode(expectedCode)) return;
  target.removeItem(PARTNER_ATTRIBUTION_KEY);
}
export function savePartnerAttribution(value, storage, now = Date.now()) {
  const target = storageOrNull(storage), code = normalizePartnerCode(value);
  if (!target || !code) { clearPartnerAttribution("", target); return null; }
  const record = { code, expiresAt: now + PARTNER_ATTRIBUTION_TTL_MS };
  target.setItem(PARTNER_ATTRIBUTION_KEY, JSON.stringify(record)); return record;
}
export function readPartnerAttribution(storage, now = Date.now()) {
  const target = storageOrNull(storage); if (!target) return null;
  try {
    const record = JSON.parse(target.getItem(PARTNER_ATTRIBUTION_KEY) || "null"), code = normalizePartnerCode(record?.code);
    if (!code || !Number.isFinite(record?.expiresAt) || record.expiresAt <= now) { target.removeItem(PARTNER_ATTRIBUTION_KEY); return null; }
    return { code, expiresAt: record.expiresAt };
  } catch { target.removeItem(PARTNER_ATTRIBUTION_KEY); return null; }
}
export async function capturePartnerAttribution(validate, params = getRouteParams(), storage, now = Date.now()) {
  if (!params.has("partner")) return readPartnerAttribution(storage, now);
  const code = normalizePartnerCode(params.get("partner"));
  if (!code) { clearPartnerAttribution("", storage); return null; }
  const result = await validate(code);
  if (!result?.valid) { clearPartnerAttribution("", storage); return null; }
  return { ...savePartnerAttribution(code, storage, now), displayName: result.display_name || "" };
}
