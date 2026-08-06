# POMA SHIFT — META / ECONOMY / BOSS SPEC

**Status:** V1 META LOCKED / IMPLEMENTATION TRACK  
**Scope:** `games/poma-shift/` çekirdek motorunun üst katmanı  
**Core rule:** Satır temizleme + SHIFT + board morph motoru değişmez.

---

## 1. LONG-RUN PRODUCT DIRECTION

Poma Shift kısa 80–100 bölümlük oyun değildir.

- hedef: binlerce / 10.000+ level taşıyan casual puzzle sistemi
- ilk 10 level elde ayarlı öğretim setidir
- level 11+ deterministik difficulty-wave generator ile üretilir
- ana core loop aynı kalır
- yeni içerik, karakter ve boss sistemleri güncelleme olarak eklenebilir
- harita performans için oyuncunun bulunduğu level çevresini render eder; 10.000 node aynı anda DOM'a basılmaz

---

## 2. CHARACTER MILESTONES — LOCKED

| Level | Karakter | Eşya / Güç |
|---:|---|---|
| 1–9 | Poma | özel güç yok |
| 10 | Poma Dahi | Bilgisayar |
| 20 | Influencer Poma | Telefon |
| 30 | Okçu Poma | Ok |
| 40 | Bozkurt Poma | Kurt Pençesi |
| 50 | Baby Poma | Emzik Salyası |
| 60 | Dede Poma | Asa Gücü |
| 70 | Fire Poma | Alev Dalgası |
| 80 | PomaHero | Sihirli Yaprak |
| 90 | Yapışkan Şeker Bulutu | ilk boss |

Poma oyunun başlangıç karakteridir. Arayüzde “Atkısız Poma” ifadesi kullanılmaz.

Karakter milestone'u ilk kez tamamlandığında:
- ilgili güç kilidi açılır
- ilk kullanımdan 1 adet ücretsiz verilir
- sonraki kullanımlar Coin ile alınır

---

## 3. BOOSTER EFFECTS — LOCKED

### Poma Dahi — Bilgisayar
- board daralması 10 hamle durur
- SHIFT sayılır; board morph uygulanmaz

### Influencer Poma — Telefon
- board'un üst bölgelerindeki en tehlikeli 3 dolu kare silinir

### Okçu Poma — Ok
- board üzerindeki en üst 4 dolu kare silinir

### Bozkurt Poma — Kurt Pençesi
- oyuncu 1 dolu kare seçer
- seçilen kare + bitişik 1 dolu kare silinir
- toplam 2 kare

### Baby Poma — Emzik Salyası
- oyuncu 1 dolu kare seçer
- o kare silinir

### Dede Poma — Asa Gücü
- mevcut board yeniden oynanabilir düzene taşınır

### Fire Poma — Alev Dalgası
- **LOFT bölgesindeki ilk 2 satırı tamamen yakar**
- boardun en üstteki ilk 2 satırındaki tüm bloklar silinir
- görsel efekt: alev yukarıdan iki satırı süpürür; bloklar kül partikülleriyle kaybolur
- güçlüdür fakat PomaHero / Sihirli Yaprak'tan daha güçlü değildir

### PomaHero — Sihirli Yaprak
- board üzerindeki bütün mevcut bloklar temizlenir
- oyundaki **en güçlü / en pahalı güç**

---

## 4. BOOSTER PRICES — LOCKED

| Güç | Fiyat |
|---|---:|
| Emzik Salyası | 100 Coin |
| Kurt Pençesi | 300 Coin |
| Telefon | 500 Coin |
| Ok | 700 Coin |
| Bilgisayar | 1.100 Coin |
| Asa Gücü | 1.600 Coin |
| Alev Dalgası | 1.800 Coin |
| Sihirli Yaprak | 2.000 Coin |

### Poma Güç Paketi
- fiyat: **3.500 Coin**
- Dede Poma / Asa açıldıktan sonra satışa açılır
- mevcut ilk 6 klasik boosterın her birinden 1 adet verir
- Alev Dalgası ve Sihirli Yaprak pakete dahil değildir

---

## 5. COIN ECONOMY — LOCKED

İlk tamamlamada:
- normal level: **5 Coin**
- zor / RUSH level: **10 Coin**
- boss / challenge: **20 Coin**

Eski tamamlanmış leveli tekrar oynamak Coin farm üretmez.
Coin ödülü yalnız ilk tamamlamada verilir.

---

## 6. LIFE SYSTEM — LOCKED

- maksimum can: **3**
- ilk kurulum: **3 can**
- can yalnız başarısız level sonunda azalır
- aynı anda 3'ten fazla can taşınmaz

Canlar sıfıra indiğinde aynı gün içindeki tükenme sırasına göre:
1. ilk tükenme: **1 dakika** sonra 1 otomatik can
2. ikinci tükenme: **15 dakika** sonra 1 otomatik can
3. üçüncü ve sonraki tükenmeler: **30 dakika** sonra 1 otomatik can

