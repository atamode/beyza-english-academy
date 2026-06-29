# BEYZA ENGLISH ACADEMY — FINAL MASTER CODEX KOMUTU

## AMAÇ

Sprint 2.4 ile çalışan mevcut Beyza English Academy projesini bozmadan, Modül 4–10 içeriklerini sisteme entegre et; tüm ders zincirini 000–065 arasında tamamla; genel tekrarları, final sınavını, kelime sistemini, veli modunu, build/dist çıktısını ve UTF-8 metin temizliğini bitir.

Bu görev tek seferliktir. Ara onay isteme, ara rapor verme, gereksiz açıklama yazma ve GitHub’a push yapma.

---

## 1. KAYNAK DOSYALAR

Proje kökünde aşağıdaki dosyaların bulunduğunu doğrula:

- `modul4_english_academy_REVIZE_FINAL.md`
- `modul5_english_academy_REVIZE_FINAL.md`
- `modul6_english_academy_REVIZE_FINAL.md`
- `modul7_english_academy_REVIZE_FINAL.md`
- `modul8_english_academy_REVIZE_FINAL.md`
- `modul9_english_academy_REVIZE_FINAL.md`
- `modul10_english_academy_REVIZE_FINAL.md`

Eksik dosya varsa hiçbir entegrasyona başlama. Yalnız eksik dosya adlarını kısa şekilde bildir.

Tüm dosyalar varsa görevi tamamlayana kadar kullanıcıdan tekrar onay isteme.

---

## 2. MEVCUT PROJEYİ KORU

- Sprint 2.4 mimarisini koru.
- Mevcut çalışan dersleri 000–021 silme, yeniden yazma veya geriye götürme.
- Mevcut JSON şemasını, renderer’ları, LocalStorage yapısını, veli modunu, puan/yıldız/seri sistemini, yanlış cevap havuzunu, Kelime Kasası’nı ve 1–3–7–14–30 günlük aralıklı tekrar sistemini yeniden kullan.
- Yeni ve paralel bir ders motoru kurma.
- Mevcut kullanıcı ilerleme verileriyle uyumluluğu koru.
- Yalnız ortak hata düzeltmeleri gerekiyorsa mevcut dosyalara kontrollü değişiklik yap.
- `.git` klasörüne dokunma.
- GitHub’a commit veya push yapma.

---

## 3. KESİNTİYE DAYANIKLI ÇALIŞ

Codex kullanım limiti veya oturum kesintisi ihtimaline karşı proje kökünde:

`CODEX_FINAL_PROGRESS.md`

dosyasını oluştur.

Bu dosyada şu aşamaları tut:

- preflight
- module4
- module5
- module6
- module7
- module8
- module9
- module10
- reviews
- vocabulary
- parent_mode
- final_exam
- encoding_cleanup
- tests
- build
- zip_validation
- completed

Her aşamayı yalnız gerçekten tamamlanıp test edildikten sonra `DONE` olarak işaretle.

Görev yeniden çalıştırılırsa:
- `CODEX_FINAL_PROGRESS.md` dosyasını oku.
- Tamamlanan ve doğrulanan aşamaları gereksiz yere yeniden üretme.
- Son tamamlanmamış aşamadan devam et.
- Mevcut değişiklikleri geri alma.

---

## 4. MODÜL 4 ENTEGRASYONU — DERS 022–027

Kaynak:
`modul4_english_academy_REVIZE_FINAL.md`

Ders kimlikleri:

- `022-present-continuous-affirmative`
- `023-present-continuous-negative`
- `024-present-continuous-questions`
- `025-ing-spelling-rules`
- `026-present-simple-vs-present-continuous`
- `027-describing-a-picture`

Zincir:

`021 → 022 → 023 → 024 → 025 → 026 → 027`

Her derste:
- mevcut ders şemasındaki tüm zorunlu alanlar
- ders anlatımı
- özgün etkinlikler
- cevaplar ve Türkçe açıklamalar
- okuma
- dinleme
- konuşma görevi
- uygulama oyunu
- ders sonu testi
- veli notu
- 7 hedef kelime/ifade
- Kelime Avı

