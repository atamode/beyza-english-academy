# POMA SHIFT — MASTER CONTEXT

**Status:** LIVING SOURCE OF TRUTH  
**Last reset:** 2026-08-06  
**Scope:** Product, gameplay, progression, economy, release readiness

Bu dosya yeni sohbetlerde veya yeni geliştirme oturumlarında Poma Shift'i başa sarmamak için yaşayan ana durum kaydıdır.

## Authority order

Çelişki olduğunda bu sıra geçerlidir:

1. `POMA_SHIFT_MASTER_CONTEXT.md` — güncel ürün durumu ve çalışma önceliği
2. `RUSH_RULES.md` — RUSH davranışı
3. `META_SPEC.md` — meta, ekonomi, karakter, reklam hook'ları ve boss
4. `GAME_SPEC.md` — core puzzle motoru
5. `TEST_PLAN.md` + `META_TEST_PLAN.md` — release doğrulaması
6. `ART_DIRECTION.md` — görsel dil
7. `PRODUCT_AUDIT.md` — yaşayan launch audit

Eski dokümanlarda kalan ve üstteki kaynaklarla çelişen kurallar geçersizdir.

---

# 1. PRODUCT GOAL

Poma Shift geniş casual kitleye yönelik, Poma IP'sini meta/progression katmanında kullanan uzun ömürlü puzzle oyunudur.

Ana ticari hedef:

> Retention üreten basit core loop + reklam/coin ekonomisi + düşük içerik üretim maliyetiyle uzun level ömrü.

Yeni özellik eklemek launch öncesi ana hedef değildir. Öncelik: kalite, test, ölçüm ve release.

---

# 2. CORE — LOCKED

- 3-piece batch
- drag/drop
- yalnız tam yatay satır clear
- her 3 gerçek satır clear = SHIFT
- board morph: `6×12 → 7×11 → 8×10 → 9×9 → 10×8 → 11×7 → 12×6`
- normal levelde 1 danger row
- fail türleri: no legal move / morph crush / move limit
- fairness katmanı
- combo
- mobil finger offset
- haptic / SFX / threat feedback

Core mekanik veri olmadan yeniden tasarlanmaz.

---

# 3. RUSH — LOCKED

`RUSH_RULES.md` otoritedir.

Eski 7/6/5 saniyelik tray timer **kalıcı olarak iptal edilmiştir**.

Güncel RUSH:
- ilk RUSH Level 11
- sonra 15, 20, 25, 30...; boss slotları hariç
- tüm level süreli
- giriş kartı → `BAŞLA` → timer
- Level 11: 60 sn / 2 SHIFT
- Level 15–24: 50 sn / 3 SHIFT
- Level 25–49: 45 sn / 3 SHIFT
- Level 50+: 40 sn / 4 SHIFT
- RUSH'ta 2 danger row
- background/tab hidden durumunda timer durur
- RUSH timeout fail reason: `rush_timeout`

---

# 4. LONG-RUN LEVEL SYSTEM — LOCKED

- Level 1–10: elle ayarlı onboarding/tuning
- Level 11+: deterministik difficulty-wave generator
- hedef: 10.000+ level taşıyabilmek
- map yalnız oyuncu çevresindeki node'ları render eder
- future boss slotu hazır değilse normal generator challenge üretir; progression bloklanmaz

---

# 5. CHARACTER PROGRESSION — LOCKED

| Level | Character | Item / Power |
|---:|---|---|
| 1–10 | Atkısız Poma | yok |
| 20 | Poma Dahi | Bilgisayar |
| 30 | Influencer Poma | Telefon |
| 40 | Okçu Poma | Ok |
| 50 | Bozkurt Poma | Kurt Pençesi |
| 60 | Baby Poma | Emzik Salyası |
| 70 | Dede Poma | Asa Gücü |
| 80 | Hero Poma | Sihirli Yaprak |
| 90 | Yapışkan Şeker Bulutu | ilk boss |

Milestone ilk kez tamamlanınca item unlock olur ve ilk kullanımdan 1 adet ücretsiz verilir.

---

# 6. BOOSTERS — LOCKED

- Emzik Salyası: seçilen 1 dolu kareyi siler — 100 Coin
- Kurt Pençesi: seçilen kare + bitişik 1 dolu kare — 300 Coin
- Telefon: üst bölgelerdeki 3 tehlikeli kare — 500 Coin
- Ok: en üst 4 dolu kare — 700 Coin
- Bilgisayar: board morph 10 placed-piece boyunca durur — 1.100 Coin
- Asa: board'u yeniden oynanabilir düzene taşır — 1.600 Coin
- Sihirli Yaprak: tüm mevcut blokları temizler — 2.000 Coin
- Güç Paketi: ilk 6 booster ×1, Yaprak hariç — 3.500 Coin

---

# 7. ECONOMY / LIVES / ADS — LOCKED

Coin first-clear ödülü:
- normal: 5
- RUSH/hard: 10
- boss: 20
- replay Coin farm üretmez

