# POMA SHIFT — MASTER CONTEXT

**Status:** LIVING SOURCE OF TRUTH  
**Updated:** 2026-08-06  
**Scope:** Product, gameplay, progression, economy, Android/release readiness

Bu dosya yeni sohbetlerde veya geliştirme oturumlarında Poma Shift'i başa sarmamak için ana durum kaydıdır.

## Authority order
1. `POMA_SHIFT_MASTER_CONTEXT.md`
2. `RUSH_RULES.md`
3. `META_SPEC.md`
4. `GAME_SPEC.md`
5. test planları
6. `ART_DIRECTION.md`
7. `PRODUCT_AUDIT.md`
8. `PLAY_RELEASE_CHECKLIST.md`

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
- board morph: `6×12 → 7×11 → 8×10 → 9×9 → 10×8 → 11×7 → 12×6`
- normal 1 danger row
- fail: no legal move / morph crush / move limit / RUSH timeout
- fairness katmanı
- combo + SFX + haptic

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

Android gerçek cihaz testinde eski 5 saniyelik tray timer görülmüş ve `rush-disable.js` + `rush-runtime-guard.js` ile hard-disable edilmiştir.

---

# 4. LONG-RUN LEVEL SYSTEM

- Level 1–10: elle ayarlı onboarding
- Level 11+: deterministik difficulty-wave generator
- hedef: 10.000+ level
- map yalnız aktif level çevresini render eder
- hazır olmayan future boss slot progression'ı bloklamaz

---

# 5. CHARACTER PROGRESSION — LOCKED

| Level | Character | Power |
|---:|---|---|
| 1–9 | **Poma** | özel güç yok |
| 10 | **Poma Dahi** | Bilgisayar |
| 20 | **Influencer Poma** | Telefon |
| 30 | **Okçu Poma** | Ok |
| 40 | **Bozkurt Poma** | Kurt Pençesi |
| 50 | **Baby Poma** | Emzik Salyası |
| 60 | **Dede Poma** | Asa Gücü |
| 70 | **Fire Poma** | Alev Dalgası |
| 80 | **PomaHero** | Sihirli Yaprak |
| 90 | **Yapışkan Şeker Bulutu** | first boss |

Kurallar:
- başlangıç karakterinin adı yalnız **Poma**; “Atkısız Poma” ifadesi kullanılmaz
- Fire Poma Level 70
- PomaHero Level 80
- oyundaki en güçlü karakter/güç **PomaHero / Sihirli Yaprak** olarak kalır
- boss Level 90 değişmez

---

# 6. POWERS / PRICES — LOCKED

- Bilgisayar: morph 10 hamle durur — 1.100 Coin
- Telefon: üst bölgelerde 3 tehlikeli kare — 500 Coin
- Ok: en üst 4 dolu kare — 700 Coin
- Kurt Pençesi: seçilen + bitişik 1 kare — 300 Coin
- Emzik Salyası: seçilen 1 kare — 100 Coin
- Asa Gücü: board reshuffle — 1.600 Coin
- **Alev Dalgası: LOFT bölgesindeki ilk 2 satırı tamamen yakar — 1.800 Coin**
- **Sihirli Yaprak: bütün boardu temizler — 2.000 Coin / en güçlü güç**

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

Future boss slots: `120, 150, 180, 210...`

---

# 9. ART DIRECTION

Target:
> premium casual / soft plastic blocks / dark modern board

Poma yaklaşık %20 IP/meta katmanında kullanılır; board/blok yüzlerine logo/karakter basılmaz.

Fire Poma için gerçek repo asseti:
- `assets/brand/poma-academy/fire poma.png`

PomaHero asseti:
- `assets/brand/poma-academy/poma-hero.png`

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

---

# 11. CURRENT RELEASE BLOCKERS

- yeni Android APK gerçek cihaz smoke testi
- L11 RUSH süre doğrulaması
- L70 Fire Poma unlock + Alev Dalgası animasyonu
- L80 PomaHero / Yaprak
- L90 boss görsel/runtime
- rewarded/interstitial test reklamları gerçek cihaz
- production analytics
- production AdMob IDs
- signed AAB secrets/build
- privacy policy / Data Safety / Play listing
- 5–10 blind test
- 20–50 external telemetry test

---

# 12. CURRENT WORK ORDER

1. CI + Android build PASS
2. Yeni APK'yı telefonda smoke test
3. Görsel/UI kalan kusurları kapat
4. AdMob/analytics production
5. signed AAB
6. Play privacy/Data Safety/store assets
7. blind/external test
8. data-driven tuning
9. release

---

# 13. DO NOT REOPEN WITHOUT DATA

Yeniden sıfırdan tartışılmaz:
- line clear
- SHIFT + board morph
- 3-piece batch
- RUSH full-level timer
- character order: **Poma → Dahi 10 → Influencer 20 → Okçu 30 → Bozkurt 40 → Baby 50 → Dede 60 → Fire Poma 70 → PomaHero 80 → Boss 90**
- PomaHero en güçlü karakterdir
- Fire Alev Dalgası ilk 2 satırı temizler
- booster fiyatları
- 3 life
- continue +3 / max5
- boss90
- 10.000+ level direction

Değişiklik yalnız gerçek oyuncu verisi, gelir/retention verisi veya teknik zorunlulukla yapılır.