bulunsun.

Modül 4 için yaklaşık 25 özgün soruluk genel tekrar sınavı oluştur.

---

## 5. MODÜL 5 ENTEGRASYONU — DERS 028–034

Kaynak:
`modul5_english_academy_REVIZE_FINAL.md`

Ders kimlikleri:

- `028-countable-uncountable`
- `029-a-an-some`
- `030-some-any`
- `031-much-many`
- `032-a-few-a-little`
- `033-prices-shopping`
- `034-at-a-restaurant`

Zincir:

`027 → 028 → 029 → 030 → 031 → 032 → 033 → 034`

49 hedef kelime/ifadeyi kelime sistemine bağla.

Modül 5 için yaklaşık 25 özgün soruluk genel tekrar sınavı oluştur.

---

## 6. MODÜL 6 ENTEGRASYONU — DERS 035–040

Kaynak:
`modul6_english_academy_REVIZE_FINAL.md`

Ders kimlikleri:

- `035-can-cant`
- `036-could`
- `037-should-shouldnt`
- `038-must-mustnt`
- `039-have-to`
- `040-school-health-rules`

Zincir:

`034 → 035 → 036 → 037 → 038 → 039 → 040`

42 hedef kelime/ifadeyi kelime sistemine bağla.

Özellikle:
- `mustn't`
- `don't have to`
- `shouldn't`

anlamlarının birbirine karışmadığını test et.

Modül 6 için yaklaşık 25 özgün soruluk genel tekrar sınavı oluştur.

---

## 7. MODÜL 7 ENTEGRASYONU — DERS 041–047

Kaynak:
`modul7_english_academy_REVIZE_FINAL.md`

Ders kimlikleri:

- `041-was-were`
- `042-past-simple-regular`
- `043-past-simple-irregular`
- `044-did-didnt`
- `045-past-simple-questions`
- `046-telling-a-past-story`
- `047-past-continuous`

Zincir:

`040 → 041 → 042 → 043 → 044 → 045 → 046 → 047`

49 hedef kelime/ifadeyi kelime sistemine bağla.

Özellikle:
- `did/didn't` sonrasında fiilin yalın olması
- düzensiz fiiller
- `was/were`
- Past Simple ile Past Continuous ayrımı

için test ekle.

Modül 7 için yaklaşık 25 özgün soruluk genel tekrar sınavı oluştur.

---

## 8. MODÜL 8 ENTEGRASYONU — DERS 048–050

Kaynak:
`modul8_english_academy_REVIZE_FINAL.md`

Ders kimlikleri:

- `048-comparative-adjectives`
- `049-superlative-adjectives`
- `050-comparing-people-animals-cities`

Zincir:

`047 → 048 → 049 → 050`

21 hedef kelime/ifadeyi kelime sistemine bağla.

Özellikle:
- comparative + `than`
- superlative öncesinde `the`
- `better/best`
- `worse/worst`
- kısa ve uzun sıfat ayrımı

için test ekle.

Modül 8 için yaklaşık 20–25 özgün soruluk genel tekrar sınavı oluştur.

---

## 9. MODÜL 9 ENTEGRASYONU — DERS 051–055

Kaynak:
`modul9_english_academy_REVIZE_FINAL.md`

Ders kimlikleri:

- `051-be-going-to`
- `052-will-wont`
- `053-going-to-vs-will`
- `054-holiday-plans`
- `055-future-predictions`

Zincir:

`050 → 051 → 052 → 053 → 054 → 055`

35 hedef kelime/ifadeyi kelime sistemine bağla.

Özellikle:
- önceden plan → `going to`
- anlık karar → `will`
- görünen kanıt → `going to`
- `I think` tahmini → `will`

ayrımını test et.

Modül 9 için yaklaşık 25 özgün soruluk genel tekrar sınavı oluştur.

