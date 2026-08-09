# POMA SHIFT — MASTER CONTEXT

**Status:** LIVING SOURCE OF TRUTH  
**Updated:** 2026-08-09  
**Scope:** Product, gameplay, progression, economy, art, Android/release readiness

Bu dosya yeni sohbetlerde veya geliştirme oturumlarında Poma Shift'i başa sarmamak için ana durum kaydıdır.

## Authority order
1. `POMA_SHIFT_MASTER_CONTEXT.md`
2. `SUGAR_CLOUD_CORE_V3.md`
3. `RUSH_RULES.md`
4. `META_SPEC.md`
5. `GAME_SPEC.md`
6. test planları
7. `ART_DIRECTION.md`
8. `ASSET_WORK_PLAN.md`
9. `PRODUCT_AUDIT.md`
10. `PLAY_RELEASE_CHECKLIST.md`

**2026-08-09 override:** `SUGAR_CLOUD_CORE_V3.md`, `LOFT_CORE_V2.md` ve eski spec dosyalarındaki değişken board / descending-LOFT / Dahi Poma 10-hamle-freeze anlatımlarını geçersiz kılar. Çelişkide bu master + Sugar Cloud V3 uygulanır.

---

# 1. PRODUCT GOAL

Poma Shift geniş casual kitleye yönelik, Poma IP'sini gameplay ve meta/progression katmanında kullanan uzun ömürlü puzzle oyunudur.

Ana ticari hedef:
> Retention üreten basit core loop + karakter kimliği + reklam/coin ekonomisi + düşük içerik üretim maliyetiyle uzun level ömrü.

Launch öncesi öncelik: **oynanış kalitesi → hata kapatma → gerçek asset entegrasyonu → ölçüm → release**.

---

# 2. CORE — LOCKED: SUGAR CLOUD V3

Ana kimlik:
> **shape placement + growing Sugar Cloud + character powers**

Kilit kurallar:
- 3-piece batch
- manuel drag/drop
- yalnız tam yatay satır clear
- her 3 gerçek satır clear = 1 SHIFT
- **bütün standart gameplay boardları 7 sütun × 9 satırdır**
- levelden levele 6×12 / 8×9 vb. geometri değişimi yok
- SHIFT sırasında kolon eklenmez, board genişlemez/daralmaz
- SHIFT sonrası canvas/grid fiziksel olarak küçülmez
- grid matematiği her zaman **7×9** kalır
- SHIFT = Şeker Bulutu üstten aşağı **1 satır büyür**
- bulutun kapladığı satırlar kilitlenir ve parça yerleştirilemez
- normal levelde bulutun sıradaki kapatacağı satırda blok varsa cloud-crush fail
- no legal move / cloud crush / move limit / RUSH timeout fail türleri korunur
- eski telemetry ile gerektiğinde `morph_crush` compatibility tutulabilir
- fairness katmanı korunur
- action-based combo + SFX + haptic korunur

Örnek:
- başlangıç: board `7×9`, bulut 0 satır
- SHIFT 1: board yine `7×9`, bulut 1 satırı kaplar
- SHIFT 2: board yine `7×9`, bulut 2 satırı kaplar

**Yanlardan kapanma/büyüme standard core değildir.** İleride yalnız açıkça anlatılan special/hard/boss/event mekaniği olabilir.

---

# 3. ŞEKER BULUTU — VISUAL / FEEL LOCK

Şeker Bulutu yalnız sayaç değildir; ana tehdit karakteridir.

Durumlar:
- güvenli: açık pembe/beyaz/mor, yumuşak puf/sparkle
- uyarı: bulut ile en yakın blok arasında yaklaşık **2 satır** kaldığında hafif kararır
- kritik: mesafe yaklaşık **1 satır** olduğunda daha koyu/pulse olur
- kritik durumda kısa şimşekler görünür

Her SHIFT:
1. bulut kısa süre kabarır
2. aşağı doğru 1 hücre/satır kadar büyüme hissi verir
3. kısa `whoosh / puff / mekanik olmayan şeker fırtınası` SFX oynar
4. hafif haptic kullanılabilir
5. oyun akışı yaklaşık 0.5–0.7 sn içinde devam eder

Amaç:
> Oyuncu HUD okumadan bulutun yaklaştığını ve alan kaybettiğini hissetmelidir.

`LOFT SINIRI` oyuncuya görünen ana terim değildir. UI dili **BULUT / ŞEKER BULUTU** olur.

---

# 4. RUSH — LOCKED

Eski 7/6/5 saniyelik tray timer kalıcı olarak geçersizdir.

- ilk RUSH Level 11
- sonra 15, 20, 25, 30... boss slotları hariç
- full-level timer
- giriş kartı → **BAŞLA** → timer
- BAŞLA denmeden sayaç çalışmaz
- L11: 60 sn / 2 SHIFT
- L15–24: 50 sn / 3 SHIFT
- L25–49: 45 sn / 3 SHIFT
- L50+: 40 sn / 4 SHIFT
- background timer pause
- fail reason `rush_timeout`

