# Poma Shift — Launch Candidate

Bu klasör Poma Shift'in oynanabilir web motorunu ve native release için kullanılan ortak asset setini içerir.

Güncel yaşayan ürün durumu için önce `POMA_SHIFT_MASTER_CONTEXT.md` okunur.

**2026-08-09 core revision:** Board/SHIFT tehdidi için `SUGAR_CLOUD_CORE_V3.md` güncel ve otoriter karardır. `LOFT_CORE_V2.md` ile değişken board / descending-LOFT anlatımı bu konuda geçersizdir.

Paralel görsel üretim briefi: `ASSET_WORK_PLAN.md`.

## Çalıştırma

Repo kökünde:

```bash
npm run serve
```

Sonra:

```text
http://127.0.0.1:8765/games/poma-shift/
```

Canlı hedef yol:

```text
https://pomante.com.tr/games/poma-shift/
```

Canlı DNS/deploy durumu ayrıca doğrulanmalıdır; GitHub dosyasının mevcut olması tek başına yayının doğrulandığı anlamına gelmez.

## Core motor

- 3 parçalık batch
- drag/drop
- yalnız tam yatay satır clear
- her 3 satırda SHIFT
- **bütün standart gameplay boardu 7×9 sabit**
- SHIFT ile **Şeker Bulutu üstten aşağı 1 satır büyür**
- board fiziksel olarak küçülmez; bulutun kapladığı satırlar kilitlenir
- normal levelde sıradaki 1 satır cloud-crush güvenlik kontrolüne girer
- RUSH levelde bulut kenarından sonraki 2 danger row güvenli olmalıdır
- cloud-crush / no-legal-move / move-limit / rush-timeout fail türleri
- fairness katmanı
- action-based combo
- müzik / ses / haptic / threat feedback
- local progress ve telemetry
- aktif level karakteri + power cast presentation katmanı

### Sugar Cloud V3

Yeni ana kimlik:

> **shape placement + growing Sugar Cloud + character powers**

Normal level içinde board her zaman `7×9` görünür ve oynanış geometrisi değişmez.

Örnek:
- başlangıç: `7×9`, bulut `0` satır kaplı
- SHIFT 1: `7×9`, bulut `1` satır kaplı
- SHIFT 2: `7×9`, bulut `2` satır kaplı

Bulut en yakın bloklara yaklaşık 2 satır kaldığında hafif kararır; kritik yakınlıkta şimşek/pulse feedback'i verir.

Detay: `SUGAR_CLOUD_CORE_V3.md`.

## Web cache policy — launch candidate

`manifest.webmanifest` ve `sw.js` dosyaları repository'de tutulur fakat launch-candidate web runtime'ında eski Poma Shift service-worker registration/cache'leri `index.html` tarafından bilinçli olarak temizlenir.

Amaç:
- deploy sonrası eski gameplay/economy JS'inin cache'te takılı kalmasını önlemek
- test ve tuning sırasında herkesin aynı güncel sürümü almasını sağlamak

Bu nedenle mevcut web sürümü **offline PWA olarak vaat edilmez**.

Native Android uygulama ise web assetlerini uygulama paketine yerel olarak kopyalar; browser service-worker cache'ine bağımlı değildir.

## RUSH — kilitli son karar

RUSH için `RUSH_RULES.md` + `SUGAR_CLOUD_CORE_V3.md` birlikte otoritedir; geometry/tehdit konusunda Sugar Cloud V3 önceliklidir.

- ilk RUSH Level 11
- sonra her 5 levelde bir; boss slotları hariç
- eski 7/6/5 saniyelik tray timer kalıcı olarak kapalıdır
- RUSH'ta bütün level sürelidir
- level başlamadan kural kartı çıkar
- **BAŞLA** denmeden sayaç başlamaz
- Level 11: 60 sn / 2 SHIFT
- Level 15–24: 50 sn / 3 SHIFT
- Level 25–49: 45 sn / 3 SHIFT
- Level 50+: 40 sn / 4 SHIFT
- RUSH SHIFT öncesi mevcut Şeker Bulutu kenarının altındaki 2 danger row güvenli olmalıdır
- uygulama arka plana alınırsa clock durur
- aktif RUSH sırasında harita / mağaza / can / hediye modalları kapalıdır
- intro kapanınca canvas inputu watchdog ile açık tutulur

## Meta / ekonomi katmanı

`META_SPEC.md` temel ekonomi kontratını taşır; Sugar Cloud V3 ile çelişen core-power copy'lerinde V3 önceliklidir.

- 10.000+ level taşıyan difficulty-wave generator
- karakter milestone'ları
- karakter eşyası / booster sistemi
- Poma Coin ekonomisi
- 3-can sistemi
- rewarded continue: +3 hamle, level başına maksimum 5
- Level 5 sonrası interstitial placement
- 12 saat dönüş ödülü
- Level 90 özel Şeker Fırtınası boss varyantı
- her 30 levelde future boss slotu
- ölçeklenebilir level haritası

