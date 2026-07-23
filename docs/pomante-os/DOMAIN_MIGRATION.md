# Academy Domain Migration Contract

> **Purpose:** Safely move Poma Academy from `pomante.com.tr` to `academy.pomante.com.tr` while preserving access, authentication, measurement, PWA behavior, and search equity.
> **Update trigger:** Any hostname, DNS, hosting, redirect, Supabase Auth, analytics, or migration-state change.
> **Related files:** [Decision D-008](DECISIONS.md), [Master Tasks](MASTER_TASKS.md), [Search Console](SEARCH_CONSOLE.md), [Analytics](ANALYTICS.md)
> **Last reviewed:** 2026-07-23

## Fixed target and boundary

- Academy target origin: `https://academy.pomante.com.tr`.
- Existing Academy paths and fragments remain unchanged after the hostname move.
- `https://pomante.com.tr` becomes the separate Pomante commercial site. Academy and commercial source/deployments remain in separate repositories.
- Every former indexable Academy URL must receive a path-preserving permanent redirect to its Academy equivalent. Hash fragments are client-side and cannot be redirected by the server; visible commercial navigation must provide a direct Academy entry.
- Do not cut over until rollback ownership, redirect capability, DNS access, GitHub Pages access, Supabase Auth configuration access, Search Console access, and GA4 access are confirmed.

## Preparation status

- Prepared on isolated branch: `mt-013-academy-hostname`.
- Updated in source: canonicals, Open Graph/structured-data URLs, sitemap, robots, live-check defaults, analytics fallback, report/payment/reminder email links, and the payment Edge Function's transitional CORS allowlist.
- Intentionally unchanged before cutover: tracked `CNAME`, GitHub Pages custom domain, DNS, Supabase Auth dashboard settings, deployed Edge Functions, GA4, and Search Console.
- Automated migration guards require Academy discovery/email URLs, both old and new transition origins in CORS, portable PWA scope, and the current root `CNAME`.

## Verified repository dependency inventory

| Surface | Current dependency | Required migration change |
|---|---|---|
| GitHub Pages | Root `CNAME` contains `pomante.com.tr`; branch-published Pages repository | Change repository Pages custom domain and tracked `CNAME` to `academy.pomante.com.tr` |
| DNS | Current root serves GitHub Pages; Academy record not verified | Add `academy` CNAME pointing directly to `atamode.github.io`; avoid wildcard DNS |
| SEO | Root, hub, football, and volleyball canonicals/OG/JSON-LD/sitemap/robots use the root hostname | Replace source URLs with the Academy origin and rebuild tracked `dist/` outputs |
| Live checks | Playwright and scheduled smoke workflow default to the root hostname | Move defaults to the Academy origin after cutover |
| Analytics | Runtime uses `location.origin`; a fallback uses the root hostname | Change only the fallback and verify GA4 stream/domain configuration, referral handling, consent, and live receipt |
| PWA | Manifest `start_url` and `scope` are relative; service worker is same-origin | No path rewrite expected; bump cache through the normal build and verify clean install/update on the new origin |
| Supabase Auth | Password sign-in and signup use the project Auth API; signup does not send an explicit redirect URL | Before cutover, set Site URL to Academy and allow both old and new origins during the transition; verify confirmation/reset templates and links |
| Edge Functions | Payment-decision CORS allowlist contains root and `www`; report/payment/reminder email links use root | Add Academy origin to CORS before cutover; change application links to Academy and redeploy affected functions |
| Application links | Partner copy uses `location.origin`; internal hash navigation is relative | Partner link follows the new origin automatically; validate all email and external entry links separately |
| Commercial root | Separate repository/host not yet available in this workspace | Must provide the commercial home plus path-preserving HTTP redirects for former Academy indexable paths |

## Canonical URL and redirect map

| Old URL | New canonical | Required old-host response |
|---|---|---|
| `https://pomante.com.tr/` | `https://academy.pomante.com.tr/` | Commercial home remains 200 after launch; provide a prominent “Poma ile Eğitim” link. This is the intentional exception to whole-host redirection. |
| `/ingilizce-oyunlari/` | `https://academy.pomante.com.tr/ingilizce-oyunlari/` | 301, preserving path and query |
| `/ingilizce-oyunlari/futbol/` | `https://academy.pomante.com.tr/ingilizce-oyunlari/futbol/` | 301, preserving path and query |
| `/ingilizce-oyunlari/voleybol/` | `https://academy.pomante.com.tr/ingilizce-oyunlari/voleybol/` | 301, preserving path and query |
| Former Academy asset/application paths requested on the root | Same path on Academy where compatibility is required | Prefer 301 for documents; retain or proxy critical assets for a measured transition if old email/social caches require them |

