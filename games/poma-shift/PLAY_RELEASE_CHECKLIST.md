# POMA SHIFT — GOOGLE PLAY RELEASE CHECKLIST

**Status:** RELEASE WORKING CHECKLIST  
**Updated:** 2026-08-07

Bu dosya Google Play yayın hazırlığını teknik gerçeklere göre izler. Ürün kararları için `POMA_SHIFT_MASTER_CONTEXT.md`, runtime audit için `PRODUCT_AUDIT.md` otoritedir.

## 1. VERIFIED ANDROID BUILD FACTS

2026-08-06 üretilen release AAB artifact içinden doğrulandı:

- package/application ID: `com.pomante.pomashift`
- minSdkVersion: **24**
- compileSdkVersion: **36**
- targetSdkVersion: **36**
- Android Gradle Plugin: **8.13.0**
- Google Mobile Ads SDK: **24.9.0**
- Google User Messaging Platform: **4.0.0**
- `android.permission.INTERNET`: var
- `android.permission.ACCESS_NETWORK_STATE`: var
- `com.google.android.gms.permission.AD_ID`: var
- Privacy Sandbox ad-services izinleri SDK tarafından manifest'e ekleniyor
- `ACCESS_FINE_LOCATION`: yok
- `ACCESS_COARSE_LOCATION`: yok

Build hattı:
- debug APK: PASS
- unsigned release AAB: PASS
- signed production AAB workflow: hazır, secrets bekliyor

Google Play'in 31 Ağustos 2026'dan itibaren yeni mobil uygulamalar/güncellemeler için istediği Android 16 / API 36 hedefi teknik olarak karşılanıyor.

---

## 2. ADMOB / CONSENT

Kodda mevcut:
- rewarded ads
- interstitial ads
- Google UMP consent info request
- gerektiğinde consent form gösterme
- default/test build'de Google demo reklam ID'leri
- production reklam kimliklerini environment/GitHub Secrets üzerinden alma

Production öncesi dış kurulum:
- [ ] AdMob Android App ID oluştur
- [ ] Rewarded ad unit oluştur
- [ ] Interstitial ad unit oluştur
- [ ] AdMob Privacy & Messaging / UMP mesajlarını yayınla
- [ ] GitHub release secrets içine gerçek ID'leri koy
- [ ] gerçek cihazda consent akışı smoke test
- [ ] gerçek cihazda rewarded reklam → ödül delivery smoke test
- [ ] gerçek cihazda interstitial completion smoke test

---

## 3. ANALYTICS / DATA SAFETY — EVIDENCE BASELINE

**Önemli:** Play Console formu submit edilmeden önce kullanılan SDK/tag sürümleri ve gerçek production davranışı tekrar kontrol edilir. Bu bölüm teknik hazırlık notudur; Play Console adına otomatik beyan değildir.

### Poma Shift analytics provider
Kod tarafında production provider hazırdır:
- GA4 measurement property: `G-LVDEFW23S9`
- oyun eventleri ayrı `ps_*` namespace'i kullanır
- kullanıcı tercihi: `poma.analytics.consent.v1`
- analytics reddedilirse Google tag yüklenmez; local oyun telemetry çalışmaya devam eder
- analytics tercihi lobby içinden tekrar değiştirilebilir
- analytics katmanı reklam depolama/kullanıcı verisi/kişiselleştirme consentini açmaz
- remote event/payload strict whitelist kullanır; isim, e-posta, cevap ve serbest kullanıcı metni gönderilmez
- test/production smoke `testing=true` kullanır; gerçek GA4 property test trafiğiyle kirletilmez

External doğrulama:
- [ ] gerçek production consent ile en az bir `ps_*` eventin GA4 Realtime/DebugView içinde görüldüğünü doğrula

### AdMob / Google Mobile Ads
Mevcut build yalnız kendi localStorage oyun state'i açısından cihaz içinde çalışır; ancak AdMob SDK ağ üzerinden veri işler. Bu nedenle `No data collected/shared` seçeneği güvenli değildir.

Google Mobile Ads SDK dokümantasyonuna göre değerlendirilmesi gereken veri kategorileri:

### Approximate location
Kaynak:
- IP address, genel konum tahmini için kullanılabilir.

Amaçlar:
- advertising / marketing
- analytics
- fraud prevention / security

### App activity / user product interactions
Örnek:
- app launch
- taps
- ad/video interactions
- Poma Shift GA4 tarafında consent sonrası level sonucu / reklam tamamlanması / güç kullanımı gibi whitelist edilmiş oyun olayları

Amaçlar:
- advertising / marketing
- analytics
- fraud prevention / security

### App info and performance / diagnostics
Örnek:
- SDK/app launch performance
- hang / diagnostic information
- energy/performance signals

Amaçlar:
- advertising / marketing
- analytics
- fraud prevention / security