### Dahi Poma

Eski `10 hamle board dondurma` davranışı geçersizdir.

Yeni güç:

> **Güvenlik Kalkanı — Şeker Bulutu'nun bir sonraki ilerlemesini 1 kez engeller.**

SHIFT hedefte sayılır, bulut o SHIFT'te büyümez ve kalkan tüketilir.

## Gameplay karakter bandı

- Level 1–9: **Poma**
- Level 10–19: **Poma Dahi / Güvenlik Kalkanı**
- Level 20–29: **Influencer Poma / Telefon**
- Level 30–39: **Okçu Poma / Ok**
- Level 40–49: **Bozkurt Poma / Kurt Pençesi**
- Level 50–59: **Baby Poma / Emzik Salyası**
- Level 60–69: **Dede Poma / Asa Gücü**
- Level 70–79: **Fire Poma / Alev Dalgası**
- Level 80–89: **PomaHero / Sihirli Yaprak**
- Level 90: **PomaHero vs özel Şeker Fırtınası boss varyantı**

Gameplay ekranında tek aktif karakter görünür. Güç kullanımında kısa cast → projectile/effect → board impact presentation katmanı vardır.

## Token görsel yönü

Düz/jenerik küpler yerine altı okunabilir token kimliği kullanılır:
- yıldız
- yaprak
- damla
- kalp/petal
- kristal
- enerji/alev

Grid hitbox matematiği kare olarak kalır.

Asset brief: `ASSET_WORK_PLAN.md`.

## Native Android / AdMob

Native scaffold:

```text
games/poma-shift/native/
```

Kullanılan ana paketler:
- Capacitor 8.4.2
- `@capacitor/android` 8.4.2
- `@capacitor-community/admob` 8.0.0

Native bridge:
- rewarded reklam
- interstitial reklam
- consent info/form akışı
- safe Google demo ad IDs ile test mode
- production ad unit ID'lerini environment değişkenlerinden alma

Production build için gerçek unit ID'leri repository'ye yazılmaz.

Android debug workflow:
- Capacitor Android project üretir
- güvenli test AdMob app ID'sini uygular
- Gradle ile debug APK oluşturur
- APK'yı GitHub Actions artifact olarak yükler

## Ana dosyalar

- `POMA_SHIFT_MASTER_CONTEXT.md` — yaşayan proje durumu ve çalışma sırası
- `SUGAR_CLOUD_CORE_V3.md` — 2026-08-09 sabit 7×9 + büyüyen Şeker Bulutu core kararı
- `LOFT_CORE_V2.md` — historical/superseded core revizyonu
- `ASSET_WORK_PLAN.md` — paralel görsel/animasyon üretim briefi
- `GAME_SPEC.md` — çekirdek motor spesifikasyonu; Sugar Cloud V3 ile çelişen eski geometry satırları geçersizdir
- `RUSH_RULES.md` — RUSH timer ve cadence kuralları; danger geometry V3'e tabidir
- `META_SPEC.md` — meta progression / ekonomi / reklam / boss kilitleri
- `ART_DIRECTION.md` — güncel görsel yön; core threat V3'e tabidir
- `PRODUCT_AUDIT.md` — launch audit
- `game.js` — core motor tabanı
- `sugar-cloud-core-v3.js` — sabit 7×9 geometry, cloud-row kilidi, token fallback ve cloud feedback
- `sugar-cloud-core-v3.css` — bulut büyüme, warning, critical, lightning ve shield görünümü
- `sugar-cloud-meta-v3.js` — Dahi Poma tek-kullanımlık cloud shield semantiği
- `rush-cloud-v3.js` — RUSH cloud-edge danger zone ve input recovery
- `character-gameplay-v1.js` — aktif level karakteri + power cast presentation
- `character-gameplay-v1.css` — karakter reaction/projectile/impact hareket dili
- `game-feel.js` — mobil feel, animasyon ve fairness
- `product-ui.js` — move budget, modal ve temel map UI
- `rush-disable.js` — eski exploitable tray timerı kalıcı olarak engeller
- `rush-mode.js` — full-level RUSH clock ve giriş kartı
- `combo-system.js` — hamle bazlı satır clear combo
- `audio-mix.js` — gameplay SFX / map music katmanı
- `meta-system.js` — Coin, can, booster, boss, reklam hook'ları, scalable map
- `analytics-bridge.js` — local telemetry + production provider contract
- `TEST_PLAN.md` — core gerçek oyuncu test planı
- `META_TEST_PLAN.md` — meta/runtime release gate
- `native/` — Capacitor Android + native AdMob bridge

## Reklam entegrasyon kontratı

Web oyun katmanı şu kontratı kullanır:

```js
window.PomaShiftAds = {
  rewarded: async (placement) => true,
  interstitial: async (placement) => true,
};
```

Web prototipte test adapterı, native shell'de AdMob provider bu kontratı uygular.