# POMA SHIFT — GAME SPEC

**Status:** CORE LOCKED / LAUNCH TRACK  
**Project type:** Web-first casual puzzle  
**Working name:** Poma Shift  
**Final name:** OPEN

**Authority note:** Genel yaşayan durum için `POMA_SHIFT_MASTER_CONTEXT.md`; RUSH için `RUSH_RULES.md`; ekonomi/karakter/reklam/boss için `META_SPEC.md` üst otoritedir. Bu dosya core puzzle motorunu tanımlar.

---

# 1. PURPOSE

Bu dosya Poma Shift core oyun/motor spesifikasyonudur.

Ana hedef:

> Oyuncunun kendi isteğiyle “bir level daha” demesini sağlayan sade bir core loop doğrulamak ve bunu uzun ömürlü progression/meta katmanının altında stabil tutmak.

Poma görseli, reklam ve meta özellikler kötü bir core motoru kurtarmak için kullanılmaz.

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

Normal levelde SHIFT öncesi gerçek üst 1 danger row kontrol edilir. RUSH'ta bu kontrol 2 danger row'dur; fiziksel board yine yalnız 1 satır kısalır.

Danger bölgesinde temizlenmeyen blok varsa:

**GAME OVER — MORPH CRUSH**

SHIFT oyunun ana kimliğidir ve görsel olarak saklanmaz.

Tehdit sistemi:
- normal durumda sakin board
- 1/3: amber hazırlık + hafif feedback
- 2/3: kırmızı alarm + pulse + daha güçlü feedback
- SHIFT: kesme/bıçak hissi veren ses + güçlü feedback
- risk satırı açıkça görünür; dış ghost/wireframe board kullanılmaz

Amaç oyuncuyu bilgilendirmek ama aynı zamanda baskı altında hata yapmaya açık hale getirmektir.

---

# 4. LINE CLEAR — LOCKED

Yalnızca tamamen dolu **yatay satır** temizlenir.

YOK:
- match-3
- aynı renk patlatma
- dikey kolon clear
- çapraz clear

Renk core kurala etki etmez; görsel ayrımdır.

---

# 5. PIECE SYSTEM — LOCKED

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
- beklemek yeni batch üretmez

Bu yapı “bu üç parçayı nasıl sığdırırım?” mikro problemini üretir.

---

# 7. RUSH LEVELS — LOCKED CURRENT RULE

RUSH için `RUSH_RULES.md` tek otoritedir.

Eski 7/6/5 saniyelik tray timer ve kullanılmamış parçaları yakma kuralı **kalıcı olarak iptal edilmiştir**.

Güncel özet:
- Level 1–10 timer yok
- ilk RUSH Level 11
- sonra 15, 20, 25, 30...; boss slotları hariç
- bütün RUSH level süreli
- kural kartı gösterilir
- `BAŞLA` denmeden clock çalışmaz
- Level 11: 60 sn / 2 SHIFT
- Level 15–24: 50 sn / 3 SHIFT
- Level 25–49: 45 sn / 3 SHIFT
- Level 50+: 40 sn / 4 SHIFT
- RUSH'ta 2 danger row
- süre biter ve hedef tamamlanmamışsa `RUSH TIMEOUT`
- uygulama arka plana alınırsa clock durur

---

# 8. MOVE BUDGET — ACTIVE TUNING RULE

Her levelin maksimum hamle bütçesi vardır.
Yerleştirilen her parça = 1 hamle.

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

Level 11+ başlangıç formülü core tuning tabanıdır:

`18 + ((targetShifts - 1) × 14) + (startStage × 2)`

Meta generator yüksek levellerde kendi difficulty-wave konfigürasyonunu uygular.

Hamle limiti dolduğunda hedef tamamlanmamışsa:

**GAME OVER — MOVE LIMIT**

Rewarded continue meta katmanında aynı attempt'e +3 efektif hamle ekleyebilir; level başına üst sınır `META_SPEC.md` içindedir.

---

# 9. FAIL CONDITIONS — LOCKED

### A. NO LEGAL MOVE
Tray'de kalan hiçbir parça yerleşemiyor.

### B. MORPH CRUSH
SHIFT öncesi geçerli danger bölgesinde temizlenmeyen blok var.

### C. MOVE LIMIT
Level hamle bütçesi tükendi.

### D. RUSH TIMEOUT
Yalnız RUSH levelde full-level süre bitti ve hedef tamamlanmadı.

Boss'a özgü fail reason'lar meta/boss katmanında ayrıca üretilebilir.

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

İlk 10 level motor öğretim/tuning setidir ve gerçek oyuncu verisiyle tune edilir.

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

### Music
- güncel yön: haritada background music; gameplay'de SFX öncelikli

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
- aktif level yanında Poma / karakter progression sunumu
- RUSH level ⚡ ile işaretli
- boss node ayrı görsel dil kullanır
- milestone karakter hedefleri haritada gösterilebilir
- Poma haritada ilerler; board içine girmez
- yüksek levelde yalnız oyuncu çevresindeki node'lar render edilir

---

# 15. POMA BRAND INTEGRATION — LOCKED

