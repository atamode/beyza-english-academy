# POMA SHIFT — GAME SPEC

**Status:** V0.2 / PLAYABLE PROTOTYPE  
**Project type:** Web-first casual puzzle  
**Working name:** Poma Shift  
**Final name:** OPEN

---

# 1. PURPOSE

Bu dosya Poma Shift için yaşayan tek ana oyun/motor spesifikasyonudur.

Burada kilitlenenler:
- core loop
- oyun sınırları
- board morph sistemi
- parça ve tray sistemi
- level kuralları
- win/fail şartları
- prototip metrikleri
- web-first mimari
- Store paketleme yönü

Ana amaç özellik eklemek değil, çıplak motorun oyuncuda **“bir level daha”** isteği üretip üretmediğini doğrulamaktır.

---

# 2. PRODUCT PRINCIPLE — LOCKED

> Oyun Poma görseli olmadan da oynanmak istenmeli.

V0.x motor testi:
- renkli bloklar
- sade grid
- Poma zorunlu değil

Poma karakter/marka katmanı yalnızca motor doğrulandıktan sonra eklenir.

---

# 3. CORE LOOP — LOCKED

Oyuncunun önünde 3 parça vardır.

Akış:
1. 3 parçadan birini seç
2. sürükleyip grid'e yerleştir
3. yatay satırı tamamen doldur
4. satır temizlensin
5. belirli sayıda temizlenen satırdan sonra SHIFT olsun
6. tahta +1 genişlesin, -1 alçalsın
7. yaklaşan tavan riskini yönet
8. hedef SHIFT sayısına ulaş veya kaybet

Ana farklılaştırıcı:

> Başarı arttıkça oyun alanı genişler fakat tavan aşağı iner.

Zaman sayacı yoktur.

---

# 4. BOARD MORPH — LOCKED FOR V0.2

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
- ek kolon sağ/sol kenara dağıtılır
- board içeriği korunur

Yeni stage'e geçerken kaldırılacak üst satırda blok varsa:

**GAME OVER — MORPH CRUSH**

SHIFT öncesi tehlikeli üst satır görsel olarak kırmızı uyarılır.
Gizli ceza yoktur.

---

# 5. LINE CLEAR — LOCKED

Yalnızca tamamen dolu **yatay satır** temizlenir.

V0.2'de YOK:
- renk eşleştirme
- match-3
- 3/4 aynı renk patlatma
- dikey kolon temizleme
- çapraz temizleme

Renk şu anda yalnızca görsel ayrımdır.

---

# 6. PIECES — LOCKED FOR PROTOTYPE

- 1–4 hücreli basit polyomino şekilleri
- sadece klasik 7 tetromino ile sınırlı değil
- yukarıdan düşme yok
- parça döndürme yok
- yerleştirilen parça geri alınmaz
- geçersiz noktaya bırakılırsa tray'e geri döner
- drag sırasında geçerli/geçersiz preview gösterilir

Amaç tek parmakla, açıklamasız anlaşılabilecek kontrol üretmektir.

---

# 7. THREE-PIECE TRAY — LOCKED FOR V0.2

Oyuncuya **3 parçalık batch** verilir.

Kural:
- oyuncu 3 parçayı istediği sırayla kullanır
- kullanılan slot boş kalır
- üçü de kullanıldıktan sonra yeni 3'lü set gelir

Neden:
- oyuncuya kısa vadeli planlama alanı verir
- her hamlede yeni taş gelmesine göre daha az rastgele hissettirir
- “bu üç parçayı nasıl sığdırırım?” mikro problemi yaratır

Slot bazlı anında refill V0.2'de kullanılmaz.
Gerekirse ileride A/B test edilir.

---

# 8. PIECE GENERATION / FAIRNESS

V0.2 jeneratörü tamamen eşit rastgele değildir.

Mevcut yaklaşım:
- kolay şekil havuzu
- zor şekil havuzu
- level arttıkça zor shape olasılığı kontrollü artar
- aynı shape'in arka arkaya gelmesi azaltılır
- ilk levellerde zor shape oranı çok düşüktür

Oyuncuyu sürekli kurtaran gizli rescue algoritması YOK.