Sugar Cloud V3 ile RUSH danger kuralı:
- danger row artık sabit row 0/1 değildir
- her an **mevcut Şeker Bulutu kenarının altındaki sıradaki 2 açık satır** danger zone'dur
- SHIFT öncesi bu 2 tehlike satırı güvenli olmalıdır
- RUSH overlay kapanınca canvas/game input kesin açık kalmalıdır
- runtime watchdog stale overlay/pointer lock yüzünden oyunu donduramaz

2026-08-09 Chromium regression:
- Level 11 RUSH açılıyor
- beş rewarded continue akışı çalışıyor
- terminal sonuç ekranına donmadan ulaşıyor

---

# 5. LONG-RUN LEVEL SYSTEM

- Level 1–10: elle ayarlı onboarding/difficulty
- Level 11+: deterministik difficulty-wave generator
- hedef: 10.000+ level
- map yalnız aktif level çevresini render eder
- future boss slotları progression'ı bloklamaz
- **startStage artık standart gameplay geometry'sini değiştirmez; board 7×9'dur**
- zorluk geometri değiştirerek değil; move budget, hedef SHIFT, başlangıç blok yoğunluğu, RUSH, boss ve diğer açık kurallarla artar

---

# 6. CHARACTER PROGRESSION — LOCKED

| Unlock | Character | Power |
|---:|---|---|
| 1 | **Poma** | özel güç yok |
| 10 | **Poma Dahi** | Güvenlik Kalkanı |
| 20 | **Influencer Poma** | Telefon |
| 30 | **Okçu Poma** | Ok |
| 40 | **Bozkurt Poma** | Kurt Pençesi |
| 50 | **Baby Poma** | Emzik Salyası |
| 60 | **Dede Poma** | Asa Gücü |
| 70 | **Fire Poma** | Alev Dalgası |
| 80 | **PomaHero** | Sihirli Yaprak |
| 90 | **Yapışkan Şeker Bulutu** | first boss variant |

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
- Level 90: aktif hero PomaHero + ayrı boss tehdidi

Kurallar:
- gameplay ekranında tek aktif karakter görünür
- karakter level bandına göre otomatik değişir
- güç kullanımı karakterden çıkar: **cast → projectile/effect → board impact**
- animasyon core sonucu kilitlememeli; kısa ve interrupt-safe olmalı
- normal match/placementte karakter gereksiz animasyon yapmaz
- başlangıç karakterinin adı yalnız **Poma**
- PomaHero en güçlü karakter/güç olarak kalır

Danger / win / lose final PNG pose'ları henüz release core'una dahil değildir; önce core + gerçek gameplay asset entegrasyonu doğrulanır.

---

# 7. POWERS / PRICES — LOCKED

- **Güvenlik Kalkanı (Poma Dahi): Şeker Bulutu'nun bir sonraki ilerlemesini 1 kez engeller — 1.100 Coin**
- Telefon: üst bölgelerde 3 tehlikeli kare — 500 Coin
- Ok: mevcut core sonucu korunur; Okçu presentation hedefi yay germe → ok → impact — 700 Coin
- Kurt Pençesi: seçilen + bitişik 1 kare — 300 Coin
- Emzik Salyası: seçilen 1 kare — 100 Coin
- Asa Gücü: board reshuffle — 1.600 Coin
- Alev Dalgası: mevcut iki-satır clear core sonucu — 1.800 Coin
- **Sihirli Yaprak: bütün boardu temizler — 2.000 Coin / en güçlü güç**

## Dahi Poma — yeni kilit

Eski davranış geçersiz:
> Bilgisayar / LOFT 10 hamle donar.

Yeni davranış:
1. oyuncu Güvenlik Kalkanı kullanır
2. Dahi Poma bilgisayarını aktive eder
3. board üstünde cyan/mavi dijital kalkan görünür
4. sonraki SHIFT gerçekleştiğinde SHIFT hedefte sayılır
5. Şeker Bulutu o SHIFT'te büyümez
6. kalkan tüketilir
7. sonraki SHIFT normal cloud advance olur

UI copy:
> **Güvenlik Kalkanı — Şeker Bulutu'nun bir sonraki ilerlemesini durdurur.**

Poma Güç Paketi:
- 3.500 Coin
- ilk 6 klasik güç ×1
- Alev Dalgası ve Yaprak pakete dahil değil

---

# 8. ECONOMY / LIVES / ADS

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

# 9. BOSS

Level 90: **Yapışkan Şeker Bulutu**
- global Sugar Cloud core tehdidiyle aynı şey değildir
- boss varyantı ayrı `sticky / sugar storm` mekanik katmanıdır
- mevcut boss timing/reward regression'ı korunur

Sunum baseline:
- lobby Level 90 node: gerçek boss art + `BOSS`
- boss hazırlığı mevcut 3 slot loadout kullanır
- sonuçta ana hero tek PomaHero'dur; boss kompakt sonuç kartında kalır
- win: `Şeker Bulutu dağıldı!`
- fail: `Şeker Bulutu hâlâ burada`
- `Haritaya Bak` yaşayan lobby'ye döner

