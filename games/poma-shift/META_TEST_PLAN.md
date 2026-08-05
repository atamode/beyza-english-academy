# POMA SHIFT — META SYSTEM TEST PLAN

## Purpose
Coin, can, booster, reklam hook'u, milestone, scalable level generator ve boss katmanını store entegrasyonundan önce doğrulamak.

## Dev mode
Localhost'ta veya URL'ye `?dev=1` eklenince:

```js
PomaShiftMeta.dev.goto(90)
PomaShiftMeta.dev.unlockThrough(80)
PomaShiftMeta.dev.setCoins(10000)
PomaShiftMeta.dev.setLives(3)
PomaShiftMeta.snapshot()
```

Bu komutlar production ekonomi akışının yerine geçmez; yalnız test içindir.

---

## A. Regression — core motor

1. Level 1 aç.
2. 3-piece batch çalışmalı.
3. Yatay satır dolunca temizlenmeli.
4. 3 satır = SHIFT olmalı.
5. Board morph korunmalı.
6. Morph crush / no legal move / move limit fail türleri bozulmamalı.

PASS: Meta katman core placement / line clear davranışını değiştirmiyor.

---

## B. Long-level generator

Dev console:

```js
PomaShiftMeta.dev.goto(120)
PomaShiftMeta.dev.goto(1000)
PomaShiftMeta.dev.goto(5000)
PomaShiftMeta.dev.goto(10000)
```

Her levelde:
- board açılmalı
- target SHIFT finite / oynanabilir görünmeli
- shape generator çalışmalı
- move budget finite olmalı
- JS exception olmamalı

PASS: 10.000 level numarası motoru kırmıyor.

---

## C. Character unlocks

Sırayla milestone testleri:

- 20: Bilgisayar
- 30: Telefon
- 40: Ok
- 50: Kurt Pençesi
- 60: Emzik Salyası
- 70: Asa
- 80: Yaprak

Milestone ilk kez tamamlanınca:
- booster unlock olmalı
- inventory +1 olmalı
- win modalında karakter / eşya gösterilmeli

Eski milestone tekrar oynanırsa ikinci ücretsiz booster verilmemeli.

---

## D. Booster effects

### Emzik
- dolu kare seç
- yalnız 1 kare silinmeli
- inventory -1

### Kurt Pençesi
- bitişik dolu karesi olan hücre seç
- toplam 2 kare silinmeli
- komşu yoksa item harcanmamalı

### Telefon
- üstteki 3 tehlikeli dolu kare silinmeli

### Ok
- en üstteki 4 dolu kare silinmeli

### Bilgisayar
- kullan
- 10 placed-piece boyunca SHIFT sayılmalı fakat board morph olmamalı
- sayaç bitince morph geri dönmeli

### Asa
- board doluluğu güvenli alt bölgelere yeniden dağılmalı
- oyun devam edebilmeli

### Yaprak
- bütün dolu kareler temizlenmeli

---

## E. Coin economy

İlk tamamlamada:
- normal: +5
- RUSH/hard: +10
- boss: +20

Aynı tamamlanmış level tekrar oynandığında +0 Coin.

Satın alma:
- Emzik 100
- Pençe 300
- Telefon 500
- Ok 700
- Bilgisayar 1100
- Asa 1600
- Yaprak 2000
- Güç Paketi 3500; yaprak vermemeli

---

## F. Lives

Yeni meta:
- 3/3 can

Her fail:
- 1 can düşmeli

0 can ilk tükenme:
- 1 dakikalık sayaç
- süre sonunda yalnız 1 can
- otomatik devam eden refill zinciri olmamalı

Aynı gün ikinci 0:
- 15 dk

Aynı gün üçüncü+:
- 30 dk

Rewarded:
- +1 can
- maksimum 3

Coin:
- 100 = +1
- 250 = +3, max 3

---

## G. Continue

Fail ekranında:
- rewarded continue butonu görünmeli
- 1 ad = state.moves üzerinden +3 efektif hamle
- aynı levelde sayaç 1/5 ... 5/5
- 5 sonrası buton kaybolmalı
- no-legal-move failinde yeni tray gelmeli

---

## H. Interstitial

- Level 1–4 sonrası tetiklenmemeli
- Level 5 tamamlandıktan sonra sonraki level açılmadan interstitial adapter çağrılmalı
- Level 6+ her tamamlamada çağrılmalı

Web test modunda TEST REKLAM overlay'i görünür.
Native provider bağlandığında aynı placement'lar gerçek SDK'ya gitmeli.

---

## I. 12-hour gift

Yeni hesapta 12 saatten önce claim yok.
Hazır olduğunda:
- +100 Coin
- yalnız açılmış booster havuzundan 1 item

Hiç booster açılmadıysa:
- +100 Coin
- item yok

Hero açılmadan Yaprak düşmemeli.

---

## J. Sugar Cloud — Level 90

```js
PomaShiftMeta.dev.unlockThrough(80)
PomaShiftMeta.dev.goto(90)
```

Beklenen:
- boss aktif mesajı
- her 3 saniyede 1 pembe/şeker kare
- şeker kare line clear ile temizlenebilir
- boosterlar şeker kareleri silebilir
- cloud tavana ulaştığında fail
- fail sırasında timer durmalı
- rewarded continue sonrası timer yeniden başlamalı

---

## K. Map

- Level 10/20/.../80 milestone markerları
- 90 Sugar Cloud markerı
- 120/150/180 future boss slotları
- yüksek progress'te 10.000 node aynı anda render edilmemeli
- ±50 navigasyon çalışmalı

---

## Release gate

Meta V1 store entegrasyonuna geçmeden önce:
- core regression PASS
- 1 / 20 / 80 / 90 / 120 / 1000 / 10000 smoke PASS
- console exception = 0
- continue 5-cap PASS
- Coin farm koruması PASS
- life timer PASS
- Sugar Cloud interval cleanup PASS
