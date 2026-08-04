# Poma Shift — Web Prototype

Bu klasör Poma Shift'in ilk oynanabilir web prototipidir.

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

## V0.1.2 çekirdeği

- 3 parçalık batch sistemi
- parçayı sürükle/bırak
- parça telefonda parmağın yaklaşık 62 px üstünde gösterilir
- tam yatay satırı temizle
- her 3 satırda SHIFT
- tahta genişler, yükseklik azalır
- SHIFT sırasında üst satır doluysa kayıp
- hiçbir mevcut parça sığmıyorsa kayıp
- hedef SHIFT sayısına ulaşınca level tamamlanır
- ilk leveller daha sınırlı şekil havuzuyla öğretici başlar
- tamamen oynanamaz yeni tray verilmesini azaltan minimum fairness katmanı
- line clear / SHIFT / invalid-drop feedback animasyonları
- desteklenen cihazlarda kısa haptic feedback
- ilerleme localStorage üzerinde tutulur
- test eventleri localStorage üzerinde kaydedilir
- PWA/offline cache

## Ana dosyalar

- `GAME_SPEC.md` — motor kararları ve sınırlar
- `game.js` — çekirdek prototip motoru
- `game-feel.js` — mobil feel, animasyon, erken level tuning ve fairness katmanı
- `TEST_PLAN.md` — oyuncu test planı ve GO / NO-GO eşikleri
- `styles.css` — responsive görünüm ve feedback animasyonları
- `sw.js` — PWA offline cache

## Bilinçli olarak yok

- Poma görsel katmanı
- renk eşleştirme
- power-up
- coin
- reklam
- hikâye
- hesap sistemi
- harita / meta world

Önce çıplak motorun oynanabilirliği doğrulanır.

## İlk ürün hedefi

Başarı ölçüsü Store'a çıkmak değildir.

Başarı ölçüsü:

> Oyuncunun kendi isteğiyle bir sonraki levele geçmesi veya kaybedince tekrar denemesi.
