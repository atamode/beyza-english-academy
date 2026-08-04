# POMA SHIFT — GAME SPEC

**Status:** V0.1 / Prototype Specification  
**Project type:** Web-first casual puzzle game  
**Working name:** Poma Shift  
**Final name:** OPEN  

---

# 1. PURPOSE

Bu dosya Poma Shift oyununun tek ana ürün/motor spesifikasyonudur.

Burada şunlar kilitlenir:
- çekirdek oyun motoru
- oyun sınırları
- tahta dönüşüm mantığı
- parça üretim kuralları
- kazanma/kaybetme koşulları
- prototip metrikleri
- web-first teknik mimari
- Store paketleme yönü
- V0.1 kapsamı dışında bırakılan özellikler

Amaç özellik eklemek değil; çıplak motorun oyuncuyu tekrar oynatıp oynatmadığını ölçmektir.

---

# 2. PRODUCT PRINCIPLE

Ana kural:

> Oyun Poma görseli olmadan da eğlenceli olmak zorunda.

Poma ilk prototipte motoru kurtaran unsur olmayacak.
Önce gri/kare bloklarla oynanabilirlik doğrulanacak.
Poma görsel katmanı motor doğrulandıktan sonra eklenecek.

---

# 3. CORE GAME IDEA — LOCKED

Oyuncu sabit hızda düşen parça yönetmez.

Ekranın altında aynı anda **3 farklı parça** bulunur.
Oyuncu bu parçalardan birini seçer ve tahtadaki boş hücrelere sürükleyip bırakır.

Temel döngü:

1. 3 parçadan birini seç
2. tahtaya yerleştir
3. yatay bir satırı tamamen doldur
4. dolu satır temizlensin
5. belirli sayıda temizlenen satırdan sonra tahta şekil değiştirsin
6. tahta genişlerken yüksekliği azalsın
7. yeni geometriden doğan riski yönet
8. level hedefini tamamla veya kaybet

Oyunun ana farklılaştırıcısı:

> Başarı ilerledikçe oyun alanı daha geniş fakat daha alçak hale gelir.

---

# 4. BOARD MORPH SYSTEM — CORE DIFFERENTIATOR

İlk prototip dönüşüm hipotezi:

| Stage | Width | Height | Cell Area |
|---|---:|---:|---:|
| S0 | 6 | 12 | 72 |
| S1 | 7 | 11 | 77 |
| S2 | 8 | 10 | 80 |
| S3 | 9 | 9 | 81 |
| S4 | 10 | 8 | 80 |
| S5 | 11 | 7 | 77 |
| S6 | 12 | 6 | 72 |

Kural:
- her morph aşamasında genişlik +1
- yükseklik -1
- yeni kolonlar sağ/sol kenarlardan açılır
- üstten bir satır oyun alanından çıkar

Bu geometri V0.1 için test hipotezidir; metrikler kötü çıkarsa sayı dizisi değiştirilebilir.

---

# 5. MORPH WARNING — LOCKED

Tahta morph olmadan önce oyuncuya açık uyarı verilir.

Örnek:

`SHIFT 2/3`

Son satır temizlenmeden önce yok olacak üst sıra görsel olarak uyarılır.

Uyarı prensibi:
- oyuncu neden kaybettiğini anlamalı
- gizli ceza olmayacak
- morph sonucu tahmin edilebilir olacak

Morph gerçekleştiğinde kaldırılacak üst sırada herhangi bir blok varsa:

**GAME OVER — CRUSHED**

Bu, oyunun iki ana kaybetme koşulundan biridir.

---

# 6. LINE CLEAR RULE — LOCKED

V0.1'de yalnızca:

**tam dolu yatay satır** temizlenir.

Yok:
- renk eşleştirme
- 3'lü patlatma
- 4'lü patlatma
- çapraz temizleme
- dikey kolon temizleme
- özel renk kombinasyonu

Amaç, tahta geometrisinin ana mekanik olarak okunmasını sağlamaktır.

---

# 7. PIECE SYSTEM

V0.1 parça sistemi:
- parçalar grid hücrelerinden oluşur
- 1–5 hücre arası polyomino benzeri şekiller kullanılabilir
- yalnızca klasik 7 Tetris tetrominosuna bağlı kalınmaz
- parça yukarıdan düşmez
- oyuncu parçayı istediği geçerli konuma bırakır
- ilk prototipte parça döndürme YOK
- yerleştirilen parça geri alınmaz

