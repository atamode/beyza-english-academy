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
| 1–10 | Atkısız Poma | özel güç yok |
| 20 | Poma Dahi | Bilgisayar |
| 30 | Influencer Poma | Telefon |
| 40 | Okçu Poma | Ok |
| 50 | Bozkurt Poma | Kurt Pençesi |
| 60 | Baby Poma | Emzik Salyası |
| 70 | Dede Poma | Asa Gücü |
| 80 | Hero Poma | Sihirli Yaprak |
| 90 | Yapışkan Şeker Bulutu | ilk boss |

Karakter milestone'u ilk kez tamamlandığında:
- eşya kilidi açılır
- ilk kullanımdan 1 adet ücretsiz verilir
- sonraki kullanımlar Coin ile alınır

---

## 3. BOOSTER EFFECTS — LOCKED

### Baby Poma — Emzik Salyası
- oyuncu 1 dolu kare seçer
- o kare silinir

### Bozkurt Poma — Kurt Pençesi
- oyuncu 1 dolu kare seçer
- seçilen kare + bitişik 1 dolu kare silinir
- toplam 2 kare

### Influencer Poma — Telefon
- board'un üst bölgelerindeki en tehlikeli 3 dolu kare silinir

### Okçu Poma — Ok
- board üzerindeki en üst 4 dolu kare silinir

### Poma Dahi — Bilgisayar
- board daralması 10 hamle durur
- SHIFT sayılır; board morph uygulanmaz

### Dede Poma — Asa Gücü
- mevcut board yeniden oynanabilir düzene taşınır

### Hero Poma — Sihirli Yaprak
- board üzerindeki bütün mevcut bloklar temizlenir
- en güçlü / en pahalı güç

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
| Sihirli Yaprak | 2.000 Coin |

### Poma Güç Paketi
- fiyat: **3.500 Coin**
- Dede Poma / Asa açıldıktan sonra satışa açılır
- Yaprak hariç ilk 6 boosterın her birinden 1 adet verir
- Yaprak pakete dahil değildir

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
- **1 rastgele açılmış karakter eşyası**

Henüz eşya açılmadıysa 100 Coin verilir; kilitli karakter eşyası verilmez.

Ağırlıklar açılmış havuz içinde normalize edilir:
- Emzik Salyası: %40
- Telefon: %25
- Ok: %15
- Bilgisayar: %10
- Asa: %7
- Kurt Pençesi: %2
- Sihirli Yaprak: %1

Hero Poma açılmadan Sihirli Yaprak havuza giremez.
Aynı kural tüm karakter eşyaları için geçerlidir.

---

## 10. BOSS SYSTEM — LOCKED

### First Boss
**Level 90 — Yapışkan Şeker Bulutu**

Davranış:
- level başladığında aktiftir
- her **3 saniyede 1 kare** kapatır
- Şeker Bulutu kareleri normal satır temizleme ve uygun karakter güçleriyle temizlenebilir
- Şeker Bulutu tavana ulaştığında oyun biter

İleri Şeker Bulutu varyasyonları:
- daha tehlikeli üst satırlara bias verilebilir
- ana interval / davranış parametreleri update ile zorlaştırılabilir

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
- `meta-system.js` — Coin, can, booster, rewarded/interstitial hooks, milestone, boss, scalable map
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
- karakter milestone sırası
- booster ana etkileri
- booster fiyatları
- 3 can limiti
- continue +3 hamle / 5 reklam limiti
- ilk boss Level 90
- 30-level boss slot düzeni
- 12 saat hediyesi

Değişiklik ancak gerçek oyuncu verisi veya teknik zorunlulukla yapılır.
