# POMA SHIFT — GAME SPEC

**Status:** V0.3 / PLAYABLE PROTOTYPE  
**Project type:** Web-first casual puzzle  
**Working name:** Poma Shift  
**Final name:** OPEN

---

# 1. PURPOSE

Bu dosya Poma Shift için yaşayan tek ana oyun/motor spesifikasyonudur.

Ana hedef:

> Oyuncunun kendi isteğiyle “bir level daha” demesini sağlayan sade bir core loop doğrulamak.

Poma görseli, reklam ve meta özellikler motoru kurtarmak için kullanılmaz.

---

# 2. CORE LOOP — LOCKED

Oyuncuya üç parçalık bir set verilir.

Akış:
1. 3 parçadan birini seç
2. sürükleyip grid'e yerleştir
3. yatay satırı tamamen doldur
4. satır temizlensin
5. 3 temizlenen satırdan sonra SHIFT olsun
6. tahta +1 genişlesin, -1 alçalsın
7. tavan ve hamle bütçesini yönet
8. hedef SHIFT sayısına ulaş veya kaybet

Ana farklılaştırıcı:

> Başarı arttıkça oyun alanı genişler fakat tavan aşağı iner.

---

# 3. BOARD MORPH — LOCKED

| Stage | Board | Area |
|---|---:|---:|
| S0 | 6×12 | 72 |
| S1 | 7×11 | 77 |
| S2 | 8×10 | 80 |
| S3 | 9×9 | 81 |
| S4 | 10×8 | 80 |
| S5 | 11×7 | 77 |
| S6 | 12×6 | 72 |

SHIFT olduğunda:
- üstten 1 satır kaldırılır
- genişliğe 1 kolon eklenir
- yeni kolon sağ/sol kenara dağıtılır
- kalan board içeriği korunur

Kaldırılacak üst satır doluysa:

**GAME OVER — MORPH CRUSH**

SHIFT öncesinde tehlikeli üst sıra kırmızı uyarılır.

---

# 4. LINE CLEAR — LOCKED

Yalnızca tamamen dolu **yatay satır** temizlenir.

YOK:
- match-3
- aynı renk patlatma
- dikey kolon clear
- çapraz clear

Renk şu anda yalnızca görsel ayrımdır.

---

# 5. PIECE SYSTEM — LOCKED FOR V0.3

- 1–4 hücreli basit polyomino şekilleri
- yalnızca klasik Tetris tetrominolarına bağlı değil
- yukarıdan düşme yok
- döndürme yok
- yerleştirilen parça geri alınmaz
- geçersiz drop tray'e geri döner
- drag sırasında valid/invalid preview görünür
- telefonda parça parmağın yaklaşık 62 px üstünde taşınır

Amaç: tek parmak, düşük öğrenme maliyeti.

---

# 6. THREE-PIECE BATCH — LOCKED

Oyuncuya 3 parçalık batch verilir.

Kural:
- üç parçayı istediği sırayla kullanır
- kullanılan slot boş kalır
- üçü tamamlanınca yeni batch gelir

Bu yapı “bu üç parçayı nasıl sığdırırım?” mikro problemini üretir.

---

# 7. SERIES TIMER — ACTIVE TEST RULE

V0.3 ile üçlü batch'e zaman baskısı eklendi.

### Level 1
- timer yok
- öğrenme leveli

### Level 2
- ilk parça yerleştirildikten sonra **7 saniye**

### Level 3+
- ilk parça yerleştirildikten sonra kalan batch için **5 saniye**

Timer batch ekrana geldiği anda başlamaz.
Oyuncu önce parçaları inceleyebilir.
İlk yerleştirmeden sonra süre başlar.

Süre dolarsa:
- kullanılmamış parçalar yanar
- her kullanılmamış parça **+1 hamle cezası** sayılır
- yeni üçlü batch gelir

Timer tek başına anında game-over üretmez.
Hamle bütçesini tüketerek baskı yaratır.

Bu süreler tuning değeridir ve test verisine göre değişebilir.

---

# 8. MOVE BUDGET — ACTIVE TEST RULE

Her levelin maksimum hamle bütçesi vardır.
Yerleştirilen her parça = 1 hamle.
Timer nedeniyle yanan her parça = 1 ceza hamlesi.

İlk 10 level başlangıç limitleri:

| Level | Max Move |
|---|---:|
| 1 | 18 |
| 2 | 32 |
| 3 | 46 |
| 4 | 48 |
| 5 | 60 |
| 6 | 50 |
| 7 | 74 |
| 8 | 76 |
| 9 | 88 |
| 10 | 88 |

Level 11+ başlangıç formülü:

`18 + ((targetShifts - 1) × 14) + (startStage × 2)`

Bu değerler ekonomik veya nihai difficulty kararı değildir; playtest tuning başlangıcıdır.

Hamle limiti dolduğunda hedef tamamlanmamışsa:

**GAME OVER — MOVE LIMIT**

---

# 9. FAIL CONDITIONS — LOCKED FOR V0.3

Üç fail tipi vardır:

### A. NO LEGAL MOVE
Tray'de kalan hiçbir parça yerleşemiyor.

### B. MORPH CRUSH
SHIFT sırasında kaldırılacak üst sırada blok var.

### C. MOVE LIMIT
Level hamle bütçesi tükendi.

Timer timeout doğrudan ölüm değildir; move budget cezasıdır.

---

# 10. PIECE GENERATION / FAIRNESS

Jeneratör tamamen eşit random değildir.

- ilk leveller kolay shape havuzu
- level arttıkça zor shape ihtimali artar
- aynı shape'in sürekli tekrarı azaltılır
- bariz şekilde ölü üçlü set verilmesi minimum fairness katmanıyla engellenir

