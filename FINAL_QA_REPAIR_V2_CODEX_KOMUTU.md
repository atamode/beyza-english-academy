# BEYZA ENGLISH ACADEMY — FINAL QA ONARIMI V2

## AMAÇ

Mevcut `Beyza-English-Academy-FINAL-A2-REPAIRED.zip` yapısal testleri geçiyor; fakat son manuel kalite kontrolünde arayüz, dinleme motoru, final sınavı ve bazı içeriklerde kalan hatalar bulundu.

Bu görev:
- Modülleri baştan üretme görevi değildir.
- Mevcut çalışan projeyi hedefli biçimde düzeltme görevidir.
- GitHub’a push yapma.
- Ara onay isteme.
- Ara rapor verme.
- Mevcut kullanıcı ilerleme anahtarlarını bozma.

---

## 1. GÖRÜNÜR UTF-8 / MOJIBAKE HATALARINI TEMİZLE

Kaynak ve `dist` içinde görünen metinlerde hâlâ bozuk karakterler var.

### `js/app.js` içinde düzeltilecek bilinen örnekler

- `? Ana ekran` → `← Ana ekran`
- `? Geri` → `← Geri`
- `S?nav? tamamla` → `Sınavı tamamla`
- `Sonraki ?` → `Sonraki →`
- `MOD?L` → `MODÜL`
- `do?ru` → `doğru`
- `? GENEL TEKRAR` → `· GENEL TEKRAR`

Aynı bozuklukların `dist/js/app.js` içinde de kalmadığını doğrula.

### Soru işaretinin yanlışlıkla `ç` karakterine dönüştüğü bilinen örnekler

Aşağıdaki bozuk ifadeleri kaynak, üreten script, data ve dist katmanlarında düzelt:

- `Boraç` → `Bora?`
- `cinemaç` → `cinema?`
- `bananaç` → `banana?`
- `Ankaraç` → `Ankara?`
- `Antalyaç` → `Antalya?`
- `Beyzaç` → `Beyza?`

Özellikle kontrol et:

- `scripts/generate-module1.js`
- `scripts/generate-module2-review.js`
- `data/lessons/004-to-be-questions.json`
- `data/lessons/033-prices-shopping.json`
- `data/lessons/057-ever-never.json`
- `data/lessons/065-final-exam.json`
- `data/module2-review.json`
- `data/module10-review.json`
- ilgili `dist` kopyaları

Gerçek Türkçe sözcüklerdeki doğru `ç` harflerine dokunma:
- maç
- geç
- birkaç
- sonuç
- ihtiyaç
- sandviç
- utangaç

---

## 2. VELİ MODUNDA SABİT “MODÜL 1” METNİNİ DÜZELT

`js/parent-mode.js` içinde hâlâ şu sabit metinler var:

- `Seçili ders, Modül 1 sınavı...`
- `Modül 1 Genel Tekrar`

Bunları seçili derse göre dinamik yap:

- Üst açıklama: `Seçili ders, modül tekrarı, kelime takibi ve tekrar havuzu tek yerde.`
- Review başlığı: `Modül X Genel Tekrar`
- `X`, seçili dersin gerçek `moduleId` değerinden hesaplanmalı.

`dist/js/parent-mode.js` ile kaynak eşleşmeli.

---

## 3. DİNLEME EKRANLARINI GERÇEKTEN 3 SORULUK YAP

Ders 022–065 dinleme verilerinde üç soru bulunuyor; ancak mevcut renderer yalnız ilk soruyu gösterip puanlıyor.

### Motor düzeltmesi

`js/activity-renderers.js` içinde listening ekranı:

- reading ekranı gibi tur tur ilerlemeli
- `content.questions[answer.round]` kullanmalı
- her sorunun kendi:
  - `prompt`
  - `options`
  - `correctIndex`
  - `explanationsTr`
  alanları olmalı
- ses metni tüm sorularda aynı kalmalı
- transkript ancak bütün sorular tamamlandıktan sonra açılmalı
- doğru cevapta sonraki dinleme sorusuna geçmeli
- üç soru da puanlanmalı ve yanlış havuzuna işlenmeli

### Veri dönüşümü

Ders 022–065 içindeki tüm listening ekranlarını şu modele dönüştür:

```json
{
  "audioText": "...",
  "questions": [
    {
      "prompt": "...",
      "options": ["...", "...", "..."],
      "correctIndex": 1,
      "explanationsTr": ["...", "...", "..."]
    }
  ]
}
```

Mevcut soru ve cevapları kullan. Gerçek ve konuya uygun distractor üret.

