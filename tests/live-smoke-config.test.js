import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = file => fs.readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
const config = read("playwright.live.config.mjs");
const smoke = read("tests/live-smoke/public-app.spec.js");
const workflow = read(".github/workflows/live-smoke.yml");
const pkg = JSON.parse(read("package.json"));

test("live smoke config is Chromium-only and blocks service workers", () => {
  assert.equal(pkg.scripts["test:smoke:live"], "playwright test --config=playwright.live.config.mjs");
  assert.match(config, /PLAYWRIGHT_BASE_URL \|\| "https:\/\/pomante\.com\.tr"/);
  assert.match(config, /projects:[\s\S]*name: "chromium"[\s\S]*browserName: "chromium"/);
  assert.doesNotMatch(config, /firefox|webkit/i);
  assert.match(config, /serviceWorkers: "block"/);
});

test("public smoke remains read-only and contains no privileged credentials", () => {
  assert.doesNotMatch(smoke, /\.submit\(|\.fill\(|signUp|createUser|insert\(|update\(|delete\(/);
  assert.doesNotMatch(smoke, /service_role|SUPABASE_SERVICE_ROLE_KEY|\.env\.e2e\.local/i);
  assert.match(smoke, /form\[data-account-form="login"\]/);
});

test("workflow runs after successful Pages deployment without secrets", () => {
  assert.match(
    workflow,
    /workflow_run:[\s\S]*workflows:[\s\S]*(?:pages-build-deployment|Deploy Pomante Pages \(clean\))[\s\S]*types:[\s\S]*completed/,
  );
  assert.match(workflow, /workflow_run\.conclusion == 'success'/);
  assert.doesNotMatch(workflow, /secrets\.|SUPABASE_|\.env\.e2e/i);
  assert.match(workflow, /uses: actions\/upload-artifact@v4[\s\S]*if-no-files-found: ignore/);
  assert.match(workflow, /if: failure\(\)[\s\S]*uses: actions\/upload-artifact@v4/);
});
