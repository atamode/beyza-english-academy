# POMA SHIFT — MASTER CONTEXT

**Status:** LIVING SOURCE OF TRUTH  
**Updated:** 2026-08-08  
**Scope:** Product, gameplay, progression, economy, Android/release readiness

Bu dosya yeni sohbetlerde veya geliştirme oturumlarında Poma Shift'i başa sarmamak için ana durum kaydıdır.

## Authority order
1. `POMA_SHIFT_MASTER_CONTEXT.md`
2. `LOFT_CORE_V2.md`
3. `RUSH_RULES.md`
4. `META_SPEC.md`
5. `GAME_SPEC.md`
6. test planları
7. `ART_DIRECTION.md`
8. `PRODUCT_AUDIT.md`
9. `PLAY_RELEASE_CHECKLIST.md`

**2026-08-08 override:** `LOFT_CORE_V2.md`, eski dokümanlardaki aynı level içinde `+1 kolon / -1 satır` board-morph yönünü geçersiz kılar. Standard levelde kolon sayısı level boyunca sabittir; SHIFT yalnız LOFT'u üstten aşağı indirir.

---

# 1. PRODUCT GOAL

Poma Shift geniş casual kitleye yönelik, Poma IP'sini meta/progression katmanında kullanan uzun ömürlü puzzle oyunudur.

Ana ticari hedef:
> Retention üreten basit core loop + reklam/coin ekonomisi + düşük içerik üretim maliyetiyle uzun level ömrü.

Launch öncesi öncelik: kalite, test, ölçüm ve release.

---

# 2. CORE — LOCKED

- 3-piece batch
- manuel drag/drop
- yalnız tam yatay satır clear
- her 3 gerçek satır clear = 1 SHIFT
- levelin başlangıç kolon sayısı level boyunca sabit kalır
- SHIFT sırasında yanlardan kolon eklenmez
- SHIFT = LOFT üstten 1 satır aşağı iner
- hücre ölçüsü SHIFT boyunca sabit tutulur; board alt hattı görsel olarak sabit kalır
- normal 1 danger row
- fail: no legal move / LOFT crush (`morph_crush` telemetry compatibility) / move limit / RUSH timeout
- fairness katmanı
- combo + SFX + haptic
- core kimlik: **shape placement + descending LOFT + character powers**

Örnek runtime geometri:
- `6×12 → 6×11 → 6×10 ...`
- `7×11 → 7×10 → 7×9 ...`
- `8×10 → 8×9 → 8×8 ...`

Yanlardan kapanma/büyüme standard core değildir; ileride yalnız özel boss/hard/event mekaniği olarak açıkça anlatılarak kullanılabilir.

Core veri olmadan yeniden tasarlanmaz.

---

# 3. RUSH — LOCKED

Eski 7/6/5 saniyelik tray timer kalıcı olarak geçersizdir.

- ilk RUSH Level 11
- sonra 15, 20, 25, 30... boss slotları hariç
- full-level timer
- giriş kartı → BAŞLA → timer
- L11: 60 sn / 2 SHIFT
- L15–24: 50 sn / 3 SHIFT
- L25–49: 45 sn / 3 SHIFT
- L50+: 40 sn / 4 SHIFT
- RUSH 2 danger row
- background timer pause
- fail reason `rush_timeout`

RUSH'ta da kolon sayısı level boyunca sabittir; 2 danger row kuralı LOFT inişinden önce uygulanır.

Android gerçek cihaz testinde eski 5 saniyelik tray timer görülmüş ve `rush-disable.js` + `rush-runtime-guard.js` ile hard-disable edilmiştir.

---

# 4. LONG-RUN LEVEL SYSTEM

- Level 1–10: elle ayarlı onboarding
- Level 11+: deterministik difficulty-wave generator
- hedef: 10.000+ level
- map yalnız aktif level çevresini render eder
- hazır olmayan future boss slot progression'ı bloklamaz
- startStage farklı level başlangıç genişliği/yüksekliği verebilir; aynı level içinde width sabitlenir

---

# 5. CHARACTER PROGRESSION — LOCKED

| Unlock Level | Character | Power |
|---:|---|---|
| 1 | **Poma** | özel güç yok |
| 10 | **Poma Dahi** | Bilgisayar |
| 20 | **Influencer Poma** | Telefon |
| 30 | **Okçu Poma** | Ok |
| 40 | **Bozkurt Poma** | Kurt Pençesi |
| 50 | **Baby Poma** | Emzik Salyası |
| 60 | **Dede Poma** | Asa Gücü |
| 70 | **Fire Poma** | Alev Dalgası |
| 80 | **PomaHero** | Sihirli Yaprak |
| 90 | **Yapışkan Şeker Bulutu** | first boss |

