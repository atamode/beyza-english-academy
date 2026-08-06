# Poma Shift — Launch Candidate

Bu klasör Poma Shift'in oynanabilir web motorunu ve native release için kullanılan ortak asset setini içerir.

Güncel yaşayan ürün durumu için önce `POMA_SHIFT_MASTER_CONTEXT.md` okunur.

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
- board morph: 6×12 → 7×11 → 8×10 → 9×9 → 10×8 → 11×7 → 12×6
- SHIFT sırasında gerçek tavan kontrolü / Morph Crush
- normal levelde 1 danger row
- RUSH levelde 2 danger row
- no-legal-move, morph-crush, move-limit ve rush-timeout fail türleri
- fairness katmanı
- action-based combo
- müzik / ses / haptic / threat feedback
- local progress ve telemetry

## Web cache policy — launch candidate

`manifest.webmanifest` ve `sw.js` dosyaları repository'de tutulur fakat launch-candidate web runtime'ında eski Poma Shift service-worker registration/cache'leri `index.html` tarafından bilinçli olarak temizlenir.

Amaç:
- deploy sonrası eski gameplay/economy JS'inin cache'te takılı kalmasını önlemek
- test ve tuning sırasında herkesin aynı güncel sürümü almasını sağlamak

Bu nedenle mevcut web sürümü **offline PWA olarak vaat edilmez**.

Native Android uygulama ise web assetlerini uygulama paketine yerel olarak kopyalar; browser service-worker cache'ine bağımlı değildir.

## RUSH — kilitli son karar

RUSH için `RUSH_RULES.md` otoritedir.

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
- RUSH SHIFT öncesi üstteki 2 danger row güvenli olmalıdır
- uygulama arka plana alınırsa clock durur
- aktif RUSH sırasında harita / mağaza / can / hediye modalları kapalıdır

## Meta / ekonomi katmanı

`META_SPEC.md` içinde kilitlidir:

- 10.000+ level taşıyan difficulty-wave generator
- karakter milestone'ları
- karakter eşyası / booster sistemi
- Poma Coin ekonomisi
- 3-can sistemi
- rewarded continue: +3 hamle, level başına maksimum 5
- Level 5 sonrası interstitial placement
- 12 saat dönüş ödülü
- Level 90 Yapışkan Şeker Bulutu bossu
- her 30 levelde future boss slotu
- ölçeklenebilir level haritası

## Karakter sırası

- 1–10: atkısız Poma
- 20: Poma Dahi / Bilgisayar
- 30: Influencer Poma / Telefon
- 40: Okçu Poma / Ok
- 50: Bozkurt Poma / Kurt Pençesi
- 60: Baby Poma / Emzik Salyası
- 70: Dede Poma / Asa
- 80: Hero Poma / Sihirli Yaprak
- 90: Yapışkan Şeker Bulutu

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
- `GAME_SPEC.md` — çekirdek motor spesifikasyonu
- `RUSH_RULES.md` — güncel ve kilitli RUSH kuralları
- `META_SPEC.md` — meta progression / ekonomi / reklam / boss kilitleri
- `ART_DIRECTION.md` — güncel görsel yön
- `PRODUCT_AUDIT.md` — launch audit
- `game.js` — core motor
- `game-feel.js` — mobil feel, animasyon ve fairness
- `product-ui.js` — move budget, modal ve temel map UI
- `rush-disable.js` — eski exploitable tray timerı kalıcı olarak engeller
- `rush-mode.js` — full-level RUSH clock, giriş kartı ve danger-zone kuralı
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