Future boss slots: `120, 150, 180, 210...`

---

# 10. ART DIRECTION

Target:
> **premium casual / dark modern board / distinctive soft-plastic tokens / living Sugar Cloud threat / character-driven powers**

Board token kimliği:
- sarı yıldız
- yeşil yaprak
- mavi damla
- pembe kalp/petal
- mor kristal
- turuncu enerji/alev

Grid hitbox matematiği kare kalır; oyuncuya görünen parça düz/jenerik kutu olmak zorunda değildir.

Gameplay karakteri:
- kompakt board üstü/HUD alanı
- tek aktif karakter
- karakter boardu kapatmaz
- power cast karakterden çıkar

Şeker Bulutu:
- ana tehdit görselidir
- başlangıçta tatlı/aydınlık
- 2 satır kala kararma
- kritik yakınlıkta pulse + şimşek
- SHIFT'te büyüme/puff/whoosh

Kabul edilen first-pass asset aileleri:
- 6 token
- Sugar Cloud/önceki LOFT yerine kullanılacak threat yönü
- Poma
- Poma Dahi
- Influencer Poma
- Okçu Poma
- Bozkurt Poma
- Baby Poma
- Dede Poma
- Fire Poma
- PomaHero

**Not:** sohbet içinde kabul edilen yüksek kaliteli final PNG'lerin tamamı henüz repository runtime asseti olarak bağlanmış sayılmaz. Kod/CSS fallback ile core doğrulandı; gerçek PNG entegrasyonu ayrı kapanacaktır.

Asset brief: `ASSET_WORK_PLAN.md`.

---

# 11. WEB / ANDROID / RELEASE STATUS

App ID: `com.pomante.pomashift`

Native:
- Capacitor 8.4.2
- `@capacitor-community/admob` 8.0.0
- Android minSdk 24
- compileSdk 36
- targetSdk 36
- debug APK + unsigned release AAB workflow mevcut
- production signed AAB workflow hazır; secrets provision durumu ayrıca doğrulanır

Web cache policy:
- launch candidate sırasında eski Poma Shift service-worker cache'i temizlenir
- web runtime eski gameplay JS'e takılmamalıdır

2026-08-09 Sugar Cloud V3 release verification:
- PR static CI: PASS
- PR Chromium browser smoke: **11/11 PASS**
- Level 11 RUSH five-continue / terminal freeze regression: PASS
- main browser smoke: PASS
- production deployed Chromium smoke: PASS
- merged core commit: `11d75b0683c38792c114f3619576077804cfe864`

---

# 12. CURRENT WORK ORDER

1. **Sugar Cloud V3 core — DONE / LIVE**
2. bütün level boardlarının 7×9 gerçek cihaz kontrolü
3. Sugar Cloud görsel boyut/konum/kararma/şimşek UX kontrolü
4. Dahi Güvenlik Kalkanı gerçek kullanıcı akışı kontrolü
5. RUSH gerçek telefon tekrar testi
6. kabul edilen final PNG token/karakter/FX assetlerini repository runtime'a bağlama
7. Okçu/Dede/Influencer/Dahi/Poma cast görsel kalitesini gerçek assetlerle doğrulama
8. kalan game-feel: pop / combo / SFX / haptic polish
9. danger / win / lose pose üretimi ve entegrasyonu
10. Android APK smoke
11. AdMob/analytics external production verification
12. signed AAB + Play privacy/Data Safety/store assets
13. blind/external test → data-driven tuning → release

---

# 13. CURRENT RELEASE BLOCKERS

Core blocker olmayan ama release öncesi kapanacaklar:
- final gerçek PNG asset entegrasyonu
- Sugar Cloud gerçek cihaz visual/performance smoke
- Dahi shield UX smoke
- RUSH gerçek cihaz tekrar doğrulaması
- Android APK visual/runtime smoke
- rewarded/interstitial test reklamları gerçek cihaz
- production GA4 external verification
- production AdMob IDs
- signed AAB secrets/build
- privacy policy / Data Safety / Play listing
- 5–10 blind test
- 20–50 external telemetry test

---

# 14. DO NOT REOPEN WITHOUT DATA

Yeniden sıfırdan tartışılmaz:
- line clear
- **standard board = 7×9 fixed**
- **SHIFT = Sugar Cloud grows down 1 row; board does not resize**
- standard levelde side growth yok
- Sugar Cloud warning = yaklaşık 2 satır kala kararma; kritik = lightning/pulse
- Poma Dahi = **next cloud advance one-use shield**, 10-move freeze değil
- 3-piece batch
- RUSH full-level timer + cloud-edge next 2 danger rows
- character order: **Poma → Dahi 10 → Influencer 20 → Okçu 30 → Bozkurt 40 → Baby 50 → Dede 60 → Fire Poma 70 → PomaHero 80 → Boss 90**
- gameplay active character bands
- PomaHero en güçlü karakterdir
- 3 life
- continue +3 / max5
- boss90
- 10.000+ level direction

Değişiklik yalnız gerçek oyuncu verisi, gelir/retention verisi veya teknik zorunlulukla yapılır.
