# POMA SHIFT — LOFT CORE V2

**Status:** FINAL / LOCKED CORE REVISION  
**Date:** 2026-08-08  
**Scope:** Core board geometry, LOFT pressure, gameplay character presence, power presentation

Bu dosya 2026-08-08 tarihinde alınan yeni ürün kararını kaydeder.

Bu karar, eski dokümanlardaki şu yönü **geçersiz kılar**:

> SHIFT sırasında boardun yanlardan +1 kolon büyümesi.

Eski `6×12 → 7×11 → ... → 12×6` board-morph zinciri artık **aynı level içinde genişleme kuralı değildir**. Eski stage değerleri yalnız level başlangıç geometrisi / LOFT derinlik basamağı olarak kullanılabilir.

---

## 1. CORE IDENTITY — LOCKED

Poma Shift'in yeni çekirdek kimliği:

> **3-piece shape placement + yatay satır clear + yukarıdan inen LOFT + karakter güçleri**

Oyuncunun ana baskısı tek yönden gelir:

> **LOFT yukarıdan aşağı iner.**

Normal level içinde sağdan/ soldan board büyümesi veya daralması yoktur.

---

## 2. BOARD GEOMETRY — LOCKED

Bir level başladığında:
- levelin başlangıç kolon sayısı belirlenir
- bu kolon sayısı level boyunca **sabit kalır**
- SHIFT olduğunda kolon eklenmez
- yalnız üstten kullanılabilir satır kaybedilir
- hücre ölçüsü SHIFT sırasında büyüyüp küçülmez
- boardun alt hattı görsel olarak sabit tutulur; LOFT üstten aşağı yaklaşır

Örnek:

- Level 1 `6×12` başlıyorsa: `6×12 → 6×11 → 6×10 ...`
- `7×11` başlayan bir level: `7×11 → 7×10 → 7×9 ...`
- `8×10` başlayan bir level: `8×10 → 8×9 → 8×8 ...`

Amaç:
- tehdidi tek bakışta anlaşılır yapmak
- kenar büyümesinin yarattığı görsel/mekanik karmaşayı kaldırmak
- LOFT'u oyunun imza mekaniği haline getirmek

---

## 3. SHIFT / LOFT — LOCKED

- her 3 gerçek yatay satır clear = 1 SHIFT
- SHIFT geldiğinde LOFT 1 satır aşağı iner
- normal levelde üst gerçek 1 danger row güvenli olmalıdır
- RUSH levelde üst gerçek 2 danger row güvenli olmalıdır
- danger bölgesinde korunmamış blok varsa fail reason mevcut `morph_crush` koduyla uyumluluk için korunabilir; oyuncuya gösterilen dil **LOFT / tavan çarpması** olmalıdır
- Bilgisayar gücü aktifken LOFT inişi 10 hamle durur; eski “board daralması” dili kullanılmaz

LOFT fiziksel olarak görünmelidir:
- board üstünde mekanik / enerji tavanı
- aşağı oklar
- warning / critical state
- SHIFT anında aşağı iniş hissi

---

## 4. BLOCK / TOKEN VISUAL DIRECTION — LOCKED

Core hücre matematiği kare grid olarak kalır.

Ancak kullanıcıya görünen parçalar düz/jenerik renkli küp olarak kalmaz.

Altı temel token ailesi:
- sarı: yıldız
- yeşil: yaprak
- mavi: damla
- pembe: kalp / petal
- mor: kristal
- turuncu: enerji / alev

Kural:
- renk + ikon/siluet birlikte ayrım sağlar
- tokenlar aynı premium casual sanat dilinde olur
- teknik hitbox kare hücre olarak kalır
- token görseli gameplay okunabilirliğini bozmaz
- Poma karakter yüzü/logo blokların üstüne basılmaz

---

## 5. ACTIVE LEVEL CHARACTER — LOCKED

Gameplay ekranında tek aktif karakter bulunur.

Karakter bandı:
- Level 1–9: Poma
- Level 10–19: Poma Dahi
- Level 20–29: Influencer Poma
- Level 30–39: Okçu Poma
- Level 40–49: Bozkurt Poma
- Level 50–59: Baby Poma
- Level 60–69: Dede Poma
- Level 70–79: Fire Poma
- Level 80–89: PomaHero
- Level 90 boss: aktif hero PomaHero; Sugar Cloud ayrı boss tehdididir

Karakter boardu kapatmaz.
Karakter kompakt HUD/board üstü alanda görünür.

---

## 6. CHARACTER REACTION / CAST SYSTEM — LOCKED

Karakter dekor değildir.

Aktif karakter şu olaylarda tepki verir:
- idle
- danger / LOFT yaklaşması
- özel güç kullanımı
- güçlü combo
- win
- lose

Normal her parça yerleştirmesinde büyük karakter animasyonu oynatılmaz.

### Power presentation
Bir güç kullanıldığında:
1. aktif karakter kısa cast / hazırlık hareketi yapar
2. efekt karakterden boarda doğru çıkar
3. board mekanik sonucu uygular
4. hit / impact feedback görünür

Karakterin kendi imza gücü kullanıldığında signature cast kullanılır.
Diğer loadout güçlerinde aynı karakter daha kısa generic assist cast yapabilir.

Örnek signature castler:
- Poma Dahi + Bilgisayar: cihaz/enerji aktivasyonu
- Influencer Poma + Telefon: telefon / flaş / sparkle
- Okçu Poma + Ok: yayı germe → ok çıkışı → board impact
- Dede Poma + Asa: asayı kaldırma / vurma → büyü dalgası
- Fire Poma + Alev Dalgası: karakterden board üst bölgesine alev sweep
- PomaHero + Sihirli Yaprak: yaprak enerjisi → tüm board clear

Animasyon hedefi:
- normal cast: yaklaşık 0.35–0.60 sn
- büyük güç: yaklaşık 0.70–1.00 sn
- win/lose pose: yaklaşık 1.0–1.5 sn

Gameplay akışı uzun animasyon beklemez.

---

## 7. IMPLEMENTATION RULE

Kod geçişi geriye uyumlu yapılır:
- mevcut level generator korunur
- `stageIndex` / danger-row / RUSH entegrasyonu mümkün olduğunca korunur
- aynı level içinde kolon ekleme kaldırılır
- LOFT yalnız satır basıncı olarak uygulanır
- yeni karakter presentation katmanı core puzzle hesabından ayrı tutulur
- asset gelmezse kod fallback görsellerle oynanabilir kalır

---

## 8. SPECIAL / FUTURE LEVELS

Yanlardan kapanma tamamen çöpe atılmaz.

Ancak standart core kuralı değildir.

İleride yalnız:
- boss saldırısı
- hard event
- özel challenge

gibi açıkça anlatılan özel mekanik olarak geri gelebilir.

---

## 9. SUCCESS CRITERIA

Bu revizyonun amacı:
- oyunun “banal / effectsiz / kimliksiz” algısını düşürmek
- LOFT'u tek ve güçlü tehdit olarak okunur yapmak
- karakterleri gameplay içine işlevsel biçimde sokmak
- core matematiği gereksiz yere yeniden icat etmeden game feel ve marka bağını yükseltmek

Bu yön gerçek oyuncu testi ve retention verisi gelene kadar yeni standarttır.
