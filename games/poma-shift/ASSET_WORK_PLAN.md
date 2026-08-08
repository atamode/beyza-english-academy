# POMA SHIFT — ASSET WORK PLAN

**Status:** ACTIVE  
**Date:** 2026-08-08  
**Purpose:** Kod tarafı ilerlerken paralel üretilecek görsel / animasyon assetleri

Bu dosya AI görsel üretiminde doğrudan brief olarak kullanılabilir.

---

# P0 — ÖNCE ÜRET

## A. Token Set — 6 adet

Ortak kurallar:
- transparent PNG
- 512×512 px
- tek obje, tam ortalı
- aynı kamera / ışık / materyal dili
- premium casual mobile game
- soft plastic / toy-like 3D
- yumuşak hacim, temiz kenar
- aşırı detay yok
- obje kare hücre içinde %78–84 alan kaplasın
- dış gölge PNG içine ağır basılmasın; kod tarafı glow/shadow ekleyebilir
- emoji görünümü değil, özgün oyun asseti

Dosyalar:
- `assets/tokens/token_star.png` — sarı yıldız
- `assets/tokens/token_leaf.png` — yeşil yaprak
- `assets/tokens/token_drop.png` — mavi damla
- `assets/tokens/token_heart.png` — pembe kalp / petal
- `assets/tokens/token_crystal.png` — mor kristal
- `assets/tokens/token_energy.png` — turuncu enerji / alev

### AI prompt ana yönü
“Premium casual mobile puzzle game token, soft plastic toy material, rounded friendly geometry, strong readable silhouette, centered single object, subtle glossy highlight, clean 3D render, transparent background, no text, no border, no scene, consistent family style.”

Her token için yalnız ana objeyi değiştir.

---

## B. LOFT mekanizması

LOFT artık oyunun ana tehdididir.

### İstenen parçalar
- `assets/loft/loft_bar.png`
- `assets/loft/loft_core.png`
- `assets/loft/loft_arrow.png`
- `assets/loft/loft_warning_glow.png`

### Görsel yön
- koyu lacivert / bronz-metal gövde
- mor / pembe enerji hattı
- ortada güçlü aşağı yön göstergesi
- premium casual, steampunk kadar karmaşık değil
- telefonda küçük görünürken okunaklı
- LOFT yazısını görselin içine basma; text kod tarafında kalacak
- yatay bar parçaları mümkünse ayrı PNG olsun ki farklı board genişliklerine stretch/compose edilebilsin

### Boyut
- bar: yaklaşık 1600×220 transparent PNG
- core: 512×512 transparent PNG
- arrow: 256×256 transparent PNG
- glow: 1024×256 transparent PNG

---

# P1 — KARAKTER GAMEPLAY POSE SETİ

## Ortak teknik kural

Her karakter:
- transparent PNG
- 1024×1024
- tam vücut veya minimum diz/ayak dahil
- silah / asa / telefon / aksesuar kadrajdan taşmasın
- aynı karakter tasarımı korunmalı
- aynı ölçek ve kamera açısı
- 3/4 açı, boarda doğru hafif sağ-alt yöne bakabilir
- arka plan, yazı, UI yok
- karakterin çevresinde baked glow minimum

Kod tarafı pose swap + CSS motion ile animasyon verecek. Bu nedenle tam video yerine **temiz key pose PNG** daha değerlidir.

## Her karakter için temel 5 pose

1. `idle`
2. `danger`
3. `cast_prepare`
4. `cast_release`
5. `win`
6. `lose`

İlk teslimde idle + cast_prepare + cast_release yeterlidir; win/lose ikinci tur olabilir.

---

## 1. Poma — Level 1–9

Dosya örnekleri:
- `assets/characters/poma_idle.png`
- `assets/characters/poma_danger.png`
- `assets/characters/poma_cast_prepare.png`
- `assets/characters/poma_cast_release.png`
- `assets/characters/poma_win.png`
- `assets/characters/poma_lose.png`

Cast yönü:
- elinde hafif enerji / yıldız ışığı toplanması
- generic assist cast olarak diğer güçlerde de kullanılabilir

---

## 2. Poma Dahi — Level 10–19

İmza güç: **Bilgisayar**

Pose:
- idle: akıllı / kendinden emin
- cast_prepare: bilgisayar / holografik ekran açar
- cast_release: ekrandan boarda koruma enerjisi yollar