Fail ana olarak:
- kötü board yönetimi
- yanlış parça sırası
- yaklaşan SHIFT'i hesaba katmama

sonucu olmalıdır.

---

# 9. LOSS CONDITIONS — LOCKED

Yalnızca iki ana fail:

### A. NO LEGAL MOVE
Tray'de kalan parçaların hiçbirinin geçerli yerleşimi yok.

### B. MORPH CRUSH
SHIFT sırasında kaldırılacak üst sırada blok var.

V0.x boyunca üçüncü ölüm koşulu eklenmez.

---

# 10. FIRST 10 LEVELS — LOCKED TEST SET

| Level | Start | Target | Hard-piece direction |
|---|---|---:|---:|
| 1 | 6×12 | 1 SHIFT | çok kolay |
| 2 | 6×12 | 2 SHIFT | çok kolay |
| 3 | 6×12 | 3 SHIFT | çok düşük |
| 4 | 7×11 | 3 SHIFT | düşük |
| 5 | 6×12 | 4 SHIFT | düşük |
| 6 | 8×10 | 3 SHIFT | düşük |
| 7 | 6×12 | 5 SHIFT | orta-alt |
| 8 | 7×11 | 5 SHIFT | orta-alt |
| 9 | 6×12 | 6 SHIFT | orta |
| 10 | 6×12 | 6 SHIFT | belirgin daha zor |

Level 11+ algoritmik tuning ile devam eder.

İlk 10 level nihai içerik değildir; motor testi setidir.

---

# 11. TARGET SESSION FEEL

Timer YOK.

Hedef gerçek oynama süresi:
- Level 1: yaklaşık 20–45 sn kabul edilebilir
- sonraki normal leveller: yaklaşık 45–90 sn hedef

Bu süre zorla dayatılmaz; telemetride ölçülür.

---

# 12. SCORE — CURRENT IMPLEMENTATION

- yerleştirilen hücre: **+10**
- 1 satır clear: **+100**
- aynı hamlede çoklu clear: `cleared² × 100`
- SHIFT: **+250**
- level complete: **+1000**

Skor retention motoru değildir.
Level progression ana hedeftir.

---

# 13. PROGRESS SAVE

V0.2 web sürümünde:
- son level
- açılan en yüksek level

`localStorage` içinde saklanır.

Backend/cloud save yoktur.

---

# 14. TELEMETRY — IMPLEMENTED LOCALLY

V0.2 backend kullanmadan test eventlerini `localStorage` içinde tutar.

Eventler:
- `session_start`
- `level_start`
- `tray_dealt`
- `piece_placed`
- `invalid_drop`
- `line_clear`
- `shift`
- `level_fail`
- `level_restart`
- `level_complete`

Level complete/fail kaydında ayrıca:
- süre
- skor
- move sayısı
- invalid drop
- temizlenen satır
- tamamlanan SHIFT
- fail nedeni

tutulur.

Test export:

```js
PomaShiftMetrics.export()
```

Temizleme:

```js
PomaShiftMetrics.clear()
```

Bu sistem ürün analytics altyapısı değildir; ilk motor testi içindir.

---

# 15. PROTOTYPE METRICS — INTERNAL GO / NO-GO

İlk hedef 20–50 gerçek test oyuncusudur.
Bu eşikler piyasa benchmark garantisi değil, ürünü öldürme/geliştirme iç filtresidir.

### UX gate
- ilk taşı yardımsız yerleştirebilen: **≥ %90**
- invalid drop oranı: tercihen **< %15**
- oyuncu fail sebebini anlayabiliyor olmalı

### Core-loop gate
- Level 1 completion: **≥ %70**
- Level 3'e ulaşma: **≥ %50**
- ilk 3 levelden sonra kendi isteğiyle devam eden: **≥ %60**
- median test session: en az **5 level** hedef

### Feel gate
Test sonunda şu soru sorulur:

> “Bir level daha oynar mısın?”

Güçlü çoğunluk istemiyorsa görsel/power-up ekleyerek motor kurtarılmaya çalışılmaz.
Önce core mechanic değiştirilir.