Gameplay aktif karakter bandı:
- 1–9 Poma
- 10–19 Poma Dahi
- 20–29 Influencer Poma
- 30–39 Okçu Poma
- 40–49 Bozkurt Poma
- 50–59 Baby Poma
- 60–69 Dede Poma
- 70–79 Fire Poma
- 80–89 PomaHero
- Level 90 boss ekranında aktif hero PomaHero; Sugar Cloud ayrı boss tehdididir

Kurallar:
- gameplay ekranında tek aktif karakter görünür
- aktif karakter idle / danger / power cast / win / lose tepkileri verir
- güç kullanımı görsel olarak karakterden boarda doğru cast → projectile/effect → impact akışıyla sunulur
- karakterin kendi imza gücünde signature cast, başka loadout gücünde kısa generic assist cast kullanılabilir
- başlangıç karakterinin adı yalnız **Poma**; “Atkısız Poma” ifadesi kullanılmaz
- Fire Poma Level 70
- PomaHero Level 80
- oyundaki en güçlü karakter/güç **PomaHero / Sihirli Yaprak** olarak kalır
- boss Level 90 değişmez

---

# 6. POWERS / PRICES — LOCKED

- Bilgisayar: **LOFT inişi 10 hamle durur** — 1.100 Coin
- Telefon: üst bölgelerde 3 tehlikeli kare — 500 Coin
- Ok: en üst 4 dolu kare — 700 Coin
- Kurt Pençesi: seçilen + bitişik 1 kare — 300 Coin
- Emzik Salyası: seçilen 1 kare — 100 Coin
- Asa Gücü: board reshuffle — 1.600 Coin
- **Alev Dalgası: LOFT bölgesindeki ilk 2 satırı tamamen yakar — 1.800 Coin**
- **Sihirli Yaprak: bütün boardu temizler — 2.000 Coin / en güçlü güç**

Power presentation:
- mevcut mekanik sonucu korunur
- animasyon core sonucundan ayrı presentation katmanıdır
- Okçu Poma imza castinde yay germe → ok çıkışı → board impact hedeflenir
- Dede Poma imza castinde asa hazırlık → büyü dalgası hedeflenir
- Influencer Poma imza castinde telefon/flaş yönü hedeflenir
- Poma Dahi imza castinde bilgisayar/koruma aktivasyonu hedeflenir

Fire Poma görsel efekti:
- alev yukarıdan boardun ilk 2 satırını süpürür
- bloklar silinir
- kül partikülleri dağılır

Poma Güç Paketi:
- 3.500 Coin
- ilk 6 klasik güç ×1
- Alev Dalgası ve Yaprak pakete dahil değil

---

# 7. ECONOMY / LIVES / ADS

Coin first-clear:
- normal +5
- RUSH/hard +10
- boss +20
- replay farm yok

Lives:
- max/start 3
- fail sonunda 1 can
- depletion timers: 1 dk / 15 dk / 30 dk+
- rewarded +1 life max 3
- 1 life 100 / 3 life 250 Coin

Continue:
- rewarded +3 moves
- max 5 continue ads / level
- aynı attemptte ikinci kez life düşmez

Interstitial:
- L1–4 yok
- L5+ completion placement

12h gift:
- 100 Coin + weighted unlocked classic booster
- Fire Alev Dalgası V1 gift poolunda değil

---

# 8. BOSS

Level 90: **Yapışkan Şeker Bulutu**
- her 3 saniyede 1 kare
- row clear / uygun booster ile temizlenebilir
- tavana ulaşırsa fail

Level 90 presentation / UX baseline:
- yaşayan lobby Level 90 node'unda cloud emoji yerine gerçek Sugar Cloud art + `BOSS` etiketi kullanılır
- boss hazırlığında ana kaynak yaşayan lobby'deki mevcut 3 slot seçimidir; ayrı ekonomi/loadout sistemi oluşturulmaz
- runtime boss hazırlık kartı gösterildiğinde `Yapışkan Şeker Bulutu`, gerçek art ve “her 3 saniyede 1 kare” mekaniğini açıkça anlatır
- oyun içinde boss HUD gerçek Sugar Cloud artını, adını ve 3 sn ritmini gösterir
- sonuç ekranında ana hero yine tek Poma'dır; Sugar Cloud ikinci büyük karakter olarak tekrarlanmaz, kompakt boss sonuç kartında görünür
- win: `Şeker Bulutu dağıldı!`; fail: `Şeker Bulutu hâlâ burada`
- sonuçtaki `Haritaya Bak` yaşayan lobby'ye döner
- boss mekanik/timing/reward bu sunum katmanıyla değiştirilmez

Future boss slots: `120, 150, 180, 210...`

---

# 9. ART DIRECTION

Target:
> premium casual / dark modern board / distinctive soft-plastic tokens / visible LOFT mechanism