Dosyalar:
- `genius_idle.png`
- `genius_cast_prepare.png`
- `genius_cast_release.png`

---

## 3. Influencer Poma — Level 20–29

İmza güç: **Telefon**

Pose:
- telefonu kaldırır
- kamera/flaş hazırlığı
- cast release anında güçlü ama kısa flash

Dosyalar:
- `influencer_idle.png`
- `influencer_cast_prepare.png`
- `influencer_cast_release.png`

---

## 4. Okçu Poma — Level 30–39

İmza güç: **Ok**

Bu ilk yüksek öncelikli signature animation assetidir.

Pose:
- idle: yay elinde, rahat duruş
- cast_prepare: yayı tam gerer, nişan alır
- cast_release: ip bırakılmış, ok fırlamış an

Dosyalar:
- `archer_idle.png`
- `archer_cast_prepare.png`
- `archer_cast_release.png`
- `assets/fx/arrow_projectile.png`
- `assets/fx/arrow_impact.png`

### Ok projectile
- transparent PNG
- yatay yön, ucu sağa bakar
- temiz okunur siluet
- 512×160 civarı
- hareket blur baked olmasın; kod animasyonu yapacak

---

## 5. Bozkurt Poma — Level 40–49

İmza güç: Kurt Pençesi

- `wolf_idle.png`
- `wolf_cast_prepare.png`
- `wolf_cast_release.png`
- `assets/fx/claw_slash.png`

---

## 6. Baby Poma — Level 50–59

İmza güç: Emzik Salyası

- `baby_idle.png`
- `baby_cast_prepare.png`
- `baby_cast_release.png`
- `assets/fx/pacifier_splash.png`

Ton sevimli kalmalı; iğrenç/slime-heavy görünmemeli.

---

## 7. Dede Poma — Level 60–69

İmza güç: **Asa Gücü**

Pose:
- idle: asa yanında
- cast_prepare: asayı yukarı kaldırır
- cast_release: asayı aşağı indirir / yere vurur

Dosyalar:
- `elder_idle.png`
- `elder_cast_prepare.png`
- `elder_cast_release.png`
- `assets/fx/staff_wave.png`
- `assets/fx/staff_impact_ring.png`

---

## 8. Fire Poma — Level 70–79

İmza güç: Alev Dalgası

- `fire_idle.png`
- `fire_cast_prepare.png`
- `fire_cast_release.png`

Mevcut fire wave kod efekti çalışmaya devam edeceği için ilk turda ekstra alev PNG zorunlu değil.

---

## 9. PomaHero — Level 80–89 / Boss 90 hero

İmza güç: Sihirli Yaprak

- `hero_idle.png`
- `hero_cast_prepare.png`
- `hero_cast_release.png`
- `assets/fx/leaf_projectile.png`
- `assets/fx/leaf_board_wave.png`

---

# P2 — ORTAK FX SETİ

Bunlar kod ile çoğunlukla üretilebilir; yalnız kaliteli asset çıkarsa eklenir.

- `assets/fx/token_pop.png`
- `assets/fx/combo_burst.png`
- `assets/fx/power_hit.png`
- `assets/fx/loft_dust.png`
- `assets/fx/win_sparkle.png`

Kural:
- transparent
- küçük ekranda okunur
- aşırı konfeti / casino hissi yok

---

# TESLİM SIRASI

## Paket 1 — en yüksek etki
1. 6 token
2. LOFT bar/core/arrow
3. Okçu Poma idle + prepare + release + arrow projectile

## Paket 2
4. Dede Poma idle + prepare + release
5. Influencer Poma idle + prepare + release
6. Poma Dahi idle + prepare + release

## Paket 3
7. Poma
8. Bozkurt
9. Baby
10. Fire
11. PomaHero
12. win/lose pose setleri

---

# ACCEPTANCE CHECK

Asset kabul edilmeden önce:
- transparent gerçekten transparent mi
- karakter/obje kadraj kesiliyor mu
- aynı seride ölçek değişiyor mu
- tokenlar 48–60 px seviyesine küçülünce hâlâ ayırt ediliyor mu
- ok / asa / telefon gibi aksesuarlar net mi
- çocuk uygulaması gibi ucuz görünmeden casual kalıyor mu
- mevcut koyu lacivert UI üzerinde kontrast yeterli mi

Bu dosyadaki dosya adları mümkün olduğunca korunur; böylece asset geldiğinde kod entegrasyonu hızlı yapılır.