---

## 10. MODÜL 10 ENTEGRASYONU — DERS 056–065

Kaynak:
`modul10_english_academy_REVIZE_FINAL.md`

Ders kimlikleri:

- `056-present-perfect-introduction`
- `057-ever-never`
- `058-already-yet`
- `059-for-since`
- `060-used-to`
- `061-gerund-infinitive-introduction`
- `062-first-conditional`
- `063-basic-phrasal-verbs`
- `064-general-review`
- `065-final-exam`

Zincir:

`055 → 056 → 057 → 058 → 059 → 060 → 061 → 062 → 063 → 064 → 065`

70 hedef kelime/ifadeyi kelime sistemine bağla.

Özellikle:
- `have/has + past participle`
- `ever/never`
- `already/yet`
- `for/since`
- `used to`
- `didn't use to`
- temel gerund/infinitive kalıpları
- First Conditional
- temel phrasal verbs

için test ekle.

---

## 11. DERS 64 — GENEL TEKRAR

Ders 64 yalnızca beş soruluk basit bir ders olmasın.

Şunları içersin:

- Modül 1–10 karma tekrar
- grammar
- vocabulary
- reading
- listening
- sentence order
- error correction
- konuşma
- kısa yazma
- yanlış konuya göre ders önerisi
- yanlış cevapları tekrar havuzuna gönderme

Mevcut ders renderer’larıyla uyumlu biçimde uygulanmalı.

---

## 12. DERS 65 — GERÇEK FİNAL SINAVI

Final sınavı 40–50 özgün sorudan oluşsun.

Kapsam:

- Grammar
- Vocabulary
- Reading
- Listening
- Sentence ordering
- Error correction
- Short writing
- Speaking task

Konu bazlı sonuç üret:

- temel cümle yapısı
- Present Simple
- Present Continuous
- miktar ifadeleri
- modal verbs
- Past Simple
- comparative/superlative
- future forms
- Present Perfect
- reading/listening

Puanlama 100 üzerinden olsun.

Yanlışlar:
- ilgili derslere bağlansın
- yanlış cevap havuzuna eklensin
- uygun kelimeler Kelime Kasası tekrarına gönderilsin

Final sonucu:
- toplam puan
- güçlü alanlar
- geliştirilmesi gereken alanlar
- tekrar önerilen dersler
- tamamlanan ders sayısı
- yıldız/seri/kelime başarısı

bilgilerini üretsin.

Başarı belgesi için veri modeli oluştur; mevcut mimari izin veriyorsa yazdırılabilir basit belge görünümü ekle. Yeni ağır altyapı kurma.

---

## 13. CURRICULUM VE DERS ZİNCİRİ

Aşağıdakileri doğrula:

- Tüm dersler 000–065 arasında eksiksiz
- 021’den sonra 022
- 027’den sonra 028
- 034’ten sonra 035
- 040’tan sonra 041
- 047’den sonra 048
- 050’den sonra 051
- 055’ten sonra 056
- 065 final ders

`data/curriculum.json`, `data/app-config.json` ve ilgili tüm listeleme kaynaklarını güncelle.

Hiçbir ders:
- zincir dışında kalmasın
- çift kaydolmasın
- yanlış modülde görünmesin
- bozuk dosya yoluna sahip olmasın

---

## 14. KELİME SİSTEMİ

Modül 4–10 içindeki tüm hedef kelimeleri:

- `data/vocabulary.json`
- Kelime Kasası
- Kelime Avı
- yanlış cevap tekrar havuzu
- 1–3–7–14–30 günlük aralıklı tekrar
- Zor Kelimeler
- Haftalık Kelime Turnuvası
- veli kelime raporu

ile ilişkilendir.

Kontroller:

- Aynı kelime gereksiz yere mükerrer kayıt oluşturmasın.
- Aynı kelime farklı derste tekrar ediyorsa kaynak dersleri kaybolmasın.
- Kelime/ifade türü korunabilsin.
- Türkçe anlamlar UTF-8 olarak doğru görünsün.
- Çok kelimeli ifadeler (`going to`, `a few`, `look for`) bozulmasın.