### Device or other IDs
Örnek:
- Android Advertising ID
- App Set ID
- SDK/tag tarafından işlenebilecek ilgili device/client identifiers

Amaçlar:
- advertising / marketing
- analytics
- fraud prevention / security

Google Mobile Ads tarafındaki iletimin TLS ile şifreli olduğu Google'ın SDK disclosure dokümantasyonunda belirtilir.

---

## 4. PRIVACY POLICY

Google Play release öncesi:
- [ ] aktif HTTPS privacy-policy URL
- [ ] privacy policy Play Console listing'e girildi
- [ ] privacy policy uygulama içinden erişilebilir
- [ ] policy developer/app identity ile tutarlı
- [ ] privacy inquiry/contact mechanism var
- [ ] AdMob/Google üçüncü taraf paylaşımı açıklanmış
- [ ] GA4 / `ps_*` oyun analytics kullanımı ve consent tercihi açıklanmış
- [ ] veri türleri / amaçları açıklanmış
- [ ] consent / regional privacy choices açıklanmış
- [ ] retention/deletion dili gerçek uygulama davranışıyla tutarlı

**Blocker:** Privacy contact adresi/mekanizması için production'da kullanılacak resmi kanal henüz repoda tanımlı değil. Kişisel e-posta veya sahte adres otomatik eklenmez.

---

## 5. APP CONTENT / TARGET AUDIENCE

Mevcut ürün kararı:
- Poma Shift yalnız çocuklara yönelik paketlenmez
- geniş casual puzzle kitlesi hedeflenir
- child-directed advertising etiketi kodda zorunlu olarak açılmaz

Play Console submit öncesi:
- [ ] Target audience beyanı gerçek store creative/copy ile aynı
- [ ] Content rating formu tamamlandı
- [ ] Ads declaration tamamlandı
- [ ] Families/children kapsamına yanlışlıkla girecek store copy/creative kontrol edildi

---

## 6. SIGNING / PRODUCTION BUNDLE

Hazır workflow:

`.github/workflows/poma-shift-android-release.yml`

Gerekli GitHub Secrets:
- [ ] `POMA_ADMOB_ANDROID_APP_ID`
- [ ] `POMA_ANDROID_REWARDED_AD_UNIT_ID`
- [ ] `POMA_ANDROID_INTERSTITIAL_AD_UNIT_ID`
- [ ] `POMA_ANDROID_KEYSTORE_B64`
- [ ] `POMA_ANDROID_KEYSTORE_PASSWORD`
- [ ] `POMA_ANDROID_KEY_ALIAS`
- [ ] `POMA_ANDROID_KEY_PASSWORD`

Sonra:
- [ ] manual production release workflow SUCCESS
- [ ] signed AAB signature verify PASS
- [ ] signed AAB internal testing track upload

Keystore/şifre repository'ye commit edilmez.

---

## 7. STORE ASSETS

Mevcut web icon `games/poma-shift/icon.svg` işlevsel prototip/brand iconudur; final Play launcher/store creative olarak ayrıca kalite kontrolü gerekir.

Eksik/review:
- [ ] final adaptive launcher icon
- [ ] 512×512 Play icon
- [ ] feature graphic 1024×500
- [ ] telefon screenshots
- [ ] kısa açıklama
- [ ] uzun açıklama
- [ ] kategori / tags
- [ ] support/developer contact

---

## 8. RELEASE QUALITY GATES

Automated:
- [x] root CI tests/build
- [x] native Capacitor generation
- [x] debug APK generation
- [x] unsigned release AAB generation
- [x] API 36 target verification
- [x] current main live deploy Playwright smoke PASS
- [x] production analytics code/provider local Chromium contracts PASS

Runtime / human:
- [ ] L1 tutorial first-use test
- [ ] L11 RUSH real device smoke
- [ ] L20 milestone/booster unlock smoke
- [ ] L70 Fire Poma real device smoke
- [ ] L80 PomaHero unlock/power real device smoke
- [ ] L90 Sugar Cloud boss real device smoke
- [ ] rewarded continue max-5 real device smoke
- [ ] lives 1/15/30 minute edge cases
- [ ] 5–10 blind testers
- [ ] 20–50 external telemetry test

Commercial gate:
- [x] production analytics provider code
- [ ] GA4 Realtime/DebugView real production event verification
- [ ] real AdMob IDs
- [ ] real retention/fail/restart/RUSH data
- [ ] tuning based on data, not guesses

---

## 9. DO NOT FAKE-CLOSE

Aşağıdakiler gerçek external setup/test olmadan tamamlandı işaretlenmez:
- signed production AAB
- real AdMob serving
- GA4 Realtime/DebugView real event visibility
- privacy policy contact
- Play Data Safety submission
- real-device ad/consent test
- real player retention metrics
