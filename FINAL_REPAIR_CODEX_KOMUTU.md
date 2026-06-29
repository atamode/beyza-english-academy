# BEYZA ENGLISH ACADEMY — FINAL İÇERİK ONARIMI CODEX KOMUTU

## DURUM

Mevcut `Beyza-English-Academy-FINAL-A2.zip` yapısal testleri geçiyor; ancak Ders 022–065, Modül 4–10 tekrarları ve final sınavında çok sayıda yer tutucu içerik üretilmiş.

Bu görev yeni modül ekleme görevi değildir. Mevcut final projedeki sahte/boş içerikleri gerçek kaynak içerikle değiştirip yeniden test etme görevidir.

GitHub’a push yapma. Ara onay isteme. Ara rapor verme.

---

## 1. ANA KAYNAKLAR

Proje kökündeki şu dosyaları gerçek içerik kaynağı olarak kullan:

- `modul4_english_academy_REVIZE_FINAL.md`
- `modul5_english_academy_REVIZE_FINAL.md`
- `modul6_english_academy_REVIZE_FINAL.md`
- `modul7_english_academy_REVIZE_FINAL.md`
- `modul8_english_academy_REVIZE_FINAL.md`
- `modul9_english_academy_REVIZE_FINAL.md`
- `modul10_english_academy_REVIZE_FINAL.md`

Kaynak Markdown biçimi şöyledir:

- Ders başlığı: `# DERS 22 — ...`
- Bölümler: `## 1. Ders Adı`, `## 2. Öğrenme Hedefleri` vb.
- Çoktan seçmeli seçenekleri: `- A) ...`
- Cevaplar: `Cevaplar:` altında `1-B, 2-A` veya satır satır
- Hedef kelimeler: `1. **word** | Türkçe | örnek`
- Sorular kalın yazılmak zorunda değildir.
- `*Cevap Anahtarı*` biçimi kullanılmayabilir.

Mevcut `scripts/final-integrate-modules.js` parser’ı bu gerçek biçimi doğru okuyamıyor ve fallback içerik üretiyor. Parser’ı gerçek Markdown biçimine göre düzelt veya ders JSON’larını güvenilir biçimde üret. Fallback içerikle tamamlandı deme.

---

## 2. YASAKLI YER TUTUCULAR

Ders 022–065, Modül 4–10 review dosyaları, vocabulary ve final sınavında aşağıdaki ifadeler kesinlikle bulunmamalı:

- `Choose the correct answer.`
- yalnız `A`, `B`, `C` seçenekleri
- boş cevap: `"answer": ""`
- `Kaynak cevap anahtarına göre doğru seçenek budur.`
- `Kaynakta belirtilen kelime hedef kurala göre düzeltilmelidir.`
- `What is the text about?` şeklinde her derste tekrarlanan genel soru
- `Metinde yok`
- `Farklı ayrıntı`
- `target present`
- `sentence present`
- `question present`
- `answer present`
- `rule present`
- `target general`
- `Final 1`, `Final 2` ... gibi soru olmayan başlıklar
- `Doğru seçenek`
- `Geliştirilecek seçenek`
- `Konu dışı seçenek`

Bu kalıpları tüm kaynak ve `dist` içinde otomatik testle yasakla.

---

## 3. DERS 022–065 GERÇEK İÇERİK ONARIMI

Her derste kaynak Markdown’daki gerçek içerikleri kullan:

- gerçek Türkçe konu anlatımı
- gerçek örnekler
- gerçek kural tablosu
- gerçek sık hata örnekleri
- gerçek çoktan seçmeli soru metinleri ve seçenekleri
- gerçek boşluk doldurma soruları ve dolu cevapları
- gerçek cümle sıralama token’ları
- gerçek hata bulma cümlesi ve doğru açıklaması
- gerçek eşleştirme çiftleri
- gerçek okuma metni ve kaynakta bulunan 3 gerçek soru
- gerçek dinleme metni ve kaynakta bulunan 3 gerçek soru
- gerçek konuşma görevi
- gerçek 5 soruluk uygulama oyunu
- gerçek 5 soruluk ders sonu testi
- kaynakta belirtilen 7 gerçek hedef kelime/ifade
- gerçek Kelime Avı

