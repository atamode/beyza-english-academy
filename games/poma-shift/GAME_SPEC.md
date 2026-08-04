# POMA SHIFT — GAME SPEC

**Status:** V0.4 / PLAYABLE PROTOTYPE  
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

SHIFT oyunun ana kimliğidir ve görsel olarak saklanmaz.

Tehdit sistemi:
- 0/3: silinecek üst satır sürekli görünür, sonraki board hayalet çerçevesi gösterilir
- 1/3: sarı uyarı + hafif ses/titreşim
- 2/3: kırmızı alarm + pulse + alarm sesi + güçlü titreşim
- SHIFT: kesme/bıçak hissi veren ses + güçlü feedback

Amaç oyuncuyu bilgilendirmek ama aynı zamanda baskı altında hata yapmaya açık hale getirmektir.

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

# 5. PIECE SYSTEM — LOCKED FOR V0.4

- 1–4 hücreli basit polyomino şekilleri
- yalnızca klasik Tetris tetrominolarına bağlı değil
- yukarıdan düşme yok
- döndürme yok
- yerleştirilen parça geri alınmaz
- geçersiz drop tray'e geri döner
- drag sırasında valid/invalid preview görünür
- telefonda parça parmağın yaklaşık 62 px üstünde taşınır
- mobilde tray board alanının dışında ayrı alt bölgede kalır

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

# 7. SERIES TIMER / RUSH LEVELS — LOCKED FOR V0.4

Timer ana mekanik değildir.
Timer yalnız özel **RUSH** levellerinde tempo değiştirici olarak kullanılır.

### Level 1–10
- timer YOK
- oyuncu önce board + SHIFT + move budget dilini öğrenir

### İlk RUSH
- Level 11

### Sonraki RUSH levelleri
- 15, 20, 25, 30... gibi her 5 levelde bir
- Level 11 özel ilk tanıtım RUSH levelidir

### RUSH süreleri
- Level 11–24: **7 saniye**
- Level 25–49: **6 saniye**
- Level 50+: **5 saniye**

Timer batch ekrana geldiği anda başlamaz.
Oyuncu önce üç parçayı inceleyebilir.
İlk parça yerleştirildikten sonra süre başlar.

Süre dolarsa:
- kullanılmamış parçalar yanar
- her kullanılmamış parça +1 hamle cezası sayılır
- yeni batch gelir

Timer tek başına anında game-over üretmez.
Hamle bütçesini tüketerek baskı yaratır.

Haritada RUSH node'ları ⚡ ile ayrılır.
Normal levellerde timer göstergesi **SERBEST** olarak görünür.

---

# 8. MOVE BUDGET — ACTIVE TEST RULE

Her levelin maksimum hamle bütçesi vardır.
Yerleştirilen her parça = 1 hamle.
RUSH timeout nedeniyle yanan her parça = 1 ceza hamlesi.

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

Bu değerler tuning başlangıcıdır.

Hamle limiti dolduğunda hedef tamamlanmamışsa:

**GAME OVER — MOVE LIMIT**

---

# 9. FAIL CONDITIONS — LOCKED

Üç fail tipi vardır:

### A. NO LEGAL MOVE
Tray'de kalan hiçbir parça yerleşemiyor.

### B. MORPH CRUSH
SHIFT sırasında kaldırılacak üst sırada blok var.

### C. MOVE LIMIT
Level hamle bütçesi tükendi.

RUSH timeout doğrudan ölüm değildir; move budget cezasıdır.

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

# 11. FIRST 10 LEVELS — LEARNING CURVE

| Level | Start | Target SHIFT | Timer |
|---|---|---:|---:|
| 1 | 6×12 | 1 | yok |
| 2 | 6×12 | 2 | yok |
| 3 | 6×12 | 3 | yok |
| 4 | 7×11 | 3 | yok |
| 5 | 6×12 | 4 | yok |
| 6 | 8×10 | 3 | yok |
| 7 | 6×12 | 5 | yok |
| 8 | 7×11 | 5 | yok |
| 9 | 6×12 | 6 | yok |
| 10 | 6×12 | 6 | yok + daha zor bag |

İlk 10 level motor öğretim/tuning setidir.

---

# 12. SOUND / HAPTIC LANGUAGE — ACTIVE

Ses feedback'i shape'e göre ayrılır.

