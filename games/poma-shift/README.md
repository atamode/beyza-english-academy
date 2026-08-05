# Poma Shift — Web Prototype

Bu klasör Poma Shift'in oynanabilir web/PWA prototipidir.

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
- SHIFT sırasında tavan çarpışması = morph crush
- no-legal-move ve move-limit fail türleri
- RUSH levelleri
- fairness katmanı
- ses / haptic / threat feedback
- local progress ve telemetry
- PWA/offline cache

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

## Ana dosyalar

- `GAME_SPEC.md` — çekirdek motor spesifikasyonu
- `META_SPEC.md` — meta progression / ekonomi / reklam / boss kilitleri
- `game.js` — core motor
- `game-feel.js` — mobil feel, animasyon ve fairness
- `product-ui.js` — move budget, RUSH, modal ve temel map UI
- `meta-system.js` — Coin, can, booster, boss, reklam hook'ları, scalable map
- `meta-system.css` — meta UI
- `TEST_PLAN.md` — core oyuncu test planı
- `sw.js` — PWA cache

## Reklam entegrasyonu

Web prototipte test adapterı vardır. Store/native build'de gerçek provider şu kontratı sağlamalıdır:

```js
window.PomaShiftAds = {
  rewarded: async (placement) => true,
  interstitial: async (placement) => true,
};
```

Bu sayede oyun ekonomisi reklam SDK'sından bağımsız test edilebilir.