Amaç:
- mobilde tek parmak kullanım
- hızlı karar
- düşük kontrol karmaşası
- Tetris kopyası hissinden uzaklaşmak

---

# 8. THREE-PIECE TRAY — LOCKED

Oyuncunun önünde her zaman 3 parça bulunur.

Akış:
- bir parça kullanılır
- kullanılan slot yeni parça ile doldurulur
- oyuncu üç seçenek arasından karar verir

İlk testte tüm 3'lü setin aynı anda yenilenmesi yerine slot bazlı yenileme tercih edilir.
Bu karar A/B test ile değiştirilebilir.

---

# 9. PIECE GENERATION / FAIRNESS

Tamamen saf rastgele sistem kullanılmayacak.

V0.1:
- seeded weighted bag sistemi
- küçük / orta / zor şekiller kontrollü oranlarda
- aynı zor parçanın uzun seri halinde gelmesi engellenir
- oyun oyuncuyu sürekli kurtaran gizli rescue algoritmasına sahip olmaz

Adalet kuralı:

> Oyuncu kaybettiğinde ana neden kendi board yönetimi olmalı; jeneratörün bariz şekilde imkânsız kombinasyon vermesi değil.

Generator telemetrisi tutulur:
- verilen parça seti
- mevcut boş hücre sayısı
- legal placement sayısı
- fail öncesi son 5 parça

---

# 10. NO TIMER — LOCKED FOR V0.1

V0.1'de geri sayım veya gerçek zaman baskısı YOK.

Gerilim kaynağı:
- board doluluğu
- yaklaşan morph
- azalan yükseklik
- parçaların geometrisi

Zaman baskısı ancak çekirdek motor çok kolay kalırsa ileride ayrı deney olarak test edilir.

---

# 11. GAME OVER CONDITIONS — LOCKED

Sadece iki ana kaybetme koşulu:

### A. No Legal Move
Önündeki 3 parçanın hiçbirinin tahtada geçerli konumu yoksa kaybet.

### B. Morph Crush
Tahta yüksekliği azalırken kaldırılacak üst sırada blok varsa kaybet.

V0.1'de üçüncü ölüm koşulu eklenmez.

---

# 12. LEVEL STRUCTURE

Oyun endless-only başlamaz.

Ana progression:

`Level 1 → Level 2 → Level 3 → ...`

İleride Candy Crush benzeri düğüm/yol haritası eklenebilir.
Harita gameplay değildir; yalnızca level ilerlemesinin görsel temsilidir.

V0.1 level hedefi:
- belirli sayıda morph tamamlamak
veya
- belirli sayıda satır temizlemek

Örnek prototip:

| Level | Start Board | Target |
|---|---|---|
| 1 | 6×12 | 1 morph |
| 2 | 6×12 | 2 morph |
| 3 | 6×12 | 3 morph |
| 4 | 7×11 | 3 morph |
| 5 | 6×12 | 4 morph |
| 6 | 8×10 | 3 morph |
| 7 | 6×12 | 5 morph |
| 8 | 7×11 | 5 morph |
| 9 | 6×12 | 6 morph |
| 10 | 6×12 | harder piece bag + 6 morph |

Bu tablo tuning başlangıç noktasıdır, final denge değildir.

---

# 13. TARGET LEVEL LENGTH

İlk hedef:

**45–90 saniye / level**

Ama süre oyun tarafından dayatılmaz.
Bu yalnızca gerçek oyuncu davranışında ölçülecek hedef aralıktır.

Çok kısa ise:
- oyun yüzeysel kalabilir
- reklam yoğunluğu rahatsız edici olabilir

Çok uzun ise:
- mobil tekrar oynama döngüsü zayıflayabilir

---

# 14. SCORE SYSTEM — V0.1

Skor ikinci önceliktir.

Başlangıç hesabı:
- yerleştirilen hücre: +1
- temizlenen satır: +100
- aynı hamlede 2 satır: bonus multiplier
- art arda satır temizleyen hamleler: combo multiplier

Skor level completion'dan daha önemli değildir.

---

# 15. V0.1 — STRICTLY OUT OF SCOPE

İlk motor doğrulamasında YOK:

- renk patlatma
- match-3
- bomba
- joker blok
- özel güç
- Poma güçleri
- karakter geliştirme
- Poma evi / krallığı / meta world
- coin ekonomisi
- günlük görev
- battle pass
- shop
- skin satın alma
- multiplayer
- leaderboard
- login
- cloud save
- backend zorunluluğu
- hikâye
- gerçek para satışı
- rewarded ad
- interstitial ad