Lives:
- max 3
- fail sonunda 1 can düşer
- gün içi ilk depletion: 1 dk sonra 1 can
- ikinci depletion: 15 dk
- üçüncü+: 30 dk
- rewarded: +1 can, max 3
- 1 can: 100 Coin
- 3 can: 250 Coin

Continue:
- rewarded ad = +3 hamle
- level başına max 5 rewarded continue
- aynı attempt zincirinde ikinci kez can düşmez

Interstitial:
- Level 1–4 yok
- Level 5+ completion placement

Return gift:
- claim sonrası 12 saat cooldown
- 100 Coin
- yalnız açılmış booster havuzundan 1 weighted item

Web prototipte test ad adapter vardır. Native release için gerçek ad provider ayrıca bağlanmalıdır.

---

# 8. BOSS — LOCKED V1

Level 90: **Yapışkan Şeker Bulutu**

- level başında aktif
- her 3 saniyede 1 kare kapatır
- kareler line clear ve uygun boosterlarla temizlenebilir
- tavana ulaştığında fail

Future boss slots:
`120, 150, 180, 210...`

V1 release için yalnız Level 90 bossu zorunludur.

---

# 9. ART DIRECTION — LOCKED

Hedef:

> Premium casual / soft plastic blocks / koyu modern board.

Poma kullanım oranı yaklaşık `%80 bağımsız casual / %20 Poma IP`.

Poma kullanılır:
- tutorial
- map
- character goals
- unlock / complete / fail reaksiyonları
- menu/loading/store shell

Poma board hücreleri ve blokların üstüne basılmaz.

Renk dili:
- normal/control: koyu mavi / teal
- success: mint / yumuşak yeşil
- warning: amber
- critical danger: kırmızı yalnız gerçek tehlikede

Müzik yönü:
- map music
- gameplay'de SFX öncelikli

---

# 10. IMPLEMENTED STATUS

Repo içinde mevcut ve kod karşılığı doğrulanmış başlıklar:
- core board / SHIFT / line clear
- RUSH full-level timer ve 2 danger row
- scalable level generator
- character milestones
- booster inventory / purchase / effects
- Coin economy
- 3-life system ve depletion timers
- rewarded continue
- interstitial/rewarded test adapter
- 12-hour return gift
- Level 90 Sugar Cloud boss
- scalable map shell
- local telemetry + analytics bridge contract
- audio/SFX/haptic layer
- PWA manifest/service worker dosyaları

---

# 11. KNOWN TECHNICAL DEBT / RELEASE BLOCKERS

P0:
- `GAME_SPEC.md`, `ART_DIRECTION.md`, `PRODUCT_AUDIT.md` içindeki eski kararları güncel otoriteyle hizala
- Core + Meta release gate'i gerçekten çalıştır ve PASS/FAIL kaydı üret
- gerçek production analytics provider bağla
- Android/Capacitor kaynak konumunu doğrula ve tek release hattına al
- gerçek rewarded/interstitial provider bağla
- 5–10 kişi kör test
- 20–50 dış test telemetry
- ilk 10 level + RUSH tuning'i gerçek veriyle yap

Known discrepancy:
- web `index.html` Poma Shift service worker registration/cache'lerini açılışta temizliyor; README'deki offline/PWA iddiası release öncesi netleştirilmeli

Resolved 2026-08-06:
- analytics summary eski `tray_timeout` yerine güncel `rush_timeout` eventini sayacak şekilde düzeltildi

---

# 12. GO / NO-GO METRICS

İlk dış test hedefleri:
- Level 1 completion ≥ %70
- Level 1 complete → Level 2 start ≥ %70
- Level 3'e ulaşma ≥ %50
- fail sonrası restart ≥ %40
- fairness adjustment < %10 batch

RUSH ayrıca ölçülür:
- Level 11 reach
- first RUSH completion
- rush timeout rate
- remaining time
- RUSH sonrası continuation

Bu eşikler karşılanmadan yeni feature eklemek öncelik değildir.

---

# 13. CURRENT WORK ORDER

1. Master/context ve doküman consistency
2. Analytics correctness
3. Release gate / regression tests
4. Premium board + blocks + HUD polish
5. Map / character / unlock polish
6. Level 90 boss presentation polish
7. Android/native ad/analytics release integration
8. Blind playtest
9. External telemetry test
10. Data-driven tuning
11. Store release

---

# 14. DO NOT REOPEN WITHOUT DATA

Aşağıdakiler yeniden sıfırdan tartışılmaz:
- line clear kuralı
- SHIFT core ve board morph
- 3-piece batch
- RUSH'un full-level timer olması
- normal 1 / RUSH 2 danger row
- character milestone sırası
- booster ana etkileri ve fiyatları
- 3-life limiti
- continue +3 / max 5
- Level 90 first boss
- 30-level future boss slotları
- 12-hour gift
- 10.000+ level yönü

Değişiklik yalnız gerçek oyuncu verisi, gelir/retention verisi veya teknik zorunlulukla yapılır.
