# SPRINT 2.4 — MODÜL 3 ENTEGRASYONU

Ana proje klasörü:

```text
C:\Users\USER\Documents\english time
```

İçerik kaynağı:

```text
modul3_english_academy_REVIZE_FINAL.md
```

## Görev

Sprint 2.3 yapısını ve mevcut çalışan mimariyi koruyarak Modül 3'ü entegre et.

1. Önce mevcut projeyi ve içerik JSON şemasını incele.
2. `modul3_english_academy_REVIZE_FINAL.md` dosyasındaki dersleri 016–021 olarak mevcut şemaya aktar:
   - 016 — There is / There are
   - 017 — Prepositions of Place
   - 018 — Describing a Room
   - 019 — Places in Town
   - 020 — Giving Directions
   - 021 — Imperatives
3. Ders zincirini `015 → 016 → 017 → 018 → 019 → 020 → 021` olarak bağla.
4. Her dersteki 7 hedef kelimeyi Kelime Kasası, Kelime Avı, yanlış cevap havuzu ve 1–3–7–14–30 günlük aralıklı tekrar sistemine bağla.
5. Mevcut aktivite renderer'larını, veli modunu, puan/yıldız sistemini ve tekrar altyapısını kullan. Yeni ve paralel bir altyapı kurma.
6. Modül 3 için yaklaşık 25 özgün soruluk genel tekrar sınavı oluştur. Sorular yalnız Modül 3 hedeflerini ölçsün; belirsiz veya birden fazla doğru cevabı olan şık kullanma.
7. Kaynak ve `dist` içeriklerinin eşleşmesini sağla.
8. Service worker önbellek sürümünü artır.
9. Mevcut testlere yalnız gerekli Modül 3 kontrollerini ekle ve `npm test` çalıştır.
10. Test başarısızsa hataları düzeltmeden build veya ZIP üretme.
11. Testler geçerse build al, `dist` klasörünü güncelle ve `Beyza-English-Academy-Sprint2.4.zip` dosyasını üret.
12. Bu görevde GitHub'a push yapma. Önce yerel sürüm ve ZIP tarafımızdan kontrol edilecek.

## Korunacak ilkeler

- Sprint 2.3'te çalışan hiçbir özelliği kaldırma veya yeniden yazma.
- Ders metnini kendi kendine yeniden üretme; verilen revize Markdown içeriğini esas al.
- 11 yaşa uygun fakat bebeksi olmayan dili koru.
- İngiliz İngilizcesi yazımını kullan.
- Manifest temasını dosyadaki kadar ve yalnız genel bağlamlarda kullan.
- Aynı soruyu farklı ekranlarda tekrar etme.
- Ara onay isteme ve ara rapor verme.

## Final raporu

Yalnızca tamamlandığında şunları bildir:

- Değiştirilen ve eklenen dosyalar
- `npm test` sonucu
- Toplam test sayısı
- Build sonucu
- ZIP dosyasının tam yolu
- Gerçekten kalan eksikler
