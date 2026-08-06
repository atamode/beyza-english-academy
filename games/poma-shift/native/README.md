# Poma Shift — Native Store Shell

Bu klasör Poma Shift web motorunu Android/iOS mağaza uygulamasına paketlemek için ayrılmıştır.

## Stack

- Capacitor 8.4.2
- Android/iOS native shell
- `@capacitor-community/admob` 8.0.0
- esbuild 0.28.1

Ana oyun kaynağı hâlâ `games/poma-shift/` içindedir. Native klasör ikinci bir oyun kopyası değildir; build sırasında web varlıklarını `www/` içine hazırlar.

## İlk kurulum

```bash
cd games/poma-shift/native
npm install
npm run android:add
npm run android:open
```

Daha sonraki web/meta değişikliklerinde:

```bash
npm run android:sync
```

Bu komut:
1. Poma Shift web dosyalarını `www/` içine kopyalar.
2. Native asset yollarını düzeltir.
3. AdMob bridge'ini bundle eder.
4. Capacitor Android projesine sync eder.

## App ID

Hazırlık kimliği:

```text
com.pomante.pomashift
```

Google Play'e ilk production upload yapılmadan önce son kez kontrol edilmelidir. Store'a çıktıktan sonra package/application ID değiştirilmez.

## AdMob test modu

Varsayılan build güvenli şekilde **TEST MODE** çalışır. Google'ın demo rewarded/interstitial ID'leri native bridge içinde otomatik kullanılır.

## Production AdMob config

Build script'in kullandığı environment değişkenleri:

```bash
POMA_ADS_TESTING=false
POMA_ADMOB_ANDROID_APP_ID=ca-app-pub-...~...
POMA_ANDROID_REWARDED_AD_UNIT_ID=ca-app-pub-.../...
POMA_ANDROID_INTERSTITIAL_AD_UNIT_ID=ca-app-pub-.../...
POMA_IOS_REWARDED_AD_UNIT_ID=ca-app-pub-.../...
POMA_IOS_INTERSTITIAL_AD_UNIT_ID=ca-app-pub-.../...
```

Production modunda gerekli ad unit ID yoksa bridge build'i hata verir; boş ID ile sahte başarı üretmez.

Android AdMob App ID, `scripts/configure-android-test.mjs` tarafından `POMA_ADMOB_ANDROID_APP_ID` environment değerinden `AndroidManifest.xml` içine yazılır. Environment değeri yoksa yalnız test/debug build için Google sample App ID kullanılır.

**AdMob App ID** rewarded/interstitial ad unit ID ile aynı şey değildir.

## Consent

Native bridge:
- AdMob'u initialize eder
- Google UMP consent bilgisini ister
- gerektiğinde consent formunu gösterir
- uygulamayı child-directed olarak etiketlemez

Poma Shift geniş casual kitle oyunudur; çocuk uygulaması olarak paketlenmez.

## Web → native reklam kontratı

Ana oyun yalnız şu arayüzü bilir:

```js
window.PomaShiftAds = {
  rewarded: async placement => true,
  interstitial: async placement => true,
};
```

Web sürümünde test stub, native build'de gerçek AdMob adapterı kullanılır. Böylece oyun ekonomisi reklam SDK'sına bağlanmaz.

## CI build hatları

### Otomatik Android build

`.github/workflows/poma-shift-android.yml`

Poma Shift dosyaları değiştiğinde:
- Capacitor Android project üretir
- safe/test AdMob App ID uygular
- debug APK derler
- unsigned release AAB derler
- iki artifact'i de GitHub Actions'a yükler

### Production signed AAB

`.github/workflows/poma-shift-android-release.yml`

Yalnız manuel çalışır. Keystore veya şifre repository'ye yazılmaz; GitHub Secrets kullanılır.

Gerekli GitHub Secrets:

```text
POMA_ADMOB_ANDROID_APP_ID
POMA_ANDROID_REWARDED_AD_UNIT_ID
POMA_ANDROID_INTERSTITIAL_AD_UNIT_ID
POMA_ANDROID_KEYSTORE_B64
POMA_ANDROID_KEYSTORE_PASSWORD
POMA_ANDROID_KEY_ALIAS
POMA_ANDROID_KEY_PASSWORD
```

`POMA_ANDROID_KEYSTORE_B64`, Android upload keystore dosyasının base64 karşılığıdır. Workflow keystore'u geçici runner diskine açar, `bundleRelease` sırasında signing bilgilerini Gradle'a runtime parametreleriyle verir, AAB imzasını doğrular ve signed AAB artifact'i üretir.

## Release engelleri

Production mağaza build'i almadan önce zorunlu:
- gerçek AdMob App ID
- gerçek rewarded/interstitial unit ID'leri
- GitHub release secrets / upload keystore
- gizlilik politikası URL'si
- UMP/GDPR mesajlarının AdMob panelinde kurulması
- Google Play Data safety cevapları
- final launcher icon / adaptive icon
- signed Android App Bundle (AAB) workflow'unun başarılı koşusu
- gerçek cihazda rewarded + interstitial + consent akış testi

Production reklam ve signing kimlikleri bilerek repoya gömülmez.
