import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ANALYTICS_EVENTS } from "../js/analytics.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pages = [
  { file:"ingilizce-oyunlari/index.html", canonical:"https://pomante.com.tr/ingilizce-oyunlari/", h1:"Çocuklar için ücretsiz online İngilizce oyunları" },
  { file:"ingilizce-oyunlari/futbol/index.html", canonical:"https://pomante.com.tr/ingilizce-oyunlari/futbol/", h1:"İngilizce futbol kelime oyunu" },
  { file:"ingilizce-oyunlari/voleybol/index.html", canonical:"https://pomante.com.tr/ingilizce-oyunlari/voleybol/", h1:"İngilizce voleybol kelime oyunu" }
];

const read = file => fs.readFileSync(path.join(root, file), "utf8");

test("acquisition pages have unique indexable metadata and meaningful server HTML", () => {
  const titles = new Set(), descriptions = new Set();
  for (const page of pages) {
    const html = read(page.file);
    const title = html.match(/<title>(.*?)<\/title>/)?.[1];
    const description = html.match(/<meta name="description" content="([^"]+)">/)?.[1];
    assert.ok(title && description, page.file);
    assert.equal((html.match(/rel="canonical"/g) || []).length, 1, page.file);
    assert.match(html, new RegExp(`<link rel="canonical" href="${page.canonical.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}">`));
    assert.match(html, new RegExp(`<h1>${page.h1}<\\/h1>`));
    assert.match(html, /<main id="main">/);
    assert.match(html, /BreadcrumbList/);
    assert.doesNotMatch(html, /FAQPage|AggregateRating|Poma Kingdom|Poma Krallığı/);
    titles.add(title); descriptions.add(description);
  }
  assert.equal(titles.size, pages.length);
  assert.equal(descriptions.size, pages.length);
});

test("hub and product pages form a crawlable network and launch real games", () => {
  const hub = read(pages[0].file), football = read(pages[1].file), volleyball = read(pages[2].file), home = read("index.html");
  assert.match(home, /href="\/ingilizce-oyunlari\/"/);
  assert.match(hub, /href="\/ingilizce-oyunlari\/futbol\/"/);
  assert.match(hub, /href="\/ingilizce-oyunlari\/voleybol\/"/);
  assert.match(hub, /href="\/#\/game\/football"/);
  assert.match(hub, /href="\/#\/game\/volleyball"/);
  assert.match(football, /href="\/#\/game\/football"/);
  assert.match(volleyball, /href="\/#\/game\/volleyball"/);
});

test("all static page assets resolve in the repository", () => {
  for (const page of pages) {
    const html = read(page.file);
    for (const match of html.matchAll(/(?:src|href)="(\/[^"#?]+)"/g)) {
      const target = match[1].endsWith("/") ? path.join(root, match[1], "index.html") : path.join(root, match[1]);
      assert.equal(fs.existsSync(target), true, `${page.file}: ${match[1]}`);
    }
  }
});

test("sitemap and build include all acquisition documents", () => {
  const sitemap = read("sitemap.xml"), build = read("scripts/build.js");
  for (const page of pages) {
    assert.match(sitemap, new RegExp(page.canonical.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")));
    assert.match(build, new RegExp(page.file.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")));
  }
  assert.match(build, /css\/acquisition-pages\.css/);
  assert.match(build, /js\/acquisition-page\.js/);
});

test("acquisition CTA measurement is consent-gated and privacy-limited", () => {
  const module = read("js/acquisition-page.js");
  assert.equal(ANALYTICS_EVENTS.has("product_cta_click"), true);
  assert.match(module, /trackEvent\(link\.dataset\.acquisitionEvent/);
  assert.doesNotMatch(module, /name|email|child|answer/i);
});