Bu özellikler motor doğrulanmadan eklenmez.

---

# 16. PROTOTYPE VISUAL RULE

İlk oynanabilir sürüm:
- düz renk kareler
- basit grid
- okunaklı shift göstergesi
- basit line-clear animasyonu
- basit morph animasyonu
- Poma karakteri zorunlu değil

Öncelik:

**feel > art**

Motor eğlenceli değilse görsel üretime para/zaman harcanmaz.

---

# 17. INPUT / UX RULES

Hedef cihaz:
- telefon dikey kullanım
- tek parmak

Kural:
- parçaya bas
- sürükle
- bırak

Geçersiz bölgeye bırakılırsa parça tray'e geri döner.

Input hedefleri:
- drag hissi gecikmesiz
- hücre snap net
- geçerli/ geçersiz yer önizlemesi görünür
- parmağın kapattığı alan nedeniyle hedef hücre kaybolmamalı

---

# 18. RESPONSIVE BOARD RULE

Ana oyun portrait tasarlanır.

Hedef görünüm oranı:
- 9:16 ana referans
- daha uzun ekranlarda güvenli boşluk
- tablet için merkezlenmiş board

Minimum hedef CSS viewport:
- 320px genişlik desteği

Board hücre ölçüsü ekran genişliğine göre hesaplanır.
Game logic piksel değil grid koordinatı kullanır.

---

# 19. WEB-FIRST ARCHITECTURE — LOCKED DIRECTION

Önce web yapılacak.

Ana prensip:

> Tek oyun motoru, web + Android + iOS.

Önerilen yapı:

- **TypeScript** — game logic
- **Vite** — build/dev server
- **Phaser** — render/input/tween/audio katmanı
- **Capacitor** — Android/iOS native shell
- **PWA/service worker** — web install/offline cache

React/Vue gibi ağır uygulama framework'ü oyun motoru için zorunlu değil.
UI gerekiyorsa sade DOM overlay veya Phaser UI kullanılabilir.

---

# 20. CODE ARCHITECTURE — CRITICAL

Game logic render katmanından ayrılacak.

Önerilen yapı:

```text
games/poma-shift/
  GAME_SPEC.md
  package.json
  src/
    core/
      board.ts
      pieces.ts
      generator.ts
      rules.ts
      scoring.ts
      level.ts
      rng.ts
    render/
      game-scene.ts
      board-view.ts
      piece-view.ts
      effects.ts
    platform/
      platform.ts
      web.ts
      native.ts
      storage.ts
      ads.ts
      analytics.ts
    data/
      levels.json
      pieces.json
    main.ts
  public/
  tests/
```

`core/` mümkün olduğunca saf TypeScript olacak.
Phaser'a bağımlı olmayacak.

Böylece:
- kurallar test edilebilir
- level generator test edilebilir
- aynı motor native shell içinde çalışır
- renderer gerekirse ileride değiştirilebilir

---

# 21. WEB DEPLOYMENT

İlk gerçek sürüm:
- statik web build
- HTTPS
- mobil browser öncelikli
- PWA kurulabilir
- ilk level seti offline çalışabilir

İlk açılıştan sonra temel oyun için sürekli internet zorunlu olmamalı.

Backend V0.1 için şart değildir.

---

# 22. STORE STRATEGY — LOCKED DIRECTION

Android/iOS sürümü ayrı motor olmayacak.

Aynı web oyun kodu:

`Web Engine → Capacitor Native Shell → Android / iOS`

Ancak Store uygulaması sadece uzak web sitesini açan basit bir WebView olmayacak.

Ana oyun dosyaları uygulama bundle'ı içinde paketlenecek:
- HTML
- JavaScript
- CSS
- temel assetler
- core level data

Sunucudan ileride alınabilecek şeyler:
- JSON level config
- A/B config
- balance değerleri
- içerik metadata

Sunucudan çalıştırılabilir yeni oyun kodu indirmeye dayanılmayacak.

Neden:
- offline/stabilite
- düşük gecikme
- Store review riski azaltma
- Apple'ın yalnızca repackaged website niteliğindeki uygulamalara karşı minimum functionality yaklaşımına uyum
- Apple'ın uygulama bundle'ı dışında özellik/fonksiyon değiştiren executable code indirilmesine ilişkin kısıtlarına uyum
- Google Play'in düşük kaliteli / yalnızca webview niteliğindeki uygulamalara karşı politikalarına uyum