Her dersin ekran sayısı mevcut şemayla uyumlu kalabilir; ancak ekran içeriği gerçek olmalıdır.

### Önemli teknik doğrulamalar

- `sentence-order` için `tokens` ve `answer` aynı kelime parçalama mantığını kullanmalı.
- `"a book"` tek token ise cevapta da tek token olmalı; iki token olacaksa her ikisinde de iki token olmalı.
- `fill-blank` cevabı boş olamaz.
- `error-find` yanlış kelime gerçekten cümlede bulunmalı.
- `matching` çiftleri kaynak cevaplarıyla doğru eşleşmeli.
- Okuma ve dinleme ekranında cevaplar öğrenci metninin içinde doğrudan gösterilmemeli; öğretmen/veli çözüm alanında tutulmalı.
- Öğrenciye gösterilen metin içine `Cevaplar:` bölümü basılmamalı.

---

## 4. KELİME SİSTEMİNİ ONAR

Ders 022–065 için fallback kelimeleri sil ve kaynak dosyalardaki gerçek hedef kelimeleri kullan.

Örnek olarak Ders 22’de şunlar bulunmalı:

- read
- write
- watch
- listen
- practise
- prepare
- serve

Ders 64’te şunlar bulunmalı:

- review
- mistake
- improve
- remember
- compare
- choose
- explain

Ders 65’te şunlar bulunmalı:

- final exam
- score
- result
- strong area
- weak area
- certificate
- complete

Her kelime:

- doğru Türkçe anlam
- doğal İngilizce örnek
- doğru kaynak ders
- çok kelimeli ifade bütünlüğü
- Kelime Kasası
- Kelime Avı
- Zor Kelimeler
- aralıklı tekrar

ile çalışmalı.

Aynı kelime farklı derslerde geçiyorsa kaynak ders bağları kaybolmamalı.

---

## 5. MODÜL 4–10 GENEL TEKRARLARINI ONAR

Şu dosyalar 25’er gerçek ve özgün soru içermeli:

- `data/module4-review.json`
- `data/module5-review.json`
- `data/module6-review.json`
- `data/module7-review.json`
- `data/module8-review.json`
- `data/module9-review.json`
- `data/module10-review.json`

Her review:

- ilgili modül konularını dengeli ölçmeli
- gerçek soru metni içermeli
- gerçek seçenekler içermeli
- doğru cevap açıklaması içermeli
- yanlış seçeneklerin neden yanlış olduğunu açıklamalı
- yalnız soru sayısı 25 olduğu için geçmemeli
- aynı generic soruyu 25 kez tekrarlamamalı

Modül 64 genel tekrar ayrı olarak Modül 1–10 kapsamını gerçekten ölçmeli.

---

## 6. DERS 65 FİNAL SINAVINI ONAR

Mevcut 45 round yalnız ad olarak 45 sorudur; gerçek soru değildir.

45 gerçek ve özgün değerlendirilebilir soru üret:

- 12 Grammar
- 8 Vocabulary
- 5 Reading
- 5 Listening
- 5 Sentence order
- 5 Error correction
- 3 Short writing değerlendirme görevi
- 2 Speaking görevi

Uygulama motoru yalnız otomatik puanlanan soruları destekliyorsa:

- 35–40 otomatik puanlanan gerçek soru
- yazma ve konuşma için ayrı rubrikli görev ekranları

kullan.

Her otomatik soruda:

- gerçek prompt
- gerçek ve konuya uygun seçenekler
- doğru cevap
- konu etiketi
- doğru açıklaması
- yanlış açıklaması

bulunsun.

`Final 1`, `Doğru seçenek`, `Konu dışı seçenek` gibi yer tutucular kesinlikle bulunmasın.

Konu bazlı rapor gerçek soru etiketlerinden hesaplanmalı.

---

## 7. DERS 64 GENEL TEKRARI ONAR

Ders 64 şu anda sıradan bir şablon ders gibi üretilmiş. Gerçek genel tekrar hâline getir:

- farklı zamanları ayırt etme
- modal verbs
- quantities
- comparatives
- future
- Present Perfect
- reading
- listening
- sentence order
- error correction
- kısa yazma
- konuşma

Eşleştirme hatalarını düzelt. Özellikle şu yanlış eşleştirmeler bulunmamalı:

