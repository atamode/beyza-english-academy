# POMA SHIFT — PLAYTEST PLAN

**Status:** V0.5 / RUSH LOCKED / DEVICE QA READY

## Amaç

Motorun oyuncuyu kendi isteğiyle sonraki levele taşıyıp taşımadığını; SHIFT, danger zone ve RUSH baskısının adil hissedip hissettirmediğini ölçmek.

## İlk test soruları

1. Oyuncu yardım almadan ilk parçayı koyabiliyor mu?
2. Tutorial hiçbir parçayı veya board alanını kapatıyor mu?
3. Satır clear mantığı anlaşılır mı?
4. SHIFT sonrası genişleme/alçalma anlaşılır mı?
5. Normal levelde üstteki 1 danger row'un Morph Crush riski anlaşılır mı?
6. Hamle limiti görünür ve anlaşılır mı?
7. RUSH giriş kartı okunuyor mu ve BAŞLA denmeden clock'un başlamadığı anlaşılıyor mu?
8. RUSH'ta 2 danger row kuralı anlaşılır mı?
9. Shape bazlı sesler ve SHIFT efekti yeterince güçlü mü?
10. Oyuncu kaybettikten sonra kendi isteğiyle yeniden oynuyor mu?

---

## Android QA debug — 5 dakikalık smoke

Bu akış yalnız **debug / Google test-ad native QA build** içindir. Production release buildde `QA` paneli ve `Leveli Bitir` kısayolu görünmemelidir.

### Hazırlık
1. En güncel `poma-shift-android-debug` APK'yı kur.
2. Uygulamayı aç; yaşayan lobby görünmeli.
3. Küçük `QA` toggle görünmeli.
4. `QA → Meta Reset` ile temiz state başlat.

### A — Level 1 / sonuç akışı
1. Level 1'i aç ve normal oynanışın dokunma/sürükleme çalıştığını kontrol et.
2. Sonuç ekranında tek ana Poma kuralını kontrol et:
   - win = mutlu Poma
   - fail = üzgün Poma
3. `Haritaya Bak` yaşayan lobby'ye dönmeli.

### B — Level 11 RUSH
1. `QA → 11`.
2. RUSH giriş kartı görünmeli.
3. `BAŞLA` öncesi clock ilerlememeli.
4. `BAŞLA` sonrası süre **60 sn** ve hedef **2 SHIFT** olmalı.
5. Legacy 5 saniyelik tray timer görünmemeli/çalışmamalı.
6. Uygulamayı kısa süre arka plana alıp dön; full-level clock background sırasında ilerlememeli.

### C — Level 70 Fire Poma / Alev Dalgası
1. Temiz first-clear için gerekirse `Meta Reset` yap.
2. `QA → 70`.
3. RUSH kartında milestone **Fire Poma / Alev Dalgası** olmalı.
4. `BAŞLA`.
5. `QA → Leveli Bitir`.
6. Sonuçta `YENİ GÜÇ AÇILDI` → **Fire Poma / Alev Dalgası** görünmeli.
7. `MAĞAZADA GÖR` → Alev Dalgası detayında `Stok: ×1` görünmeli.
8. `SLOTA EKLE` → sonraki leveli başlat; oyun içi 3 slotta Alev Dalgası görünmeli.
9. Gücü kullan; alev efekti üstten gelmeli ve yalnız boardun ilk 2 satırını temizlemeli.

### D — Level 80 PomaHero / Sihirli Yaprak
1. Temiz first-clear için gerekirse `Meta Reset` yap.
2. `QA → 80`.
3. RUSH kartında milestone **PomaHero / Sihirli Yaprak** olmalı.
4. `BAŞLA`.
5. `QA → Leveli Bitir`.
6. Sonuçta `YENİ GÜÇ AÇILDI` → **PomaHero / Sihirli Yaprak** görünmeli.
7. `MAĞAZADA GÖR` → detayda `Stok: ×1` görünmeli.
8. `SLOTA EKLE` → sonraki leveli başlat; oyun içi slotta Sihirli Yaprak görünmeli.
9. Gücü kullan; bütün board temizlenmeli.