Board token kimliği:
- sarı yıldız
- yeşil yaprak
- mavi damla
- pembe kalp/petal
- mor kristal
- turuncu enerji/alev

Grid matematiği kare kalır; düz/jenerik renkli kutu görünümü hedef değildir.

Poma kullanım oranı artık gameplay character presentation nedeniyle eski %20 meta sınırından kontrollü biçimde genişler, ancak karakter boardu kapatmaz ve core okunabilirliğini bozmaz.

Gameplay karakteri:
- kompakt board üstü/HUD alanı
- tek aktif karakter
- kısa CSS/pose reaction
- power cast karakterden çıkar

Fire Poma için gerçek repo asseti:
- `assets/brand/poma-academy/fire poma.png`

PomaHero asseti:
- `assets/brand/poma-academy/poma-hero.png`

Yeni paralel asset brief:
- `ASSET_WORK_PLAN.md`

---

# 10. ANDROID / NATIVE STATUS

App ID: `com.pomante.pomashift`

Native:
- Capacitor 8.4.2
- `@capacitor-community/admob` 8.0.0
- Android minSdk 24
- compileSdk 36
- targetSdk 36
- debug APK + unsigned release AAB workflow mevcut
- production signed AAB workflow hazır; secrets henüz provision edilmedi

2026-08-06 gerçek cihaz screenshot testinde yakalanıp düzeltilenler:
- eski 5 saniyelik RUSH tray timer
- native sonuç/boss görsellerinin eksik paketlenmesi
- DEV panelinin APK'da görünmesi
- version query yüzünden native AdMob bridge injection riski
- Fire Poma dahil milestone karakter assetlerinin native pakete eksiksiz alınması

Native build artık şu görselleri paketler:
- Poma
- Dahi
- Influencer
- Okçu
- Bozkurt
- Baby
- Dede
- Fire Poma
- PomaHero
- sad/result Poma
- Sugar Cloud

2026-08-07 web/UX baseline:
- canlı `harita → OYNA → Level 1` Chromium akışı doğrulandı
- sonuç ekranında tek ana Poma kuralı uygulanıyor: win = mutlu Poma, fail = üzgün Poma
- 5/5 rewarded continue sonrası yeni fail ekranı terminal/donuk state bırakmıyor; normal ve Level 11 RUSH akışı gerçek beş devam senaryosuyla Chromium'da doğrulandı
- sonuç ekranındaki `Haritaya Bak` legacy modal yerine yaşayan Poma Shift lobby/haritasına dönüyor
- lobby harita + birleşik stok/mağaza + sabit 3 slot yapısı ana hazırlık ekranıdır
- güç mini kartı stok varsa `×adet`, stok yoksa Coin fiyatı, kilitliyse açılma leveli gösterir; karta basınca tek ürün detayında işlev, stok/fiyat, slot ve satın alma aksiyonu görünür
- Level 10/20/30/40/50/60/70/80 ilk clear milestone'ları mevcut unlock sonucunu **YENİ GÜÇ AÇILDI** kartına yükseltir; `MAĞAZADA GÖR` yaşayan lobby'deki ilgili ürün detayını doğrudan açar
- milestone unlock kartı first-clear only'dir; replay'de tekrar gösterilmez
- yaşayan lobby'de seçilen 3 güç `pomaShift.loadout.v2` üzerinden runtime `battle-loadout` state'ine deterministik aktarılır; lobby'de `SLOTA EKLE` seçimi oyun içinde kaybolmaz
- Level 70 Chromium zinciri `first clear → Fire Poma/Alev Dalgası unlock → mağaza detayı → stok ×1 → slot → runtime` olarak doğrulandı; Alev Dalgası yalnız ilk 2 board satırını temizler ve 3. satırı korur
- Level 80 Chromium zinciri `first clear → PomaHero/Sihirli Yaprak unlock → mağaza detayı → stok ×1 → slot → runtime` olarak doğrulandı; Sihirli Yaprak bütün boardu temizler
- RUSH runtime guard non-RUSH levele geçildiğinde stale RUSH intro overlay'ini zorla kapatır; RUSH milestone metni locked karakter sırasına göre normalize edilir (`70 Fire Poma/Alev Dalgası`, `80 PomaHero/Sihirli Yaprak`)
- Level 90 boss Chromium regression'ı `lobby boss node → 3 slot → boss → gerçek sugar cast → win → harita` ve `boss hazırlık → fail → harita` zincirlerini kapsar
- boss HUD artık `window.state` varsayımı yerine gerçek lexical game `state` üzerinden çalışır
- yeni result-flow ve loadout/RUSH guard dosyaları native build kapsamına alınır