- `every day → Past Simple`
- `now → Present Simple`
- `yesterday → Present Continuous`

Doğrusu:

- `every day → Present Simple`
- `now → Present Continuous`
- `yesterday → Past Simple`

---

## 8. SEMANTİK TESTLER EKLE

Mevcut testler yalnız dosya ve sayı kontrol ediyor. Aşağıdaki testleri ekle:

### Placeholder testi

Ders 022–065 ve review/final dosyalarında yasaklı yer tutucu kalıplar bulunmamalı.

### Fill-blank testi

Her `fill-blank` ekranında:

- `answer` boş olmamalı
- `accepted` en az bir dolu cevap içermeli

### Çoktan seçmeli testi

- Prompt gerçek bir soru veya talimat olmalı.
- Seçenekler yalnız `A/B/C` olamaz.
- En az iki anlamlı ve farklı seçenek olmalı.
- `correctIndex` geçerli olmalı.

### Vocabulary testi

- `target`, `sentence`, `question`, `answer`, `rule`, `example`, `practice` fallback seti yeni derslerde bulunmamalı.
- Kaynak MD’deki gerçek kelimeler JSON ile karşılaştırılmalı.

### Reading/listening testi

- Öğrenci metninin içinde `Cevaplar:` bulunmamalı.
- En az 3 gerçek soru bulunmalı.
- Sorular yalnız `What is the text about?` olmamalı.

### Sentence-order testi

- `tokens` birleştirildiğinde `answer` ile aynı cümleyi vermeli.
- Token sayısı/segmentasyonu uyumlu olmalı.

### Review testi

- Her Modül 4–10 review dosyasında 25 benzersiz prompt bulunmalı.
- Generic prompt oranı sıfır olmalı.

### Final testi

- 45 gerçek soru/görev bulunmalı.
- Benzersiz prompt sayısı yeterli olmalı.
- Yer tutucu final soruları bulunmamalı.
- Konu etiketleri gerçek dağılıma sahip olmalı.

### Pedagojik doğruluk testi

En az bilinen kritik örnekleri kontrol et:

- `did/didn't + base verb`
- `mustn't ≠ don't have to`
- `going to` plan / `will` anlık karar
- `for` süre / `since` başlangıç
- `if + Present Simple, will + base verb`

---

## 9. ZIP TEMİZLİĞİ

Final ZIP’e şu geçici doğrulama klasörü eklenmemeli:

- `.zip-check-s2`

Geçici extraction/test klasörlerini paket dışı bırak.

Final ZIP yalnız gerçek proje dosyalarını içersin.

---

## 10. UTF-8

Görünür arayüz metinlerindeki Türkçe karakterleri tekrar tara.

Ayrıca şu dosyalardaki mojibake kalıntılarını da temizle:

- `scripts/final-integrate-modules.js`
- `FINAL_MASTER_CODEX_KOMUTU.md`

Kaynak ve `dist` UTF-8 olarak eşleşmeli.

---

## 11. BUILD VE DOĞRULAMA

Onarım tamamlanınca:

1. `npm test`
2. `npm run build`
3. kaynak–dist eşleşme kontrolü
4. localhost hızlı kontrol
5. temiz final ZIP üretimi
6. ZIP’i ayrı klasöre çıkarma
7. ZIP içinden `npm test`
8. ZIP içinden placeholder taraması
9. ZIP içinden UTF-8 taraması

yap.

Yeni ZIP adı:

`Beyza-English-Academy-FINAL-A2-REPAIRED.zip`

---

## 12. FINAL RAPOR

`FINAL_REPAIR_REPORT.md` oluştur.

Şunları yaz:

- onarılan ders sayısı
- değiştirilen placeholder sayısı
- gerçek vocabulary sayısı
- review dosyası sonuçları
- final sınavı gerçek soru/görev dağılımı
- semantic test sayısı
- toplam test sonucu
- ZIP içi test sonucu
- UTF-8 sonucu
- gerçek eksikler
- GitHub’a push yapılmadığı

Finalde yalnız:

- test sonucu
- ZIP içi test sonucu
- onarılan ders sayısı
- final soru/görev sayısı
- ZIP yolu
- gerçek eksikler
- GitHub’a push yapılmadığı

bilgilerini kısa bildir.
