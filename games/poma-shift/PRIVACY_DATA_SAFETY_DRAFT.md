# POMA SHIFT — PRIVACY POLICY / DATA SAFETY DRAFT

**Status:** INTERNAL RELEASE DRAFT — NOT READY TO PUBLISH  
**Updated:** 2026-08-07

Bu dosya Google Play privacy policy ve Data Safety hazırlığı için repo içi kanıt/karar taslağıdır. Play Console'a otomatik beyan değildir ve resmi hukuk görüşü değildir.

## 1. DO NOT PUBLISH UNTIL THESE ARE FILLED

Aşağıdaki iki alan gerçek production bilgisi olmadan doldurulmaz:

- `OFFICIAL_DEVELOPER_ENTITY_TBD` — Play listing'de görünecek geliştirici/şirket adı
- `OFFICIAL_PRIVACY_CONTACT_TBD` — privacy inquiry / deletion request için resmi e-posta veya form URL'si

Ayrıca yayından önce doğrulanmalı:

- `GA4_RETENTION_SETTING_TBD` — `G-LVDEFW23S9` property içindeki gerçek data-retention ayarı
- production AdMob SDK sürümü ve o sürümün Data Safety disclosure'ı
- production AdMob App ID / rewarded / interstitial IDs

Bu alanlar teyit edilmeden public privacy-policy sayfası üretme.

---

## 2. CURRENT APP EVIDENCE

### App identity
- App: **Poma Shift**
- Android application ID: `com.pomante.pomashift`
- targetSdk: 36
- account creation: **yok**
- precise/coarse location permission: **yok**

### Local-only game state
Oyun ilerlemesinin/ekonominin ana state'i cihazda tutulur. Örnekler:
- level progress
- coin / booster inventory
- 3-slot loadout
- lives / gift timing
- analytics preference

Bu local state kendi başına cihaz dışına gönderilen bir hesap/profil veritabanı değildir.

### Analytics — implemented
- Provider: Google Analytics 4 web tag
- Measurement property: `G-LVDEFW23S9`
- Poma Shift custom event namespace: `ps_*`
- analytics consent key: `poma.analytics.consent.v1`
- user denies analytics → Google tag yüklenmez; local gameplay telemetry çalışmaya devam eder
- user can reopen analytics preference from living lobby
- remote payload strict allowlist kullanır
- isim / e-posta / password / cevap / free-form user content remote allowlist'te değildir
- analytics layer sets `ad_storage`, `ad_user_data`, `ad_personalization` to denied

Remote allowlist'in ana ticari/ürün sinyalleri:
- session / level start
- level complete / fail / restart
- rewarded continue
- ad completion / placement
- booster purchase / use
- coin reward / life purchase / return gift
- character unlock
- RUSH start / complete / timeout

Noisy board-internal events (ör. `sugar_cloud_fill`) merkezi GA4'e gönderilmez.

### Ads / consent — implemented
- Google Mobile Ads SDK in current Android build: **24.9.0**
- Google UMP: **4.0.0**
- rewarded + interstitial code exists
- current default/test build Google demo ad IDs kullanabilir
- real production AdMob IDs henüz release gate'tir
- AD_ID permission build manifest'inde bulunur

---

## 3. OFFICIAL POLICY EVIDENCE TO RECHECK AT SUBMISSION

Google Play User Data policy gereği:
- privacy policy Play Console'da linklenmeli
- privacy policy app içinden erişilebilir olmalı
- developer/app identity policy ile tutarlı olmalı
- privacy point of contact veya inquiry mechanism bulunmalı
- policy access / collection / use / sharing / secure handling / retention / deletion davranışını açıklamalı
- Data Safety beyanı privacy policy ile tutarlı olmalı
- third-party SDK/tag davranışları developer'ın sorumluluğundadır

Privacy-policy URL:
- public
- active
- non-geofenced
- PDF olmayan
- kullanıcı tarafından değiştirilemeyen web sayfası
olmalıdır.

Google Play Data Safety formu third-party SDK ve app-controlled WebView tarafından cihaz dışına iletilen verileri de kapsar.

### Official references
- Google Play User Data policy: `https://support.google.com/googleplay/android-developer/answer/10144311`
- Google Play Data Safety form guidance: `https://support.google.com/googleplay/android-developer/answer/10787469`
- Google Mobile Ads SDK Data Safety disclosure: `https://developers.google.com/admob/android/privacy/play-data-disclosure`
- GA4 default data collection: `https://support.google.com/analytics/answer/11593727`
- GA4 regional/IP processing: `https://support.google.com/analytics/answer/11598602`

---

## 4. DATA SAFETY WORKING MATRIX

Bu tablo **final form cevabı değildir**. Play Console submit öncesi production build + provider ayarlarıyla tekrar doğrulanır.

