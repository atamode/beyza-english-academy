# Poma Shift — Sugar Cloud Core V3

**Kilit tarih:** 2026-08-09

Bu belge Poma Shift'in güncel core board / SHIFT tehdidi için otoritedir. `LOFT_CORE_V2.md` ve eski değişken-board / descending-LOFT anlatımları bu konuda superseded kabul edilir.

## Ürün kimliği

> **shape placement + growing Sugar Cloud + character powers**

## Sabit board

- normal ve RUSH gameplay board çerçevesi: **7 sütun × 9 satır**
- level başında geometry değişmez
- SHIFT sonrası board fiziksel olarak küçülmez
- kolon ekleme / yanlardan büyüme yok
- satır silinip canvas yüksekliği değişmez
- grid matematiği 7×9 kalır

## Şeker Bulutu

- Şeker Bulutu boardun üstünden aşağı doğru büyür
- her başarılı SHIFT tetiklenmesinde normalde **1 satır** ilerler
- ilerlediği satır artık oynanamaz
- grid 7×9 kalır; yalnız bulutun kapladığı satırlar kilitlenir
- bulutun sıradaki kapatacağı satırda blok varsa normal level fail olur
- RUSH'ta bulut ilerlemeden önce sıradaki **2 tehlike satırı** güvenli olmalıdır

## Tehlike feedback'i

Bulut sürekli alarm halinde değildir.

- güvenli: açık pembe/beyaz/mor, yumuşak puf ve sparkle
- uyarı: bulut ile en yakın blok arasında yaklaşık 2 satır kaldığında hafif kararır
- kritik: mesafe 1 satıra düştüğünde daha koyu/pulse olur
- kritik durumda kısa şimşek efektleri görünür
- SHIFT anı: yaklaşık 0.5–0.7 sn aşağı büyüme / kabarma animasyonu
- kısa `whoosh/puff` ses feedback'i
- hafif haptic kullanılabilir

Amaç: oyuncu yazı okumadan Şeker Bulutu'nun yaklaştığını anlamalıdır.

## Dahi Poma — Güvenlik Kalkanı

Eski karar geçersiz:

> Bilgisayar board/LOFT'u 10 hamle dondurur.

Yeni kilit:

> **Güvenlik Kalkanı, Şeker Bulutu'nun bir sonraki ilerlemesini 1 kez tamamen engeller.**

Akış:

1. oyuncu Bilgisayar/Güvenlik Kalkanı gücünü kullanır
2. Dahi Poma cast animasyonu yapar
3. boardun üstünde cyan/mavi dijital kalkan görünür
4. sonraki SHIFT tetiklenir
5. SHIFT level hedefinde sayılır
6. Şeker Bulutu büyümeye çalışır fakat kalkan engeller
7. kalkan tüketilir
8. sonraki SHIFT yeniden normal Şeker Bulutu ilerlemesidir

Kullanıcı copy:

> **Güvenlik Kalkanı — Şeker Bulutu'nun bir sonraki ilerlemesini durdurur.**

## RUSH

- full-level timer korunur
- BAŞLA denmeden timer başlamaz
- RUSH danger zone artık sabit row 0/1 değildir
- danger zone her zaman **mevcut Şeker Bulutu kenarının altındaki sonraki 2 açık satırdır**
- intro/overlay kapanınca canvas input kesin olarak geri açılmalıdır
- RUSH timer/continue state'i gameplay pointer inputunu kilitleyemez

## Boss notu

Level 90'daki eski `Yapışkan Şeker Bulutu` random-cell boss mekaniği global Şeker Bulutu core'u ile karıştırılmamalıdır. Bu boss gelecekte `Şeker Fırtınası / Sticky Sugar Storm` varyantı olarak ele alınır; ana core tehdidi tüm levellerde yukarıdan büyüyen Şeker Bulutu'dur.

## Teknik kaynaklar

- `sugar-cloud-core-v3.js`
- `sugar-cloud-core-v3.css`
- `sugar-cloud-meta-v3.js`
- `rush-cloud-v3.js`
- `character-gameplay-v1.js`

Danger/win/lose karakter pose'ları bu core revizyonunun release gate'i değildir; core ve gameplay akışı önce doğrulanır.