---

# 23. PLATFORM ADAPTER RULE

Game core doğrudan şunları çağırmayacak:
- AdMob
- localStorage
- Capacitor
- analytics SDK
- vibration
- share API

Bunun yerine `platform/` adapter kullanılacak.

Örnek:

```ts
platform.storage.save(...)
platform.analytics.track(...)
platform.ads.rewarded(...)
platform.haptics.light()
```

Web ve native implementasyonları ayrı olabilir; game logic aynı kalır.

---

# 24. SAVE SYSTEM

V0.1 web:
- localStorage veya IndexedDB

Tutulacak minimum veri:
- highestUnlockedLevel
- completedLevels
- bestScorePerLevel
- settings
- anonymousInstallId

Hesap sistemi yok.

Native paketlemede aynı storage interface Capacitor destekli kalıcı depoya geçirilebilir.

---

# 25. LEVEL DATA RULE

Level tasarımı koda hard-code edilmez.

`levels.json` örneği:

```json
{
  "id": 12,
  "startStage": 0,
  "targetMorphs": 4,
  "shiftEveryLines": 3,
  "pieceBag": "normal-01",
  "seed": 120041
}
```

Böylece yeni level eklemek engine deploy gerektirmeden veri seviyesinde yönetilebilir.

Store sürümünde uzaktan gelen config yalnızca engine'in önceden desteklediği parametreleri kullanır; yeni executable oyun kodu olarak davranmaz.

---

# 26. ANALYTICS EVENTS — REQUIRED BEFORE PUBLIC TEST

Minimum event set:

```text
game_open
session_start
session_end
level_start
level_complete
level_fail
piece_spawn
piece_place
line_clear
board_morph
no_legal_move
morph_crush
level_restart
level_exit
```

Her level sonu tutulacak:
- level id
- seed
- completion/fail
- fail reason
- duration
- move count
- line clears
- morph count
- board occupancy at fail
- remaining legal placements

Amaç yalnızca kullanıcı saymak değil; **motorun nerede kırıldığını görmek**.

---

# 27. PROTOTYPE PRODUCT METRICS

İlk dış testte reklam geliri ölçülmez.
Önce oyun motoru ölçülür.

Ana metrikler:

### Comprehension
- tutorial / first-level completion rate
- ilk geçerli hamleye kadar geçen süre
- kullanıcıların kuralları açıklama istemeden anlaması

### Engagement
- first session duration
- first session levels played
- voluntarily started next level rate
- fail sonrası retry rate

### Difficulty
- level completion rate
- fail reason distribution
- median moves per level
- median duration per level
- morph stage reached

### Friction
- invalid drag rate
- early exit rate
- restart after confusing fail
- performance / crash rate

---

# 28. INTERNAL GO / NO-GO GATES

Bunlar piyasa garantisi değil; ilk prototipi öldürmek veya geliştirmek için iç eşiklerdir.

İlk 20–50 gerçek test kullanıcısında hedef:

- Level 1 completion: **≥ 85%**
- Level 5 reach: **≥ 50%**
- İlk oturumda Level 10'a ulaşan: **≥ 25%**
- Fail sonrası tekrar deneme: **≥ 50%**
- Median first session: **≥ 7 dakika**
- “Nasıl oynanıyor?” kaynaklı erken terk: **< 10%**

Eğer bunlar ciddi şekilde altında kalırsa:
- Poma art eklenmez
- reklam sistemi eklenmez
- meta oyun eklenmez
- önce core mechanic yeniden çalışılır

---

# 29. LATER RETENTION TARGETS

Public soft-launch aşamasında ayrıca izlenecek:
- D1 retention
- D3 retention
- D7 retention
- levels/session
- sessions/day
- average session length
- level fail/retry curve
- level churn point

Reklam monetizasyonu ancak retention kabul edilebilir hale geldikten sonra açılır.

---

# 30. MONETIZATION — LATER ONLY

İlk monetizasyon hipotezleri:

### Rewarded
- morph crush sonrası bir defalık board rescue
- üç parçayı reroll
- bir parçayı kaldır

### Interstitial
- level aralarında kontrollü frekans
- her level sonrası zorunlu değil

Kural:

> Reklam oyun motorunun açıklarını kapatmak için kullanılmayacak.

Önce retention, sonra monetization.

---

# 31. PERFORMANCE TARGETS