### Fail diagnosis
Şunlar ayrı izlenir:
- `no_legal_move`
- `morph_crush`
- aşırı invalid drag/drop
- beklenenden uzun level
- çok kolay level

---

# 16. RETENTION / MONETIZATION — NOT YET LOCKED

D1/D3/D7 retention ve reklam metrikleri **soft launch** aşamasının konusudur.

V0.x motor testinde:
- reklam yok
- rewarded ad yok
- interstitial yok
- IAP yok

Önce retention sinyali, sonra monetization.

---

# 17. STRICT OUT OF SCOPE FOR V0.x

- match-3
- renk patlatma
- bomba
- joker
- power-up
- Poma güçleri
- karakter geliştirme
- Poma Kingdom meta ilerleme
- ev/bina geliştirme
- coin
- günlük görev
- battle pass
- shop
- skin satışı
- multiplayer
- leaderboard
- login
- backend zorunluluğu
- hikâye
- reklam
- gerçek para satışı

Bunlardan biri ancak core loop verisi gerekçelendirirse açılır.

---

# 18. CURRENT WEB IMPLEMENTATION

V0.2 doğrulama sürümü bilinçli olarak hafif tutulur:

- HTML
- CSS
- vanilla JavaScript
- Canvas 2D
- Pointer Events
- localStorage
- service worker
- PWA manifest

Neden Phaser/TypeScript hemen kullanılmadı:
- motoru en hızlı ve en ucuz şekilde doğrulamak
- framework maliyetini eğlence testiyle karıştırmamak
- çalışan prototipi birkaç dosyada tutmak

Core mechanic doğrulanırsa kod:
- TypeScript'e ayrıştırılabilir
- game logic/render katmanı bölünebilir
- gerekirse Phaser render/tween/audio katmanına taşınabilir

Bu geçiş oyunu yeniden tasarlamak anlamına gelmez.

---

# 19. CURRENT FILE STRUCTURE

```text
games/poma-shift/
  GAME_SPEC.md
  README.md
  index.html
  styles.css
  game.js
  manifest.webmanifest
  sw.js
  icon.svg
```

---

# 20. WEB-FIRST / STORE DIRECTION — LOCKED

Ana prensip:

> Tek web oyun motoru → Web/PWA + Android + iOS.

Web sürümü önce geliştirilir.

Store aşamasında hedef:

`Web assets → Capacitor native shell → Android/iOS`

Ancak uygulama yalnızca uzaktaki URL'yi açan boş WebView olmayacaktır.

Bundle içinde bulunacak:
- HTML
- JavaScript
- CSS
- temel assetler
- core level/config

İleride sunucudan alınabilecek:
- level JSON
- balance config
- A/B config
- içerik metadata

Ana oyun internet kesildiğinde de oynanabilir kalmalıdır.

---

# 21. PWA — IMPLEMENTED

Mevcut web prototipinde:
- manifest vardır
- portrait standalone yönü tanımlıdır
- service worker vardır
- core dosyalar cache edilir
- HTTPS altında telefona kurulabilir yapı hazırlanmıştır

PWA, Store uygulamasının alternatifi değil; aynı motorun web dağıtım katmanıdır.

---

# 22. VISUAL RULE

Şimdilik:
- Poma yok
- basit renkli blok
- koyu sade arka plan
- okunaklı grid
- yaklaşan SHIFT için kırmızı üst sıra uyarısı
- geçerli/geçersiz drop preview

Motor doğrulanmadan pahalı art/animasyon üretimi yapılmaz.

---

# 23. NEXT DEVELOPMENT ORDER

1. gerçek cihazda drag/drop hissini test et
2. Level 1–10 denge testini yap
3. morph/line-clear görsel feedback'i güçlendir
4. test telemetrisini gerçek oyunculardan topla
5. GO / NO-GO verisini değerlendir
6. motor geçerse Poma görsel katmanını tasarla
7. sonra native Capacitor paketini aç
8. monetization ancak retention sinyali sonrasında

---

# 24. FINAL V0.2 RULE

Şu anda başarı kriteri:

- Store build değil
- Poma görseli değil
- reklam geliri değil
- çok özellik değil

**Oyuncunun kendi isteğiyle “bir level daha” demesi.**