---

## 15. VELİ MODU

Veli modunda:

- Ders 022–065 görünmeli.
- Modül 4–10 filtreleri/başlıkları doğru görünmeli.
- Her dersin Türkçe konu özeti görünmeli.
- Hedef kelimeler görünmeli.
- Modül genel tekrarları görünmeli.
- Ders 64 genel tekrar görünmeli.
- Ders 65 final sınavı ve sonuç raporu görünmeli.
- Zorlanılan konular raporu yeni dersleri kapsamalı.
- Sabit “Modül 1 sınavı” ifadesi kullanılmamalı.
- Metin seçili modüle göre dinamik olmalı veya genel “modül sınavı” ifadesi kullanılmalı.

Mevcut veli modu tasarımını koru; baştan yazma.

---

## 16. UTF-8 VE BOZUK TÜRKÇE KARAKTER TEMİZLİĞİ

Canlı arayüzde daha önce görülen bozuk metin örnekleri:

- `Modül`
- `Yanlışlarımı`
- `Kelime Kasası`
- `Haftanın`
- `sınavı`
- `aç`
- ``
- `Ã`
- `Ä`
- `Å`

Tüm kaynak ve build dosyalarında encoding taraması yap.

Kontrol edilecek alanlar:

- HTML
- JavaScript
- JSON
- CSS içindeki görünür metinler
- manifest
- service worker
- build scriptleri
- import/generate scriptleri
- test fixture’ları
- `dist`
- ZIP içeriği

Yapılacaklar:

1. Tüm metin dosyalarını UTF-8 olarak oku ve yaz.
2. Ana HTML içinde `<meta charset="UTF-8">` bulunduğunu doğrula.
3. Build işleminin Türkçe karakterleri bozmadığını doğrula.
4. JSON üretiminde yanlış encoding dönüşümü yapılmadığını kontrol et.
5. Görünür Türkçe metinlerde:
   - `ç, Ç`
   - `ğ, Ğ`
   - `ı, İ`
   - `ö, Ö`
   - `ş, Ş`
   - `ü, Ü`
   karakterlerinin doğru kaldığını test et.
6. Bilinen bozuk kelimeleri düzelt:
   - Modül
   - Yanlışlarımı
   - Kelime Kasası
   - Haftanın
   - sınavı
   - aç
7. Yalnız soru işareti karakterini genel olarak yasaklama; gerçek soru cümlelerindeki `?` korunmalı.
8. Bozuk karakter dizileri için otomatik test ekle.

---

## 17. İÇERİK VE VERİ KALİTE KONTROLÜ

Her yeni ders için doğrula:

- JSON geçerli
- gerekli alanlar eksiksiz
- cevap anahtarları seçeneklerle uyumlu
- doğru cevap gerçekten tek ve açık
- boşluk doldurma cevabı cümleye uyuyor
- cümle sıralama cevapları doğal
- açıklamalar doğru şıkkı destekliyor
- dinleme/okuma soruları metinden cevaplanabiliyor
- hedef kelime sayısı kaynak dosyayla uyumlu
- yasaklı ileri grammar yanlışlıkla kullanılmıyor
- bebeksi, anlamsız veya yapay cümle yok
- telifli şarkı sözü yok
- Manifest hakkında doğrulanmamış özel bilgi yok

Kaynak dosyadaki içerik pedagojik ana kaynaktır. Teknik şemaya uyarlarken anlamı değiştirme.

---

## 18. TESTLER

Mevcut testleri koru ve yalnız gerekli yeni testleri ekle.

En az şu kontroller bulunsun:

- Tüm ders dosyaları 000–065 mevcut
- Curriculum zinciri doğru
- Her yeni ders parse ediliyor
- Her yeni derste hedef kelime var
- Modül 4–10 genel tekrar dosyaları var
- Final sınavı var
- Veli modu yeni dersleri listeliyor
- Kelime sistemi yeni kelimeleri içeriyor
- LocalStorage anahtarları geriye uyumlu
- Build kaynak ve dist eşleşmesi
- Service worker yeni build dosyalarını içeriyor
- UTF-8 bozuk karakter taraması
- Bilinen bozuk Türkçe kelimelerin doğru biçimleri
- ZIP içinden çıkarılan sürümde testler

Her modül entegrasyonundan sonra ilgili küçük test grubunu çalıştır.

Tüm entegrasyon tamamlandıktan sonra:

`npm test`

çalıştır ve bütün testleri geçir.

Test başarısızsa:
- hatayı düzelt
- testi yeniden çalıştır
- başarısız testle final verme

---

## 19. BUILD VE SERVICE WORKER

Tüm testler geçince:

1. Build işlemini çalıştır.
2. `dist` klasörünü güncelle.
3. Service-worker cache sürümünü artır.
4. Yeni ders, review, final ve vocabulary dosyalarının cache listesine dahil olduğunu doğrula.
5. Eski build artıkları nedeniyle olmayan dosyalar kalmışsa temizle.
6. Kaynak ve `dist` eşleşmesini doğrula.
7. Localhost üzerinde yeni build’in açılabildiğini kontrol et.

GitHub’a push yapma.

---

## 20. ZIP VE İKİNCİ TEST

Final ZIP adı:

`Beyza-English-Academy-FINAL-A2.zip`

ZIP şunları içersin:

- çalışan final proje
- güncel `dist`
- gerekli kaynaklar
- testler
- final raporu
- `CODEX_FINAL_PROGRESS.md`

ZIP üretildikten sonra:

1. ZIP’i yeni ve temiz bir geçici klasöre çıkar.
2. Çıkarılan kopyada bağımlılık/test yöntemi mevcut projeye göre uygulanabiliyorsa `npm test` çalıştır.
3. Build/dist dosyalarını doğrula.
4. Ders 022, 040, 050, 055, 056, 064 ve 065 dosyalarını örnek olarak açıp parse et.
5. UTF-8 taramasını ZIP kopyasında tekrar çalıştır.
6. Sonuç başarısızsa ZIP’i yeniden üret.

---

## 21. FİNAL RAPOR DOSYASI

Proje kökünde:

`FINAL_TEST_REPORT.md`

oluştur.

İçeriği:

- tamamlanan ders aralığı
- toplam ders sayısı
- eklenen modüller
- toplam test sonucu
- ZIP içi test sonucu
- final sınavı soru sayısı
- vocabulary entegrasyon özeti
- UTF-8 tarama sonucu
- service-worker cache sürümü
- gerçek eksikler
- GitHub’a push yapılmadığı bilgisi

---

## 22. YASAKLAR

- GitHub’a commit/push yapma.
- `.git` klasörünü silme veya değiştirme.
- Mevcut çalışan dersleri sebepsiz yeniden yazma.
- Yeni framework ekleme.
- PHP, veritabanı veya sunucu bağımlılığı ekleme.
- Mevcut LocalStorage ilerlemesini bozma.
- Kaynak Markdown dosyalarını silme.
- Ara rapor verme.
- Kullanıcıdan ara onay isteme.
- Başarısız testle ZIP üretip tamamlandı deme.
- Gerçek eksik varsa “eksik yok” deme.

---

## 23. FİNALDE YALNIZCA ŞUNLARI BİLDİR

Görev tamamen bittiğinde kısa şekilde:

1. `npm test` sonucu
2. ZIP içinden test sonucu
3. Toplam ders sayısı
4. Final sınavı soru sayısı
5. UTF-8 temizliği sonucu
6. ZIP tam yolu
7. Ana güncellenen dosyalar
8. Gerçek eksikler
9. GitHub’a push yapılmadığı

bilgilerini bildir.

Uzun açıklama, ara çalışma özeti veya tekrar eden rapor yazma.