### E — Level 90 Yapışkan Şeker Bulutu
1. `QA → 90`.
2. Boss hazırlığında gerçek Sugar Cloud artwork + 3 slot + `her 3 saniyede 1 kare` bilgisi görünmeli.
3. `BOSSA BAŞLA` sonrası boss HUD görünmeli.
4. Şeker Bulutu yaklaşık her 3 saniyede bir kareyi yapıştırmalı.
5. Fail sonucu: tek üzgün Poma + kompakt `Şeker Bulutu hâlâ burada` boss kartı.
6. Win sonucu QA `Leveli Bitir` ile hızlı doğrulanabilir: tek mutlu Poma + `Şeker Bulutu dağıldı!`.
7. `Haritaya Bak` yaşayan lobby'ye dönmeli.

### F — reklam / analytics hızlı kontrol
1. Test rewarded reklamı açılabiliyorsa bir kez continue reklamı tamamla; +3 hamle gelmeli.
2. Reklam dönüşünde oyun input'u kilitlenmemeli.
3. Lobby `Analitik` ayarı açılmalı; Reddet seçilince oyun çalışmaya devam etmeli.
4. Kabul Et seçilince UI kilitlenmemeli; consent kartı gameplay/result üstüne taşmamalı.
5. `QA → KPI` local özet üretmeli.

### QA build güvenlik kuralı
- `Leveli Bitir` yalnız `nativeQaBuild` test modunda bulunur.
- Production/release AAB'de QA panelinin görünmesi **release blocker**dır.
- QA shortcut gerçek oyuncu tuning verisi üretmek için kullanılmaz; yalnız smoke/debug hızlandırmasıdır.

---

## Aşama A — İç test

Hedef: **5–10 kişi**.

Kurallar:
- oyunu açıklama
- telefonu ver
- ilk 3 dakika müdahale etme
- nerede duraksadığını izle

Özellikle kaydet:
- ilk hamle süresi
- ilk invalid drop
- ilk line clear
- ilk SHIFT
- ilk Morph Crush
- ilk fail nedeni
- restart yaptı mı
- ulaştığı son level
- Level 11'e geldiyse RUSH kartını okuyup okumadığı
- ilk RUSH sonucu ve kalan süre

---

## Aşama B — Küçük dış test

Hedef: **20–50 oyuncu**.

Eventler:
- session_start
- level_start
- tray_dealt
- piece_placed
- invalid_drop
- line_clear
- shift
- fairness_adjustment
- level_fail
- level_restart
- level_complete
- line_combo
- rush_intro_shown
- rush_start
- rush_timeout
- rush_complete
- morph_crush_danger_zone

Fail reason:
- no_legal_move
- morph_crush
- move_limit
- rush_timeout

---

## GO / NO-GO iç eşikleri

### Güçlü sinyal
- Level 1 completion: **≥ %70**
- Level 1 bitiren → Level 2: **≥ %70**
- Level 3'e ulaşma: **≥ %50**
- fail sonrası restart: **≥ %40**
- invalid drop ilk level sonrasında belirgin düşüyor
- fairness_adjustment batch oranı **< %10**

### RUSH alarmı
- Level 11 öncesinde süre baskısı YOK
- Level 11 giriş kartı → BAŞLA → 60 saniye / 2 SHIFT
- 15–24: 50 saniye / 3 SHIFT
- 25–49: 45 saniye / 3 SHIFT
- 50+: 40 saniye / 4 SHIFT
- eski 7/6/5 saniyelik tray timer kesinlikle çalışmamalı
- süre dolduğu için eldeki parçalar yanmamalı / yeni batch gelmemeli
- RUSH timeout ana fail sebebi olup oyuncuyu tamamen bırakmaya itiyorsa süre artırılır
- ilk RUSH completion çok düşükse önce süre tune edilir; mekanik değiştirilmez

