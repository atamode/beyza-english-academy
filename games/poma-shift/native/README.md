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

Şimdiki hazırlık kimliği:

```text
com.pomante.pomashift
```

Google Play'e ilk production upload yapılmadan önce son kez kontrol edilmelidir. Store'a çıktıktan sonra package/application ID değiştirilmez.

## AdMob test modu

Varsayılan build güvenli şekilde **TEST MODE** çalışır.
Google'ın demo rewarded/interstitial ID'leri native bridge içinde otomatik kullanılır.

Production reklam için ortam değişkenleri:

```bash
POMA_ADS_TESTING=false
POMA_ADMOB_ANDROID_REWARDED=ca-app-pub-.../...
POMA_ADMOB_ANDROID_INTERSTITIAL=ca-app-pub-.../...
POMA_ADMOB_IOS_REWARDED=ca-app-pub-.../...
POMA_ADMOB_IOS_INTERSTITIAL=ca-app-pub-.../...
npm run android:sync
```

Production build'de ID yoksa bridge reklam göstermeyi reddeder; boş ID ile sahte başarı vermez.

## Android AdMob App ID

`npx cap add android` sonrasında gerçek AdMob **App ID** ayrıca Android native projeye girilmelidir.

`android/app/src/main/AndroidManifest.xml` application içine:

```xml
<meta-data
  android:name="com.google.android.gms.ads.APPLICATION_ID"
  android:value="@string/admob_app_id" />
```

`android/app/src/main/res/values/strings.xml`:

```xml
<string name="admob_app_id">ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY</string>
```

Bu **App ID**, rewarded/interstitial ad unit ID ile aynı şey değildir.

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

## Release engelleri

Production mağaza build'i almadan önce zorunlu:
- gerçek AdMob App ID
- gerçek rewarded/interstitial unit ID'leri
- gizlilik politikası URL'si
- UMP/GDPR mesajlarının AdMob panelinde kurulması
- Google Play Data safety cevapları
- final launcher icon / adaptive icon
- signed Android App Bundle (AAB)
- gerçek cihazda test reklamlarıyla rewarded + interstitial akış testi

Şu an bu klasör store altyapısını hazırlar; production reklam hesabı kimlikleri bilerek repoya gömülmez.