Temel oran:

> **%80 bağımsız casual oyun / %20 Poma marka kimliği**

Poma'nın görevi oyunu taşımak değil, tutan oyuncuyu Pomante markasına bağlamaktır.

Poma KULLANILIR:
- tutorial rehberi
- level haritası
- character milestone / unlock
- level complete reaksiyonu
- fail ekranında hafif reaksiyon
- loading/menu/store shell
- meta booster sistemi

Poma KULLANILMAZ:
- grid hücrelerinin dekorasyonu olarak
- blokların üstünde sürekli artwork olarak
- line clear kuralını değiştirmek için
- SHIFT core mekaniğini değiştirmek için

Karakter güçleri opsiyonel meta booster'dır; core puzzle kuralının yerine geçmez.

---

# 16. VISUAL DIRECTION — LOCKED TARGET

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

Detay için `ART_DIRECTION.md`.

---

# 17. PROGRESS / SCORE

Progress localStorage:
- son level
- en yüksek açılan level

Meta katmanı ayrıca Coin, can, inventory ve unlock state tutar.

Score çalışabilir ancak ana retention sistemi değildir.
HUD'da skor yerine hamle bütçesi / hedef / risk önceliklidir.

---

# 18. TELEMETRY

Core/local eventler arasında:
- `session_start`
- `level_start`
- `tray_dealt`
- `piece_placed`
- `invalid_drop`
- `line_clear`
- `shift`
- `fairness_adjustment`
- `level_fail`
- `level_restart`
- `level_complete`
- `line_combo`

RUSH:
- `rush_intro_shown`
- `rush_start`
- `rush_timeout`
- `rush_complete`
- `morph_crush_danger_zone`

Meta ayrıca ad / Coin / booster / gift / boss eventleri üretir.

Core fail reason:
- `no_legal_move`
- `morph_crush`
- `move_limit`
- `rush_timeout`

Ölçülecek:
- moves
- invalid drops
- level duration
- lines cleared
- shifts
- fail reason
- fairness adjustment
- RUSH reach / completion / timeout / remaining time

Production merkezi analytics provider launch blocker'dır; local log tek başına yeterli değildir.

---

# 19. GO / NO-GO

İlk 20–50 oyuncuda test sinyalleri:

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
- kalan süre
- RUSH sonrası devam oranı

RUSH completion çok düşükse önce süre/target tuning yapılır; mekanik veri olmadan yeniden tasarlanmaz.

---

# 20. CURRENT LAUNCH OUT OF SCOPE

Launch öncesi yeni sistem olarak EKLENMEZ:
- match-3 / renk patlatma core değişikliği
- yeni joker sınıfları
- günlük görev
- battle pass
- multiplayer
- leaderboard
- login/account sistemi
- IAP mağazası
- Level 90 dışındaki yeni özel boss karakterleri
- kapsamı büyüten yeni meta world mekanikleri

Mevcut ve korunacak meta sistemleri `META_SPEC.md` içindedir:
- Coin
- shop/booster
- character progression
- rewarded/interstitial hook
- lives
- return gift
- Level 90 boss

---

# 21. WEB-FIRST ARCHITECTURE — LOCKED DIRECTION

Web motoru:
- HTML
- CSS
- vanilla JavaScript
- Canvas 2D
- Pointer Events
- localStorage
- PWA manifest/service-worker dosyaları

Store yönü:

`Web assets → native shell → Android / iOS`

Store uygulaması yalnız uzak site açan boş WebView olmayacak.
Ana HTML/JS/CSS/assets uygulama bundle'ı içinde bulunacak.

**Release blocker:** Android/Capacitor kaynak konumu ve gerçek native ad provider güncel main release hattında ayrıca doğrulanmalıdır.

**Known discrepancy:** mevcut web `index.html` açılışta Poma Shift service-worker registration/cache'lerini temizliyor; offline/PWA davranışı release öncesi tek karara bağlanmalıdır.

---

# 22. CURRENT FILE STRUCTURE — KEY FILES

```text
games/poma-shift/
  POMA_SHIFT_MASTER_CONTEXT.md
  GAME_SPEC.md
  RUSH_RULES.md
  META_SPEC.md
  ART_DIRECTION.md
  PRODUCT_AUDIT.md
  TEST_PLAN.md
  META_TEST_PLAN.md
  README.md
  index.html
  game.js
  game-feel.js
  product-ui.js
  rush-disable.js
  rush-mode.js
  combo-system.js
  meta-system.js
  analytics-bridge.js
  audio-mix.js
  boss-ui.js
  manifest.webmanifest
  sw.js
  ...visual / UI support files
```

---

# 23. FINAL CORE RULE

Core başarı kriteri:

**Oyuncunun SHIFT baskısını anlayıp adil bulması ve kendi isteğiyle bir sonraki levele geçmesi.**

Launch başarı kriteri ise buna ek olarak:
- regression testlerinin geçmesi
- premium görsel kalite
- gerçek analytics
- gerçek native reklam entegrasyonu
- ölçülen retention / restart / funnel sinyalleri

Yeni feature sayısı başarı kriteri değildir.