2026-08-08 LOFT/game-feel branch baseline:
- `LOFT_CORE_V2.md` ile same-level side growth kapatıldı
- `loft-core-v2.js` start width'i level boyunca sabitler ve yalnız satır baskısı uygular
- board hücre ölçüsü sabit, alt hat ankrajlı; LOFT görsel olarak yukarıdan aşağı yaklaşır
- altı token tipi için vector fallback çizimi eklendi; final PNG assetleri paralel üretilecektir
- gameplay aktif karakter bandı ve signature/assist cast presentation katmanı `character-gameplay-v1.js` ile eklendi
- karakter/LOFT/token asset üretim sırası `ASSET_WORK_PLAN.md` içine yazıldı
- native build game klasörünü recursive kopyaladığı için yeni JS/CSS katmanları ayrıca whitelist gerektirmeden native pakete girer

2026-08-07 analytics baseline:
- production telemetry provider GA4 web tag üzerinden bağlıdır; launch measurement property `G-LVDEFW23S9` ve Poma Shift eventleri `ps_*` namespace'iyle ayrıştırılır
- analytics tercihi `poma.analytics.consent.v1` ile tutulur; bilinmeyen kullanıcı lobby içinde seçim görür, reddeden kullanıcıda Google tag yüklenmez ve oyun/local telemetry çalışmaya devam eder
- consent kartı yalnız yaşayan lobby açıkken görünür; oyun ve sonuç ekranlarına taşmaz / CTA'ları bloke etmez
- analytics consent reklam consentinden ayrıdır; `ad_storage`, `ad_user_data`, `ad_personalization` analytics katmanında denied kalır
- remote payload strict whitelist kullanır; isim/e-posta/serbest metin/cevap gibi alanlar gönderilmez
- merkezi bridge gerçek lexical game `state` level'ını kullanır ve provider sonradan yüklense bile mevcut local session/start eventlerini bootstrap eder
- Chromium analytics testleri deny → local-only → grant, reversible settings, `ps_*` namespace, Level 70 doğru level değeri ve payload whitelist akışını doğrular
- CI/test ortamında provider `testing=true` ile çalıştırılır; gerçek GA4 verisi testlerle kirletilmez

---

# 11. CURRENT RELEASE BLOCKERS

LOFT V2 öncesi mevcut blockerlar korunur ve yeni core regression eklenir:
- LOFT V2 browser regression: Level 1 / 4 / 6 width sabit, row descent doğru
- L11 RUSH 2 danger row + LOFT descent regression
- Bilgisayar gücü LOFT inişini 10 hamle gerçekten durduruyor mu
- active character bandı Level 1/10/20/30/60/70/80/90 doğru mu
- booster cast presentation gameplay inputunu kilitlemeden çalışıyor mu
- yeni Android APK gerçek cihaz smoke testi
- L11 RUSH süre doğrulaması gerçek cihaz
- L70 Fire Poma / L80 PomaHero / L90 Boss Android gerçek cihaz görsel-runtime smoke
- rewarded/interstitial test reklamları gerçek cihaz
- production GA4 eventinin Analytics Realtime/DebugView içinde dışarıdan doğrulanması
- production AdMob IDs
- signed AAB secrets/build
- privacy policy / Data Safety / Play listing
- 5–10 blind test
- 20–50 external telemetry test

Final token / LOFT / karakter pose PNG'leri gelmeden vector/static fallback ile test yapılabilir; release art polish için asset entegrasyonu ayrıca kapanmalıdır.

---

# 12. CURRENT WORK ORDER

1. LOFT V2 runtime + syntax/static tests PASS
2. Browser smoke: Level 1 → SHIFT → width sabit / LOFT aşağı
3. RUSH + booster + boss regression
4. Paralel asset üretimi: 6 token + LOFT + Okçu signature set
5. Final asset entegrasyonu
6. Yeni APK'yı telefonda smoke test
7. Görsel/UI kalan kusurları kapat
8. AdMob/analytics external production verification
9. signed AAB
10. Play privacy/Data Safety/store assets
11. blind/external test
12. data-driven tuning
13. release

---

# 13. DO NOT REOPEN WITHOUT DATA

Yeniden sıfırdan tartışılmaz:
- line clear
- **SHIFT = same-level fixed width + descending LOFT**
- standard levelde side growth yok
- 3-piece batch
- RUSH full-level timer
- character order: **Poma → Dahi 10 → Influencer 20 → Okçu 30 → Bozkurt 40 → Baby 50 → Dede 60 → Fire Poma 70 → PomaHero 80 → Boss 90**
- gameplay active character bandları
- PomaHero en güçlü karakterdir
- Fire Alev Dalgası ilk 2 satırı temizler
- booster fiyatları
- 3 life
- continue +3 / max5
- boss90
- 10.000+ level direction

Değişiklik yalnız gerçek oyuncu verisi, gelir/retention verisi veya teknik zorunlulukla yapılır.