### Placement
- tek kare: çok kısa, yüksek ve keskin “cik”
- 3/4 uzun çubuk: daha keskin çift “çıt”
- kare blok: daha tok placement sesi
- diğer şekiller: orta frekans placement sesi

### Line clear
- çift yükselen kısa efekt
- belirgin çift titreşim

### SHIFT
- sentetik bıçak/kesme benzeri noise sweep
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
- küçük Poma rehber görseli kullanılabilir

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

- kıvrımlı node path
- aktif level yanında küçük Poma rehberi
- RUSH level ⚡ ile işaretli
- Poma haritada ilerler; board içine girmez

---

# 15. POMA BRAND INTEGRATION — LOCKED

Temel oran:

> **%80 bağımsız casual oyun / %20 Poma marka kimliği**

Poma'nın görevi oyunu taşımak değil, tutan oyuncuyu Pomante markasına bağlamaktır.

Poma KULLANILIR:
- tutorial rehberi
- level haritasında aktif node
- level complete reaksiyonu
- fail ekranında hafif reaksiyon
- ileride loading/menu/store icon gibi marka yüzleri

Poma KULLANILMAZ:
- grid hücreleri
- blokların üstü
- line clear kuralı
- SHIFT mekaniği
- zorunlu gameplay power'ı

Amaç oyunun geniş casual kitleye bağımsız görünmesini korumaktır.

---

# 16. VISUAL DIRECTION — LOCKED TARGET

Mevcut prototip çizgi/flat görünümü final değildir.

Hedef:
- premium casual
- soft plastic / hafif hacimli bloklar
- yumuşak köşe
- tok dokunma hissi
- koyu ve temiz board
- az yazı, güçlü görsel feedback
- alarm satırında glow/pulse/tehlike bandı

Kaçınılacak:
- aşırı çocuk çizgi-film görünümü
- fazla teknik çizgi/wireframe hissi
- çok fazla açıklama metni
- Poma'yı board'u domine edecek kadar büyütmek

---

# 17. PROGRESS / SCORE

Progress localStorage:
- son level
- en yüksek açılan level

Score çalışır ancak ana retention sistemi değildir.
HUD'da skor yerine hamle bütçesi önceliklidir.

---

# 18. TELEMETRY

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
- RUSH timeout penalty
- invalid drops
- level duration
- lines cleared
- shifts
- fail nedeni

---

# 19. GO / NO-GO

İlk 20–50 oyuncuda iç test sinyalleri:

- Level 1 completion ≥ %70
- Level 1 bitirenlerin Level 2'ye geçişi ≥ %70
- Level 3'e ulaşma ≥ %50
- fail sonrası restart ≥ %40
- invalid drop ilk level sonrası düşmeli
- fairness adjustment < %10 batch

RUSH ayrı ölçülür:
- Level 11'e ulaşma oranı
- ilk RUSH completion
- timeout oranı
- RUSH sonrası devam oranı

Timer yüzünden oyuncu bırakıyorsa timer core mechanic değildir; azaltılır veya seyrekleştirilir.

---

# 20. STRICT OUT OF SCOPE

Motor doğrulanmadan YOK:
- match-3
- renk patlatma
- bomba/joker/power-up
- Poma gameplay güçleri
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

# 21. WEB-FIRST ARCHITECTURE — LOCKED

İlk prototip:
- HTML
- CSS
- vanilla JavaScript
- Canvas 2D
- Pointer Events
- localStorage
- service worker
- PWA manifest

Store yönü:

`Web assets → Capacitor native shell → Android / iOS`

Store uygulaması yalnız uzak site açan boş WebView olmayacak.
Ana HTML/JS/CSS/assets uygulama bundle'ı içinde bulunacak.

---

# 22. CURRENT FILE STRUCTURE

```text
games/poma-shift/
  GAME_SPEC.md
  TEST_PLAN.md
  README.md
  index.html
  styles.css
  threat.css
  poma-brand.css
  game.js
  mobile-layout.js
  game-feel.js
  product-ui.js
  threat-system.js
  poma-brand.js
  manifest.webmanifest
  sw.js
  icon.svg
```

---

# 23. FINAL V0.4 RULE

Başarı kriteri:

- Poma artwork kalitesi değil
- Store build değil
- reklam geliri değil
- özellik sayısı değil

**Oyuncunun SHIFT baskısını anlayıp adil bulması ve kendi isteğiyle bir sonraki levele geçmesi.**