---

## 4. DERS 57 VE 58 HATA BULMA EKRANLARINI DÜZELT

### Ders 57

Mevcut hata:

- Cümle: `I haven't never been there.`
- `wrongIndex: 0` olduğu için uygulama `I` kelimesini hata kabul ediyor.
- Gerçek hata iki kelimelik `haven't never` yapısıdır ve tek kelime seçme motoruna uygun değildir.

Tek kelimelik hata içeren bir cümle kullan:

```text
I have ever been there.
```

- Hatalı kelime: `ever`
- Doğrusu: `never`
- Açıklama: Olumlu anlamda “hiç gitmedim” demek için `have never been` kullanılır.

Alternatif olarak error-find motorunu çoklu token destekleyecek şekilde geliştirebilirsin; daha basit ve güvenli çözüm tek kelimelik hata cümlesidir.

### Ders 58

Mevcut hata:

- `I haven't yet my homework finished.`
- Hata tüm kelime sırasındadır.
- Açıklamada `"doğru biçim"` gibi yer tutucu kalmıştır.

Tek kelimelik hata içeren cümle kullan:

```text
I haven't finished my homework already.
```

- Hatalı kelime: `already`
- Doğrusu: `yet`
- Doğru cümle: `I haven't finished my homework yet.`

---

## 5. FINAL SINAVINDAKİ HATALARI DÜZELT

`data/lessons/065-final-exam.json` içindeki `s14b` 40 otomatik soruyu hedefli biçimde onar.

### Bilinen bozuk sorular

#### Cümle sıralama

- `Ankaraç` → `Ankara?`
- Aynı iki seçeneğin tekrarlandığı soru bulunmamalı.
- `This order is not complete` gibi yapay İngilizce seçenek kullanma.
- Yanlış seçenekler gerçek fakat yanlış kelime sıraları olsun.

Örnek:

```text
Prompt: Kelimeleri sırala: Have / you / ever / visited / Ankara / ?
A) Have you ever visited Ankara?
B) Have ever you visited Ankara?
C) You have ever visited Ankara?
```

#### Hata bulma — soru 37

Mevcut seçenekler:
- `I`
- `I`
- `there.`

Bunlar yanlış.

Ders 57’deki yeni tek kelimelik hata cümlesini kullan:

```text
I have ever been there.
```

Seçenekler gerçek kelimelerden ve benzersiz olmalı:
- have
- ever
- there

Doğru: `ever`

#### Hata bulma — soru 38

Mevcut açıklama:
- `"doğru biçim"` olmalıdır

Bu yer tutucuyu kaldır.

Ders 58’deki yeni cümleyi kullan:

```text
I haven't finished my homework already.
```

Seçenekler:
- haven't
- finished
- already

Doğru: `already`
Düzeltme: `yet`

### Vocabulary soruları

Şu yapay distractorları kaldır:

- `farklı bir ders kelimesi`
- `yanlış anlam`

Her kelime için `data/vocabulary.json` içinden gerçek ve farklı Türkçe anlamlar kullan.

Örnek:

```text
experience:
- deneyim
- ilerleme
- sonuç
```

### Final soru etiketleri

Her 40 otomatik soruda şu alanlar bulunmalı:

- `topicTag`
- `topicLabel`
- `section`

Dağılım:

- 12 Grammar
- 8 Vocabulary
- 5 Reading
- 5 Listening
- 5 Sentence order
- 5 Error correction

Toplam: 40

---

## 6. FINAL SONUÇ RAPORUNU GERÇEKTEN UYGULA

Mevcut projede final sınavı için yalnız metadata var. Konu bazlı güçlü/zayıf alan raporu ve başarı belgesi görünümü uygulanmamış.

### Mini-game cevap kaydı

Final `s14b` ekranında her tur için şunları kaydet:

- question index
- topicTag
- topicLabel
- correct / incorrect
- wrong attempts
- earned points

Tek bir toplu `completed` kaydı yeterli değildir.

### Ders 65 tamamlanınca

Ayrı bir final sonuç görünümü göster:

- toplam otomatik doğru: `x/40`
- rubrik görevleri: `x/5 tamamlandı`
- toplam yüzde
- konu bazlı sonuçlar
- güçlü alanlar
- geliştirilmesi gereken alanlar
- tekrar önerilen dersler
- Kelime Kasası’na gönderilen yanlış kelimeler
- yazdırılabilir başarı belgesi

Başarı belgesinde:

- Beyza’nın adı
- tarih
- tamamlanan ders sayısı
- final puanı
- toplam yıldız
- en uzun seri
- güçlü alanlar

