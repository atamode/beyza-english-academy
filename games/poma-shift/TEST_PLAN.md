# POMA SHIFT — PLAYTEST PLAN

**Status:** V0.3

## Amaç

Motorun oyuncuyu kendi isteğiyle sonraki levele taşıyıp taşımadığını ve yeni baskı sistemlerinin adil hissedip hissettirmediğini ölçmek.

## İlk test soruları

1. Oyuncu yardım almadan ilk parçayı koyabiliyor mu?
2. Tutorial hiçbir parçayı veya board alanını kapatıyor mu?
3. Satır clear mantığı anlaşılır mı?
4. SHIFT sonrası genişleme/alçalma anlaşılır mı?
5. Morph Crush nedeni anlaşılır mı?
6. Hamle limiti görünür ve anlaşılır mı?
7. 3'lü seri timer eğlenceli baskı mı, sinir bozucu baskı mı?
8. Shape bazlı sesler birbirinden hissedilir biçimde farklı mı?
9. SHIFT kesme sesi ve titreşimi tatmin edici mi?
10. Oyuncu kaybettikten sonra kendi isteğiyle yeniden oynuyor mu?

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
- ilk timer timeout
- ilk fail nedeni
- restart yaptı mı
- ulaştığı son level

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
- tray_timeout
- level_fail
- level_restart
- level_complete

Fail reason:
- no_legal_move
- morph_crush
- move_limit

---

## GO / NO-GO iç eşikleri

### Güçlü sinyal
- Level 1 completion: **≥ %70**
- Level 1 bitiren → Level 2: **≥ %70**
- Level 3'e ulaşma: **≥ %50**
- fail sonrası restart: **≥ %40**
- invalid drop ilk level sonrasında belirgin düşüyor
- fairness_adjustment batch oranı **< %10**

### Timer alarmı
- Level 2'de oyuncuların çoğu 7 saniyeyi rahat öğrenebilmeli
- Level 3+ 5 saniye timeout üretmeli ama oyunun ana fail sebebi olmamalı
- seri timeout yüzünden move-limit fail oranı aşırı yükselirse timer uzatılır veya ceza azaltılır

İlk alarm:
- batch'lerin **%30+**'unda tray_timeout → süre fazla agresif olabilir
- fail'lerin **%40+**'ı move_limit → hamle bütçesi fazla dar olabilir

### Adalet alarmı
- fairness_adjustment **%10+** → generator yeniden ayarlanır
- oyuncular “oyun taş vermedi” diyorsa generator sorunudur
- animasyon sırasında timer çalışması kabul edilmez
- harita açıkken / sekme arka plandayken timer çalışması kabul edilmez

---

## Game-feel kontrolü

### Placement
- tek kare yüksek/kısa “cik” okunuyor mu?
- 3/4 düz çubuk daha keskin çift “çıt” veriyor mu?
- kare blok daha tok hissediyor mu?

### Haptic
- normal placement rahatsız etmeyecek kadar kısa mı?
- line clear belirgin mi?
- SHIFT diğerlerinden açık biçimde daha güçlü mü?

### SHIFT
- kesme/noise efekti “tahta kesiliyor” hissi veriyor mu?
- efekt oyunu yavaşlatıyor mu?

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

Oyuncu ilerlemeyi yukarı tırmanma olarak görmelidir.

---

## İlk başarı tanımı

> Oyuncu süre ve hamle baskısına rağmen oyunu adil buluyor ve “bir tane daha” diyor.

Başarı değildir:
- Poma artwork
- reklam geliri
- Store build
- yüksek skor
- çok özellik