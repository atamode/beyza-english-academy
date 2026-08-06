# POMA SHIFT — PRODUCT / LAUNCH AUDIT

**Status:** LAUNCH-CANDIDATE AUDIT  
**Authority:** Genel durum için `POMA_SHIFT_MASTER_CONTEXT.md`

Bu dosya mevcut ürünün launch öncesi gerçek eksiklerini izler.

## P0 — Core regression / usability

- [x] 3-piece drag/drop motoru
- [x] yalnız yatay full-row clear
- [x] 3 clear = SHIFT
- [x] board morph
- [x] normal 1 danger row
- [x] RUSH 2 danger row
- [x] Morph Crush / no legal move / move limit fail türleri
- [x] mobil finger offset
- [x] valid placement preview
- [x] invalid drop feedback
- [x] line clear / SHIFT feedback
- [x] haptic feedback
- [ ] `TEST_PLAN.md` release gate gerçek cihazlarda PASS kaydı
- [ ] İlk açılışta kullanıcı yardım almadan parçayı sürükleyebiliyor mu doğrula
- [ ] İlk satır clear ve SHIFT riski kör testte anlaşılıyor mu doğrula
- [ ] Fail nedeni kullanıcıya yeterince açık mı doğrula

## P0 — RUSH

- [x] Eski 7/6/5 sn tray timer kaldırıldı
- [x] Full-level timer
- [x] giriş kartı → BAŞLA → timer akışı
- [x] background/tab hidden olduğunda pause
- [x] RUSH timeout fail reason
- [x] RUSH sırasında 2 danger row
- [x] static contract testleri RUSH süre/danger/boss-exclusion davranışını koruyor
- [ ] Level 11 / 15 / 25 / 50 gerçek gameplay smoke PASS kaydı
- [ ] RUSH süreleri gerçek oyuncu datasıyla tune edilmeli

## P0 — Meta / economy regression

- [x] Coin economy
- [x] first-clear farm koruması
- [x] 3-life system
- [x] 1 / 15 / 30 dk depletion timers
- [x] rewarded +1 life hook
- [x] rewarded continue +3 move
- [x] continue max 5 / level
- [x] booster inventory / purchase / unlock
- [x] 12-hour return gift
- [x] character milestones 20–80
- [x] scalable 10.000+ level generator
- [x] static meta contract testleri temel ekonomi sabitlerini koruyor
- [ ] `META_TEST_PLAN.md` gerçek gameplay release gate tam PASS kaydı
- [ ] 1 / 20 / 80 / 90 / 120 / 1000 / 10000 gerçek smoke PASS
- [ ] life timer runtime edge-case testi
- [ ] continue 5-cap runtime edge-case testi
- [ ] booster effects full runtime regression

## P0 — Boss

- [x] Level 90 Yapışkan Şeker Bulutu kodu
- [x] 3 saniyelik fill interval
- [x] line clear / booster ile temizlenebilir sugar cells
- [x] ceiling fail
- [x] static contract testi boss interval/ceiling kuralını koruyor
- [ ] Level 90 gerçek gameplay regression PASS
- [ ] boss interval cleanup / continue sonrası restart runtime PASS
- [ ] boss görsel presentation final

## P0 — Measurement

- [x] local prototype event log
- [x] analytics bridge contract
- [x] analytics summary
- [x] `rush_timeout` summary bug fix
- [x] analytics bridge static contract testleri
- [ ] gerçek production analytics provider
- [ ] level funnel dashboard/rapor
- [ ] fail reason dağılım raporu
- [ ] fairness adjustment oranı raporu
- [ ] RUSH reach / completion / timeout / remaining-time raporu

## P0 — Native / monetization

- [x] web test rewarded/interstitial adapter
- [x] native shell konumu: `games/poma-shift/native/`
- [x] Capacitor Android shell
- [x] `@capacitor-community/admob` rewarded provider bridge
- [x] `@capacitor-community/admob` interstitial provider bridge
- [x] consent info/form kod akışı
- [x] Google demo ad ID'leriyle safe test mode
- [x] production AdMob unit ID environment desteği
- [x] native shell contract testleri
- [x] CI native web + AdMob bridge build adımı
- [ ] production AdMob unit ID'lerini provision et
- [ ] production mode build smoke
- [ ] Android signing / AAB release hattını doğrula
- [ ] gerçek cihaz rewarded/interstitial/consent smoke test

## P1 — Game feel / visual quality

- [x] temel state palette
- [x] placement / clear / SHIFT SFX altyapısı
- [x] map-only music yönü
- [x] map character goals
- [ ] board yüzey derinliği final
- [ ] soft-plastic block material final
- [ ] premium HUD sadeleştirme
- [ ] SHIFT fiziksel kesilme/tavan hissi final
- [ ] fail / complete ekranı polish
- [ ] unlock / reward modal polish
- [ ] character milestone presentation final
- [ ] Level 90 boss presentation final
- [ ] ilk 10 level onboarding polish

## P1 — Map / progression

- [x] node/path map shell
- [x] current/unlocked progression mantığı
- [x] RUSH marker
- [x] character milestone goals
- [x] scalable nearby-node rendering
- [ ] locked/current/completed görsel ayrımı final kalite kontrolü
- [ ] boss node görsel final
- [ ] high-progress navigation gerçek cihaz testi

## P1 — PWA / cache discrepancy

- [x] manifest/service-worker dosyaları mevcut
- [ ] `index.html` açılışta Poma Shift service worker/cache temizlediği için offline iddiası netleştirilmeli
- [ ] release kararı: PWA cache gerçekten açık mı kapalı mı tek kaynağa bağlanmalı

## P0 — Real player validation

### İç kör test
- [ ] 5–10 kişi
- [ ] ilk 3 dakika müdahale yok
- [ ] ilk hamle süresi
- [ ] first invalid drop
- [ ] first clear
- [ ] first SHIFT
- [ ] fail nedeni
- [ ] restart davranışı

### Küçük dış test
- [ ] 20–50 oyuncu
- [ ] Level 1 completion ≥ %70
- [ ] Level 1 complete → Level 2 start ≥ %70
- [ ] Level 3 reach ≥ %50
- [ ] fail sonrası restart ≥ %40
- [ ] fairness adjustment < %10 batch

## Launch rule

Launch öncesi yeni feature eklenmez.

Öncelik:

> regression PASS → premium polish → production ad/analytics → gerçek oyuncu testi → data-driven tuning → store release.