bulunsun.

Bu veri LocalStorage’da ayrı bir `finalExamResult` alanında saklanabilir; mevcut ilerleme verilerini bozma.

---

## 7. SEÇENEK KONUMU EZBERİNİ ENGELLE

Manuel kontrolde:

- Ders 022–065 Kelime Avı: 220/220 doğru cevap A seçeneğinde
- Okuma soruları: 132/132 doğru cevap A seçeneğinde
- Dinleme ilk soruları: 44/44 doğru cevap A seçeneğinde

Bu durum oyunu ve değerlendirmeyi anlamsızlaştırır.

### Çözüm

Seçenekleri veri üretim aşamasında deterministik olarak döndür:

- 1. soru doğru indeks 0
- 2. soru doğru indeks 1
- 3. soru doğru indeks 2
- 4. soru doğru indeks 3
- sonra tekrar

Ya da güvenli bir seeded shuffle kullan.

Runtime her render’da yeniden shuffle yapma; cevap verirken seçeneklerin yeri değişmemeli.

Aşağıdaki alanlarda doğru cevap konumları dengeli olmalı:

- vocabulary-hunt
- reading
- listening
- final vocabulary
- final reading
- final listening

---

## 8. DİĞER ÇİFT VE YAPAY SEÇENEKLERİ TARA

Ders 000–065, Modül 1–10 review ve finalde:

- Aynı soru içinde iki seçenek aynı olamaz.
- Boş seçenek olamaz.
- `doğru biçim`
- `farklı bir ders kelimesi`
- `yanlış anlam`
- `This order is not complete`
- `Ankaraç`
- `Antalyaç`
- `Boraç`
- `Beyzaç`
- `bananaç`
- `cinemaç`

bulunamaz.

---

## 9. YENİ SEMANTİK TESTLER

Aşağıdaki testleri ekle.

### Görünür metin testi

Kaynak ve dist içinde şu ifadeler bulunmamalı:

- `S?nav?`
- `MOD?L`
- `do?ru`
- `? Ana ekran`
- `? Geri`
- `Sonraki ?`

### Soru işareti / yanlış ç testi

Bilinen bozuk örnekler bulunmamalı:

- `Boraç`
- `cinemaç`
- `bananaç`
- `Ankaraç`
- `Antalyaç`
- `Beyzaç`

### Duplicate options testi

Her multiple-choice, reading, listening, mini-game ve final sorusunda:

```js
new Set(options).size === options.length
```

olmalı.

### Error-find testi

- `wrongIndex` geçerli olmalı.
- Seçilen token açıklamada belirtilen hatalı kelimeyle uyuşmalı.
- Açıklamada `doğru biçim` yer tutucusu bulunmamalı.

### Listening davranış testi

- 3 soruluk listening ekranında üç sorunun da sırayla tamamlandığı doğrulanmalı.
- İlk sorudan sonra ekran tamamlanmış sayılmamalı.

### Final topic testi

- 40 turun tamamında `topicTag`, `topicLabel`, `section` bulunmalı.
- Bölüm dağılımı 12/8/5/5/5/5 olmalı.
- Final sonuç analizi konu bazlı doğru sayıları üretmeli.

### Doğru seçenek dağılım testi

Ders 022–065 için:
- vocabulary-hunt
- reading
- listening

sorularında doğru cevapların en az iki farklı indeks konumunda bulunduğunu doğrula.
Tek bir indeksin oranı %70’i aşmamalı.

### Veli modu testi

Modül 4 veya 10 dersi açıldığında başlıkta `Modül 1 Genel Tekrar` görünmemeli.

---

## 10. BUILD VE ZIP

Düzeltmelerden sonra:

1. `npm test`
2. `npm run build`
3. kaynak–dist eşleşmesi
4. service-worker cache sürümü artışı
5. localhost HTTP 200
6. ZIP çıkarma testi
7. ZIP içinden `npm test`
8. ZIP içinden görünür UTF-8 taraması
9. ZIP içinden duplicate option taraması

Yeni ZIP:

`Beyza-English-Academy-FINAL-A2-QA2.zip`

Rapor:

`FINAL_QA2_REPORT.md`

---

## 11. FİNALDE YALNIZCA ŞUNLARI BİLDİR

- `npm test` sonucu
- ZIP içi test sonucu
- düzeltilen görünür metin sayısı
- onarılan listening ekranı sayısı
- final soru dağılımı
- final konu raporu durumu
- ZIP yolu
- gerçek eksikler
- GitHub’a push yapılmadığı