Web/mobile hedef:
- 60 FPS hedef
- düşük cihazda oynanabilir minimum 30 FPS
- drag input hissedilir gecikme yaratmayacak
- level transition hızlı olacak
- ilk web payload mümkün olduğunca küçük tutulacak
- assetler lazy-load edilebilir

Core grid logic frame-rate bağımsız çalışacak.

---

# 32. TESTING REQUIREMENTS

Unit test:
- line clear
- valid placement
- invalid placement
- morph transform
- crush detection
- no legal move detection
- seeded generator determinism
- score calculation

Simulation test:
- 10.000+ seeded level simulation
- impossible generator spike kontrolü
- piece distribution kontrolü
- board state corruption kontrolü

Browser test:
- Android Chrome
- iOS Safari
- desktop Chrome

Native shell öncesi web motor stabil olmak zorunda.

---

# 33. FIRST IMPLEMENTATION ORDER

## Phase A — Greybox
1. grid
2. three-piece tray
3. drag/drop
4. placement validation
5. horizontal line clear
6. shift meter
7. board morph
8. morph crush
9. no legal move
10. basic level completion

## Phase B — Feel
1. snap animation
2. line clear effect
3. morph animation
4. haptic abstraction
5. sound hooks

## Phase C — Data
1. seeded levels
2. analytics events
3. save system
4. first 20-level test set

## Phase D — Public Web Test
1. responsive mobile UI
2. PWA
3. deploy
4. real-user metrics

## Phase E — Brand
Only if metrics pass:
- Poma visual layer
- final palette
- audio identity
- map/progression UI

## Phase F — Store
Only if web retention is promising:
- Capacitor Android
- Capacitor iOS
- native ads adapter
- store compliance pass

---

# 34. DECISIONS — LOCKED NOW

- Web-first geliştirilecek
- Tek engine web + Android + iOS kullanılacak
- Store sürümünde oyun assetleri native bundle içinde bulunacak
- İlk motor 3 parçadan seçip grid'e yerleştirme olacak
- Parçalar yukarıdan düşmeyecek
- Satır tamamlanınca yatay temizlenecek
- Renk eşleştirme V0.1'de olmayacak
- Tahta ilerledikçe genişleyip alçalacak
- Morph önceden açıkça gösterilecek
- Morph sırasında üst sırada blok varsa kaybedilecek
- 3 parçadan hiçbiri sığmıyorsa kaybedilecek
- Timer V0.1'de olmayacak
- İlk prototip gri-kutu olacak
- Poma görsel katmanı motor doğrulanmadan ana geliştirme önceliği olmayacak
- Login/backend/meta economy V0.1'de olmayacak

---

# 35. OPEN / TESTABLE QUESTIONS

Bunlar henüz locked değildir:
- oyun final adı
- shift için gereken satır sayısı: 2 / 3 / 4 ?
- piece tray slot bazlı mı toplu mu yenilenmeli?
- board morph dizisi tam olarak hangi oranlarda olmalı?
- yeni kolon yalnız sağdan mı, iki yana mı açılmalı?
- level hedefi morph sayısı mı line count mu daha iyi?
- parçalar ileride döndürülebilir mi?
- map progression ne zaman eklenmeli?
- Poma oyun ekranında ne kadar görünür olmalı?
- rewarded ad hangi kurtarma eyleminde en doğal çalışır?

Bu sorular kullanıcı davranışıyla test edilir; tahminle kilitlenmez.

---

# 36. KILL RULE

Bu proje şu nedenle büyütülmez:

> “Zaten başladık.”

Greybox testinde motor tekrar oynatma isteği üretmiyorsa proje durdurulur veya core mechanic değiştirilir.

Yeni özellik ekleyerek zayıf core mechanic gizlenmez.

---

# 37. STORE / POLICY REFERENCES

Teknik yön belirlenirken kontrol edilmesi gereken güncel kaynaklar:
- Apple App Review Guidelines — 4.2 Minimum Functionality
- Apple App Review Guidelines — 2.5.2 app bundle / downloadable executable code
- Google Play Developer Policy — Functionality, Content and User Experience
- Google Play Developer Policy — Webviews / repetitive content
- Capacitor official documentation

Store gönderimi yapılacağı tarihte politikalar tekrar kontrol edilir.

---

# 38. CURRENT NEXT ACTION

Bir sonraki gerçek iş:

> V0.1 greybox web motorunu kur.

İlk başarı kriteri:
- görsel kalite değil
- Poma karakteri değil
- Store build değil

**Oyuncunun kendi isteğiyle “bir level daha” demesi.**
