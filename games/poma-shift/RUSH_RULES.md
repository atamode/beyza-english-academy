# POMA SHIFT — RUSH RULES

**Status:** LOCKED  
**Authority:** Bu dosya RUSH davranışı için `GAME_SPEC.md` içindeki eski tray-timer kurallarının yerine geçer.

## 1. RUSH nedir?

RUSH ayrı bir oyun değildir. Aynı Poma Shift core motorunun süre baskısı altındaki zor bölümüdür.

Korunan core:
- 3 parçalık batch
- yalnız yatay tam satır clear
- her 3 temizlenen satır = 1 SHIFT
- board morph: +1 kolon / -1 satır
- combo sistemi
- booster / Poma güçleri

## 2. Hangi leveller RUSH?

- İlk RUSH: Level 11
- Sonra: 15, 20, 25, 30... her 5 levelde bir
- Boss slotları RUSH değildir; Level 90 ve sonraki 30-level boss slotları kendi boss kuralını kullanır.

## 3. Eski tray timer iptal

Eski tasarımda ilk parça sonrası 7/6/5 saniyelik batch timer vardı. Süre dolunca eldeki parçalar yanıyor ve yeni batch geliyordu.

Bu mekanik kalıcı olarak kaldırıldı çünkü oyuncu bekleyerek yeni parça batch'i arayabiliyordu.

Yeni RUSH'ta:
- parçalar süre yüzünden yanmaz
- yeni batch yalnız mevcut 3 parça kullanıldığında gelir
- beklemek oyuncuya yeni parça kazandırmaz

## 4. Tüm level süreli

RUSH level başlamadan önce kural kartı gösterilir. Sayaç açıklama ekranında çalışmaz.

Oyuncu **BAŞLA** dediğinde sayaç başlar.

Başlangıç tuning'i:
- Level 11: 60 saniye, 2 SHIFT
- Level 15–24: 50 saniye, 3 SHIFT
- Level 25–49: 45 saniye, 3 SHIFT
- Level 50+: 40 saniye, 4 SHIFT

Bu süreler gerçek oyuncu verisiyle tune edilebilir; mekanik değişmez.

Süre `00:00` olduğunda hedef tamamlanmadıysa:

**GAME OVER — RUSH TIMEOUT**

## 5. Danger zone / Morph Crush

Normal level:
- SHIFT tetiklenmeden hemen önce üstteki gerçek 1 danger row kontrol edilir.
- Bu satırda temizlenmeyen blok varsa Morph Crush olur.

RUSH level:
- SHIFT öncesi üstteki gerçek 2 danger row kontrol edilir.
- Bu iki satırdan herhangi birinde temizlenmeyen blok varsa Morph Crush olur.

Önemli:
- kontrol line-clear gravity yeni boş satır oluşturmadan önceki gerçek tavana göre yapılır
- böylece alt satır temizleyerek tavandaki blokların otomatik kaçması engellenir
- tamamen doldurulup aynı hamlede temizlenen danger row blok sayılmaz
- Bilgisayar gücü board morph'u dondurduğu sürede Morph Crush uygulanmaz

Board geometrisi değişmez:

`6×12 → 7×11 → 8×10 → 9×9 → 10×8 → 11×7 → 12×6`

RUSH iki danger row kullanır ama fiziksel olarak iki satır birden silmez.

## 6. RUSH giriş kartı

RUSH başlamadan önce gösterilir:
- ⚡ RUSH etiketi
- level numarası
- toplam süre
- 2 danger row kuralı
- hedef SHIFT sayısı
- karakter milestone'u varsa ilgili Poma / eşya ödülü
- BAŞLA düğmesi

Normal level doğrudan başlar.

## 7. Karakter milestone'ları

RUSH karakter ve booster sisteminin doğal challenge alanıdır.

Milestone RUSH levelleri:
- 20: Poma Dahi / Bilgisayar
- 30: Influencer Poma / Telefon
- 40: Okçu Poma / Ok
- 50: Bozkurt Poma / Kurt Pençesi
- 60: Baby Poma / Emzik Salyası
- 70: Dede Poma / Asa
- 80: Hero Poma / Sihirli Yaprak

Milestone giriş kartı ödülü gösterir. Mevcut ekonomi kuralı korunur: eşya milestone ilk kez tamamlandıktan sonra açılır.

## 8. Adalet kuralları

RUSH clock:
- açıklama kartında çalışmaz
- uygulama arka plana alınırsa durur
- oyuncu geri geldiğinde kalan süreden devam eder
- aktif RUSH sırasında harita / mağaza / can / hediye modalları açılmaz
- oyuncunun envanterinde olan booster kullanılabilir

Reklam veya oyun dışı UI yüzünden oyuncu süre kaybetmez.

## 9. Telemetry

Ek eventler:
- `rush_intro_shown`
- `rush_start`
- `rush_timeout`
- `rush_complete`
- `morph_crush_danger_zone`

Ölçülecek:
- ilk RUSH completion
- kalan süre
- RUSH fail reason dağılımı
- Morph Crush oranı
- RUSH sonrası sonraki levele geçiş

## 10. Değişiklik kuralı

Aşağıdakiler veri olmadan yeniden tasarlanmaz:
- tüm levelin süreli olması
- tray timer olmaması
- RUSH'ta 2 danger row
- normalde 1 danger row
- kural kartı → BAŞLA → timer akışı

Yalnız süre ve hedef SHIFT sayıları gerçek oyuncu verisiyle tune edilebilir.