Bu sayaç yerel saat 00:00'da günlük olarak sıfırlanır.
Otomatik can verildikten sonra sürekli 30 dakikalık refill zinciri çalışmaz.
Oyuncu yeniden sıfıra indiğinde yeni bekleme başlar.

### Can satın alma
- 1 can = **100 Coin**
- 3 can = **250 Coin**

### Rewarded can
- 1 rewarded reklam = **+1 can**
- günlük reklam limiti yok
- maksimum stok yine 3 can

---

## 7. CONTINUE ADS — LOCKED

Başarısız levelde:
- 1 rewarded reklam = **+3 hamle**
- aynı levelde maksimum **5 continue reklamı**
- maksimum reklamlı ek hamle = **15 hamle**
- rewarded continue aynı oyun denemesinin devamıdır; ilk failde düşen can dışında aynı continue zincirinde ikinci kez can düşmez

`no_legal_move` failinde +3 hamlenin kullanılabilir olması için ölü tray yeni batch ile değiştirilir.
Bu yalnız continuation repair'dir; ekstra booster değildir.

---

## 8. INTERSTITIAL — LOCKED

- Level 1–4: interstitial yok
- Level 5 tamamlandıktan itibaren:
  - her tamamlanan levelden sonra 1 interstitial gösterim noktası

Kodda reklam provider adapter kullanılır.
Web prototipte test stub vardır.
Store sürümünde gerçek reklam SDK'sı adapterın yerine bağlanacaktır.

---

## 9. 12-HOUR RETURN GIFT — LOCKED

Her claim sonrası 12 saat cooldown:
- **100 Poma Coin**
- **1 rastgele açılmış klasik karakter eşyası**

Henüz eşya açılmadıysa 100 Coin verilir; kilitli karakter eşyası verilmez.

V1 weighted pool:
- Emzik Salyası: %40
- Telefon: %25
- Ok: %15
- Bilgisayar: %10
- Asa: %7
- Kurt Pençesi: %2
- Sihirli Yaprak: %1

Alev Dalgası V1 return-gift havuzunda değildir; Fire Poma milestone ücretsiz kullanımı ve mağaza satın alımı üzerinden yönetilir.
PomaHero açılmadan Sihirli Yaprak havuza giremez.

---

## 10. BOSS SYSTEM — LOCKED

### First Boss
**Level 90 — Yapışkan Şeker Bulutu**

Davranış:
- level başladığında aktiftir
- her **3 saniyede 1 kare** kapatır
- Şeker Bulutu kareleri normal satır temizleme ve uygun karakter güçleriyle temizlenebilir
- Şeker Bulutu tavana ulaştığında oyun biter

### Future boss slots
Level 90'dan sonra her **30 levelde bir boss slotu** vardır:
- 120
- 150
- 180
- 210
- ...

V1 lansmanı için yalnız Şeker Bulutu bossu zorunludur.
Yeni boss karakterleri ve hikâyeleri lansman sonrası update ile bu slotlara eklenebilir.
Boss içeriği henüz hazır olmayan slot oyuncunun ilerlemesini kesmez; mevcut generator challenge level üretir.

---

## 11. MAP / IP RULE

Harita:
- karakter milestone'larını ikonla gösterir
- boss slotlarını ayrı işaretler
- aktif level çevresini render ederek 10.000+ level performansını korur

Poma karakterleri casual oyunun IP / progression katmanıdır.
Oyun yalnız çocuklara yönelik konumlanmaz; geniş casual kitle hedeflenir.

---

## 12. IMPLEMENTATION FILES

Meta katman:
- `meta-system.js` — Coin, can, klasik booster, rewarded/interstitial hooks, boss, scalable map
- `character-progression-v2.js` — güncel milestone sırası + Fire Poma / Alev Dalgası
- `character-art.js` / `character-art.css` — milestone karakter görselleri + Fire efektleri
- `meta-system.css` — meta HUD / shop / booster / map / test ad UI

Reklam entegrasyon kontratı:

```js
window.PomaShiftAds = {
  rewarded: async (placement) => true,
  interstitial: async (placement) => true,
};
```

Gerçek native reklam providerı bu kontratı uygulamalıdır.

---

## 13. DO NOT REOPEN WITHOUT DATA

Aşağıdakiler artık yeniden sıfırdan tasarlanmaz:
- satır clear kuralı
- SHIFT core
- board morph
- 3-piece batch
- karakter milestone sırası: **Poma → Dahi 10 → Influencer 20 → Okçu 30 → Bozkurt 40 → Baby 50 → Dede 60 → Fire Poma 70 → PomaHero 80 → Boss 90**
- booster ana etkileri
- booster fiyatları
- PomaHero'nun en güçlü karakter/güç olması
- 3 can limiti
- continue +3 hamle / 5 reklam limiti
- ilk boss Level 90
- 30-level boss slot düzeni
- 12 saat hediyesi

Değişiklik ancak gerçek oyuncu verisi veya teknik zorunlulukla yapılır.