### Adalet alarmı
- fairness_adjustment **%10+** → generator yeniden ayarlanır
- oyuncular “oyun taş vermedi” diyorsa generator sorunudur
- uygulama arka plandayken RUSH clock çalışmaz
- RUSH giriş kartında clock çalışmaz
- aktif RUSH sırasında harita / mağaza / can / hediye modalı açılamaz
- envanterde mevcut booster RUSH sırasında kullanılabilir

---

## Danger zone / Morph Crush kontrolü

### Normal level
- 3. satır clear SHIFT'i tetikleyecekse line-clear gravity uygulanmadan önce gerçek üst satır kontrol edilir
- üstteki 1 danger row'da temizlenmeyen blok varsa Morph Crush
- alt satır silinince oluşan yeni boş satır oyuncuyu sahte şekilde kurtarmamalı
- danger row tamamen dolu olup aynı hamlede gerçekten temizleniyorsa bu bloklar crush sayılmamalı

### RUSH level
- aynı kontrol üstteki **2 danger row** için yapılır
- iki satırdan herhangi birinde temizlenmeyen blok varsa Morph Crush
- board geometrisi yine yalnız +1 kolon / -1 satır değişir; iki satır fiziksel olarak birden silinmez

### Bilgisayar gücü
- board morph dondurulduğu sürede Morph Crush uygulanmamalı
- SHIFT sayılmalı, board sabit kalmalı

---

## RUSH giriş kartı kontrolü

Beklenen:
- yalnız RUSH levelde çıkar
- level ve süre görünür
- 2 danger row kuralı görünür
- hedef SHIFT sayısı görünür
- BAŞLA düğmesi vardır
- BAŞLA öncesi canvas oynanamaz / overlay arkayı kapatır
- BAŞLA anında level süresi ve level duration ölçümü başlar

Milestone RUSH — locked progression:
- 20: Influencer Poma / Telefon
- 30: Okçu Poma / Ok
- 40: Bozkurt Poma / Kurt Pençesi
- 50: Baby Poma / Emzik Salyası
- 60: Dede Poma / Asa Gücü
- 70: Fire Poma / Alev Dalgası
- 80: PomaHero / Sihirli Yaprak

Kart, milestone ödülünü gösterir; eşya mevcut ekonomi kuralına göre level ilk kez tamamlandıktan sonra açılır.

Boss level 90 ve sonraki 30-level boss slotları RUSH olarak başlamamalı.

---

## Game-feel kontrolü

### Placement
- tek kare yüksek/kısa “cik” okunuyor mu?
- 3/4 düz çubuk daha keskin çift “çıt” veriyor mu?
- kare blok daha tok hissediyor mu?

### Line clear / combo
- line clear sesi müzik altında kaybolmuyor mu?
- ardışık clear'da combo fark ediliyor mu?
- müzik önemli SFX sırasında duck oluyor mu?

### SHIFT
- kesme/noise efekti “tahta kesiliyor” hissi veriyor mu?
- tehlike satırları okunuyor mu?
- efekt oyunu yavaşlatıyor mu?

### RUSH
- son %30 sürede clock görsel/ses baskısı yeterli mi?
- baskı paniğe dönüyor ama kontrol hissini tamamen yok etmiyor mu?

---

## Tutorial kontrolü

Level 1 açıklaması:
- canvas üstünde overlay değildir
- şekilleri kapatmaz
- board'u kapatmaz
- toolbar ile oyun alanı arasında ayrı şerittir

Bu koşullardan biri bozulursa tutorial yeniden konumlandırılır.

---

## Level map kontrolü

Beklenen yön:

**Level 1 altta → yüksek leveller yukarıda.**

- RUSH node'ları ⚡ ile ayrılır
- boss node'ları RUSH işareti almaz
- milestone markerları korunur

---

## İlk başarı tanımı

> Oyuncu normal levelde alanı yönetiyor; RUSH'ta aynı oyunun daha sert ama adil versiyonunu hissediyor ve “bir tane daha” diyor.

Başarı değildir:
- yalnız Poma artwork
- yalnız reklam geliri
- Store build
- yüksek skor
- çok özellik