`fairness_adjustment` nadir çalışmalıdır.

Alarm:

> Batch'lerin %10+'unda fairness adjustment gerekiyorsa generator kötü ayarlanmıştır.

Oyuncuyu sürekli kurtaran gizli rescue sistemi kurulmaz.

---

# 11. FIRST 10 LEVELS

| Level | Start | Target SHIFT | Timer |
|---|---|---:|---:|
| 1 | 6×12 | 1 | yok |
| 2 | 6×12 | 2 | 7 sn |
| 3 | 6×12 | 3 | 5 sn |
| 4 | 7×11 | 3 | 5 sn |
| 5 | 6×12 | 4 | 5 sn |
| 6 | 8×10 | 3 | 5 sn |
| 7 | 6×12 | 5 | 5 sn |
| 8 | 7×11 | 5 | 5 sn |
| 9 | 6×12 | 6 | 5 sn |
| 10 | 6×12 | 6 | 5 sn + daha zor bag |

İlk 10 level final içerik değil, tuning setidir.

---

# 12. SOUND / HAPTIC LANGUAGE — ACTIVE

Ses feedback'i shape'e göre ayrılır.

### Placement
- tek kare: çok kısa, daha yüksek ve keskin “cik”
- 3/4 uzun çubuk: daha keskin çift “çıt”
- kare blok: daha tok mevcut yerleşme sesi
- diğer şekiller: orta frekans placement sesi

### Line clear
- çift yükselen kısa efekt
- belirgin çift titreşim

### SHIFT
- sentetik **bıçak/kesme** benzeri noise sweep
- kısa düşük frekans vurgu
- güçlü titreşim paterni

### Fail / complete
- ayrı ses ve titreşim paterni

Ses kapatma düğmesi zorunludur.

---

# 13. TUTORIAL UX — LOCKED

Level 1 açıklamaları oyun alanının üstüne bindirilmez.

Tutorial:
- toolbar ile canvas arasında ayrı bilgi şeridinde görünür
- board hücrelerini kapatmaz
- tray parçalarını kapatmaz

Akış:
1. parçayı tut
2. satırı doldur
3. SHIFT mantığını gör

Tutorial tamamlandıktan sonra localStorage ile tekrar gösterilmez.

---

# 14. LEVEL MAP — LOCKED DIRECTION

Level haritası gameplay değildir; progression göstergesidir.

Görsel yön:

> **Level 1 aşağıda, sonraki leveller yukarı doğru çıkar.**

Harita Candy Crush benzeri kıvrımlı node path mantığında olabilir.
Oyuncu ilerledikçe görsel olarak yukarı tırmanır.

---

# 15. PROGRESS / SCORE

Progress localStorage:
- son level
- en yüksek açılan level

Score çalışır ancak ana retention sistemi değildir.
HUD'da skor yerine **hamle bütçesi** önceliklidir.

---

# 16. TELEMETRY

Mevcut local eventler:
- `session_start`
- `level_start`
- `tray_dealt`
- `piece_placed`
- `invalid_drop`
- `line_clear`
- `shift`
- `fairness_adjustment`
- `tray_timeout`
- `level_fail`
- `level_restart`
- `level_complete`

Fail reason:
- `no_legal_move`
- `morph_crush`
- `move_limit`

Ölçülecek:
- moves
- timeout penalty
- invalid drops
- level duration
- lines cleared
- shifts
- fail nedeni

---

# 17. GO / NO-GO

İlk 20–50 oyuncuda iç test sinyalleri:

- Level 1 completion ≥ %70
- Level 1 bitirenlerin Level 2'ye geçişi ≥ %70
- Level 3'e ulaşma ≥ %50
- fail sonrası restart ≥ %40
- invalid drop ilk level sonrası düşmeli
- fairness adjustment < %10 batch

Özellikle ayrıca ölçülecek:
- 5 saniye timer eğlenceli baskı mı, sinir bozucu baskı mı?
- timeout oranı hangi levelde yükseliyor?
- move limit nedeniyle fail oranı aşırı mı?

Motor oyuncuyu istemeden zorlamaya başlarsa timer/move değerleri değiştirilir; core mechanic gereksiz özelliklerle maskelenmez.

---

# 18. STRICT OUT OF SCOPE

Motor doğrulanmadan YOK:
- match-3
- renk patlatma
- bomba/joker/power-up
- Poma güçleri
- karakter geliştirme
- Poma Kingdom meta progression
- coin
- günlük görev
- battle pass
- shop
- multiplayer
- leaderboard
- login
- reklam
- IAP

---

# 19. WEB-FIRST ARCHITECTURE — LOCKED

İlk prototip:
- HTML
- CSS
- vanilla JavaScript
- Canvas 2D
- Pointer Events
- localStorage
- service worker
- PWA manifest

Amaç motoru en ucuz/hızlı şekilde doğrulamaktır.

Store yönü:

`Web assets → Capacitor native shell → Android / iOS`

Store uygulaması yalnız uzak site açan boş WebView olmayacak.
Ana HTML/JS/CSS/assets uygulama bundle'ı içinde bulunacak.

---

# 20. CURRENT FILE STRUCTURE

```text
games/poma-shift/
  GAME_SPEC.md
  TEST_PLAN.md
  README.md
  index.html
  styles.css
  game.js
  game-feel.js
  product-ui.js
  manifest.webmanifest
  sw.js
  icon.svg
```

---

# 21. FINAL V0.3 RULE

Başarı kriteri:

- güzel Poma artwork değil
- Store build değil
- reklam geliri değil
- özellik sayısı değil

**Oyuncunun baskıya rağmen oyunu adil bulması ve kendi isteğiyle bir sonraki levele geçmesi.**