# POMA SHIFT — PLAYTEST PLAN

**Status:** V0.1.2

## Amaç

Bu testin amacı oyunun güzel görünüp görünmediğini değil, çıplak motorun oyuncuyu kendi isteğiyle bir sonraki levele taşıyıp taşımadığını ölçmektir.

## İlk testte ölçülecek ana sorular

1. Oyuncu yardım almadan ilk hamleyi yapabiliyor mu?
2. İlk satır temizleme mantığını anlayabiliyor mu?
3. SHIFT sonrası tahtanın neden genişleyip alçaldığını anlayabiliyor mu?
4. Morph Crush ile kaybettiğinde sebebi anlayabiliyor mu?
5. Kaybettikten sonra kendi isteğiyle tekrar deniyor mu?
6. Level tamamlayınca kendi isteğiyle sonraki levele geçiyor mu?
7. Hangi levelde bırakıyor?
8. Hangi parça setleri gereksiz haksızlık hissi yaratıyor?

## Test sırası

### Aşama A — İç test

Hedef: 5–10 kişi.

Kurallar:
- oyunu açıklama
- sadece telefonu ver
- ilk 3 dakika müdahale etme
- oyuncunun ekranda ne aradığını izle

Kayıt:
- ilk hamleye kadar geçen süre
- ilk yanlış bırakma
- ilk satır temizleme
- ilk SHIFT
- ilk kayıp nedeni
- tekrar denedi mi
- ulaştığı son level

### Aşama B — Küçük dış test

Hedef: 20–50 gerçek oyuncu.

Bu aşamada manuel gözlem yerine oyun telemetrisi esas alınır.

Ana eventler:
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

## İlk GO / NO-GO ölçütleri

Bunlar piyasa standardı değil; prototipi öldürmek veya geliştirmek için iç karar eşikleridir.

### Güçlü sinyal
- Testçilerin çoğu ilk leveli açıklama olmadan tamamlıyor.
- Level 1 tamamlayanların en az %70'i Level 2'ye geçiyor.
- Level 3'e ulaşanların en az %50'si oyuna devam ediyor.
- Kayıptan sonra restart oranı %40+.
- Invalid drop oranı ilk levelden sonra belirgin şekilde düşüyor.
- Morph Crush sonrası oyuncu neden kaybettiğini çoğunlukla anlayabiliyor.

### Zayıf sinyal
- İlk satırı nasıl temizleyeceğini oyuncu anlamıyor.
- SHIFT oyuncuya ödül yerine rastgele ceza gibi geliyor.
- Oyuncular Level 1–2 içinde bırakıyor.
- Kayıpların çoğu jeneratör haksızlığı gibi algılanıyor.
- Oyuncu parçayı parmağının altında göremediği için sürekli yanlış bırakıyor.

### NO-GO / yeniden tasarım

Aşağıdakilerden biri belirginleşirse görsel üretime geçilmez:
- açıklama olmadan oynanamıyor
- SHIFT fikri anlaşılmıyor
- tekrar oynama isteği zayıf
- ilk 3 levelde oyuncu sıkılıyor
- kayıp nedenleri adil görünmüyor

## V0.1.2 özel testleri

Yeni game-feel katmanında özellikle kontrol edilecek:
- parça parmağın yaklaşık 62 px üstünde rahat okunuyor mu
- line clear flash fazla mı az mı
- SHIFT animasyonu oyunu yavaşlatıyor mu
- kısa haptic feedback rahatsız ediyor mu
- input kilidi SHIFT sonrası düzgün açılıyor mu
- fairness_adjustment çok sık tetikleniyor mu

## Fairness hedefi

`fairness_adjustment` nadir olmalıdır.

Eğer çok sık tetikleniyorsa sorun oyuncuda değil, parça jeneratörü / difficulty tuning tarafındadır.

İlk alarm seviyesi:
- tray'lerin %10'undan fazlasında fairness_adjustment görülmesi

Bu durumda generator yeniden ayarlanır.

## İlk başarı tanımı

İlk başarı:

> Oyuncunun "bir tane daha oynayayım" demesi.

Değildir:
- Poma görselinin güzel olması
- yüksek skor
- reklam geliri
- Store build
- harita sistemi
- coin / power-up

Motor bunu üretmiyorsa sonraki katmana geçilmez.
