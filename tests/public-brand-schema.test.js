import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = file => fs.readFileSync(new URL(`../${file}`, import.meta.url), "utf8");

test("public story surfaces use the approved kingdom names", () => {
  const view = read("js/story-view.js");
  const story = read("data/stories/story-001.json");
  assert.doesNotMatch(view, /Poma Kingdom|Poma Krallığı/);
  assert.doesNotMatch(story, /Poma Kingdom|Poma Krallığı/);
  assert.match(view, /Pomante Krallığı/);
  assert.match(story, /Pomante Kingdom/);
});

test("root structured data keeps only verified page-parity entities", () => {
  const html = read("index.html");
  const raw = html.match(/<script type="application\/ld\+json" data-poma-structured-data>([\s\S]*?)<\/script>/)?.[1];
  assert.ok(raw, "structured data block exists");
  const graph = JSON.parse(raw);
  assert.deepEqual(graph.map(item => item["@type"]), ["Organization", "WebSite", "VideoObject"]);
  const video = graph.find(item => item["@type"] === "VideoObject");
  assert.equal(video.contentUrl, "https://academy.pomante.com.tr/assets/video/poma-academy/poma-world-intro.web.mp4");
  assert.equal(video.duration, "PT49.536S");
  assert.equal("embedUrl" in video, false);
  assert.doesNotMatch(raw, /FAQPage|SoftwareApplication|AggregateRating|Review/);
});