| Data area | Current evidence | Likely Play category / purpose | Final status |
|---|---|---|---|
| IP-derived coarse location | Google Mobile Ads disclosure + GA4 default approximate geolocation | Approximate location; ads/analytics/fraud depending provider | VERIFY |
| Gameplay interactions | AdMob user product interactions + consented `ps_*` level/ad/booster events | App activity / app interactions; analytics, ads where applicable | VERIFY |
| Diagnostics/performance | Google Mobile Ads SDK disclosure | App info & performance / diagnostics; analytics/fraud | VERIFY |
| Advertising / device identifiers | AdMob manifest has AD_ID; Ads SDK disclosure includes ad ID/App Set ID | Device or other IDs; advertising/analytics/fraud | VERIFY |
| GA4 client ID | `_ga` client ID is created only after analytics consent in current implementation | Device or other identifiers / analytics | VERIFY |
| Account/profile data | App has no account creation | no app account data identified | VERIFY |
| Precise location | no fine/coarse location permission | no direct precise-location collection identified | VERIFY |
| User-entered free text / answers | Poma Shift remote analytics allowlist excludes these | no current Poma Shift analytics transmission identified | VERIFY |

### Important AdMob version caveat
Google's current public Mobile Ads Data Safety disclosure page documents the **latest SDK**, while the repo currently ships Mobile Ads **24.9.0**. Final Data Safety submission must match the exact SDK shipped. Do not copy a newer-version disclosure blindly.

---

## 5. PRIVACY POLICY CONTENT — PUBLISHABLE STRUCTURE

A public policy should contain these sections after the two identity/contact blockers are resolved.

### Privacy Policy — Poma Shift

**Developer:** `OFFICIAL_DEVELOPER_ENTITY_TBD`  
**Privacy contact:** `OFFICIAL_PRIVACY_CONTACT_TBD`  
**Effective date:** publish date

#### What Poma Shift stores on the device
Poma Shift stores gameplay state such as progress, coins, boosters, selected loadout, lives/timers, gift state and privacy preference locally on the device so the game can continue between sessions.

#### Analytics
Poma Shift offers an analytics choice. If the user accepts analytics, limited gameplay events are sent to Google Analytics to understand items such as level starts/completions/failures, rewarded continue usage, ad completion placement, booster usage/purchases and RUSH performance. Poma Shift does not intentionally include names, email addresses, passwords, answers or free-form user content in its custom analytics payload.

If analytics is declined, the Google Analytics tag is not loaded by the Poma Shift analytics layer and the game remains usable. The analytics preference can be changed from the game lobby.

Google Analytics may process session statistics, approximate geolocation and browser/device information and may use a pseudonymous client identifier when analytics storage is allowed. Google states that GA4 uses IP addresses for location/routing and does not log/store raw IP addresses in GA4 data centers.

#### Advertising
Poma Shift uses Google Mobile Ads for rewarded and interstitial advertising and Google UMP for consent/privacy messaging where applicable. Google Mobile Ads may process information such as IP-derived approximate location, app/user product interactions, diagnostics, and device/account identifiers for advertising, analytics and fraud-prevention/security purposes, depending on configuration and user/privacy choices.

#### Sharing / service providers
Third-party Google services used by the app can include:
- Google Analytics 4
- Google Mobile Ads / AdMob
- Google User Messaging Platform

These services process data under their own terms/policies and configured consent/privacy controls.

#### Security
Network transmission to Google services uses encrypted HTTPS/TLS connections according to the relevant Google service documentation. No guarantee of absolute security should be stated.

#### Retention
- local gameplay state remains on the device until app/browser data is cleared or the app removes/overwrites it
- GA4 retention language must match `GA4_RETENTION_SETTING_TBD`
- advertising/provider-side retention follows applicable Google service controls/policies and must be described consistently with final production configuration

#### Deletion / user choices
Because Poma Shift currently has no user account, there is no server-side Poma Shift account profile to delete. Users can remove locally stored game data by clearing app/site data or uninstalling the app. Analytics preference can be changed inside the game.

Any request concerning provider-side/privacy data must have a real inquiry/deletion path through `OFFICIAL_PRIVACY_CONTACT_TBD` before publication.

#### Children / target audience
Current product decision is broad casual puzzle positioning; the app is not intentionally packaged as a child-directed-only app. Final text must remain consistent with the Play Console Target Audience declaration and store creatives.

#### Changes
Policy changes should be published with an updated effective date and should remain consistent with the production build and Play Data Safety declaration.

---

## 6. PLAY CONSOLE INPUT PREP

Before submission:

- [ ] official developer entity confirmed
- [ ] official privacy contact / inquiry mechanism confirmed
- [ ] final HTTPS privacy-policy page deployed
- [ ] privacy link reachable inside app
- [ ] privacy-policy URL entered in Play Console
- [ ] GA4 Realtime event visibility verified with real consent
- [ ] GA4 actual retention setting recorded
- [ ] production AdMob IDs provisioned
- [ ] exact shipped Mobile Ads SDK disclosure rechecked
- [ ] Data Safety form completed against the **final signed AAB**, not an older test build
- [ ] Ads declaration completed
- [ ] Target Audience declaration matches store listing/creative
- [ ] Content Rating completed

---

## 7. NON-NEGOTIABLE RULE

Do not mark privacy/Data Safety complete from code inspection alone.

Final closure requires:
1. exact production build,
2. exact provider configuration,
3. official developer/contact identity,
4. public privacy-policy URL,
5. Play Console declarations that match the above.