The root exception means the old Academy home cannot redirect permanently because it becomes the commercial home. Search continuity therefore relies on the commercial page's visible Academy link, the new Academy canonical/sitemap, Search Console change signals, and direct redirects for the three dedicated acquisition paths.

## Blocking hosting decision

GitHub Pages custom-domain configuration does not itself provide arbitrary path-level server rules. MT-013 cannot pass its cutover gate until the commercial-root hosting or an edge/CDN layer is proven to return real HTTP 301 responses for the three acquisition paths. Meta refresh or JavaScript-only redirects are fallback navigation aids, not accepted SEO redirects.

## Ordered execution

### 1. Preflight and rollback capture

1. Record current DNS values/TTL, Pages settings, Supabase Auth Site URL/redirect allowlist, function deployments, GA4 stream settings, Search Console properties/sitemaps, and the verified Academy commit.
2. Lower relevant DNS TTL in advance if the provider permits it.
3. Verify `academy.pomante.com.tr` ownership in GitHub before pointing DNS, following GitHub's takeover-protection guidance.
4. Prepare a rollback commit with the current `CNAME`, root-domain metadata, email links, CORS list, smoke target, and generated outputs.

### 2. Prepare both deployments without taking the root offline

1. In Academy source, replace hostname-bound metadata/configuration and build outputs; keep the old origin temporarily allowed in Supabase and CORS.
2. In the commercial repository, implement the root home, “Poma ile Eğitim” link, and exact 301 rules for the three acquisition paths.
3. Add the Academy hostname to Supabase Auth redirect URLs before changing Site URL. Review confirmation, recovery, magic-link, and invitation templates for `{{ .SiteURL }}`/redirect behavior.
4. Deploy affected Edge Functions only after automated template/CORS tests pass.

### 3. Cutover window

1. Configure the Academy repository's Pages custom domain as `academy.pomante.com.tr` and set its `CNAME` accordingly.
2. Add DNS `academy CNAME atamode.github.io` without the repository path; wait for DNS and certificate readiness, then enforce HTTPS.
3. Publish the commercial root and its redirect rules, then point root DNS to that hosting.
4. Set Supabase Auth Site URL to `https://academy.pomante.com.tr`; retain explicit old/new allowlist entries for the observation window.
5. Submit the new Academy sitemap and inspect the four new URLs. Keep the old Search Console property monitored; do not delete its history or sitemap record prematurely.
6. Change live-smoke default to Academy and run smoke plus authentication/email-link checks.

### 4. Observation and cleanup

Monitor at least DNS/HTTPS, 4xx/5xx, redirect status/location, Search Console indexing/canonical reports, GA4 real-time receipt, signup/login, email confirmation/recovery, PWA install/update, game/story media, and partner links. Remove the old Supabase redirect/origin allowances only after old traffic and issued-email lifetime are understood and the observation window passes.

## Acceptance checks

- `academy.pomante.com.tr` serves HTTPS 200 for `/`, the game hub, football, and volleyball; each has one self-canonical on Academy.
- The old three acquisition URLs return one-hop 301 responses to the exact Academy paths, with no loop or chain.
- Root commercial home returns 200 and visibly links to Academy.
- Academy sitemap and robots reference only Academy URLs; no source or built HTML retains accidental root canonicals/OG/JSON-LD URLs.
- Login, signup, confirmation, recovery, parent report, membership, reminder, payment-decision email, and teacher partner flows resolve to the intended Academy origin.
- The payment Edge Function accepts Academy CORS and rejects unapproved origins.
- Fresh and previously installed PWA sessions update without an offline loop; football, volleyball, Story 001, and victory media load.
- Scheduled live smoke targets Academy and passes; GA4 receives consented Academy page views without child-identifying data.
- Search Console receives the Academy sitemap and all four URL inspections are usable/indexable as intended.

## Rollback trigger and action

Rollback immediately for unresolved certificate failure, broad 4xx/5xx, auth/email-link failure, redirect loops, missing core media, or commercial-root outage. Restore the prior Academy Pages custom domain/CNAME and root DNS, restore Supabase Site URL while retaining both allowed origins, redeploy the prior function versions if needed, and rerun the verified live smoke. Do not roll back by force-pushing or discarding unrelated work.

## External operational evidence

- GitHub requires adding the custom domain in repository settings before DNS, recommends domain verification, directs a subdomain CNAME to `<user>.github.io` without the repository name, and notes DNS/HTTPS provisioning can take up to 24 hours.
- Supabase Auth Site URL and additional redirect URLs govern permitted post-auth destinations; email templates may derive links from Site URL and redirect parameters. Both origins must be explicitly covered during transition.

Sources: [GitHub Pages custom-domain guidance](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site), [Supabase redirect URL guidance](https://supabase.com/docs/guides/auth/redirect-urls).
