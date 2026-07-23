import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = file => fs.readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
const academyOrigin = "https://academy.pomante.com.tr";

test("public discovery surfaces point to the Academy hostname", () => {
  for (const file of [
    "index.html",
    "ingilizce-oyunlari/index.html",
    "ingilizce-oyunlari/futbol/index.html",
    "ingilizce-oyunlari/voleybol/index.html",
    "sitemap.xml",
    "robots.txt",
  ]) {
    const content = read(file);
    assert.match(content, new RegExp(academyOrigin.replaceAll(".", "\\.")), `${file} uses Academy`);
    assert.doesNotMatch(content, /https:\/\/pomante\.com\.tr/, `${file} has no old root URL`);
  }
});

test("live-check defaults use the Academy hostname", () => {
  assert.match(read("playwright.live.config.mjs"), /https:\/\/academy\.pomante\.com\.tr/);
  assert.match(read(".github/workflows/live-smoke.yml"), /https:\/\/academy\.pomante\.com\.tr/);
  assert.match(read("js/analytics.js"), /https:\/\/academy\.pomante\.com\.tr/);
});

test("outbound account emails point to the Academy hostname", () => {
  for (const file of [
    "supabase/functions/_shared/payment-email-template.mjs",
    "supabase/functions/_shared/weekly-parent-report.mjs",
    "supabase/functions/_shared/monthly-parent-report.mjs",
    "supabase/functions/_shared/membership-expiry-reminder-template.mjs",
  ]) {
    const content = read(file);
    assert.match(content, /https:\/\/academy\.pomante\.com\.tr/, `${file} uses Academy`);
    assert.doesNotMatch(content, /https:\/\/pomante\.com\.tr/, `${file} has no old root URL`);
  }
});

test("payment email CORS accepts both origins during transition", () => {
  const source = read("supabase/functions/send-payment-decision-email/index.ts");
  assert.match(source, /https:\/\/academy\.pomante\.com\.tr/);
  assert.match(source, /https:\/\/pomante\.com\.tr/);
  assert.match(source, /https:\/\/www\.pomante\.com\.tr/);
});

test("pre-cutover branch keeps the current Pages domain and portable PWA scope", () => {
  assert.equal(read("CNAME").trim(), "pomante.com.tr");
  const manifest = JSON.parse(read("manifest.webmanifest"));
  assert.equal(manifest.start_url, "./");
  assert.equal(manifest.scope, "./");
});
