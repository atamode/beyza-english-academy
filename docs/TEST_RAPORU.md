# Sprint 2.1 Test Raporu

Test tarihi: 24 Haziran 2026

## Otomatik testler

`npm test`: **34 başarılı, 0 başarısız**.

Korunan 22 teste ek olarak şu kontroller çalıştı:

- Uygulama soruları ile ders sonu testlerinin tamamen farklı olması
- 25 soruluk genel sınavın yedi konuyu dengeli kapsaması
- Genel sınav kilidinin yedi ders tamamlanmadan açılmaması
- Genel sınavın yedi ayrı konu sonucu üretmesi
- Farklı derslerden yanlışların havuza eklenmesi ve doğru tekrarda çıkarılması
- Doğru çok adımlı etkinliklerin yanlışlıkla tekrar havuzuna alınmaması
- Her çalışma sayfasında 10 soru, en az üç tür ve ayrı cevap anahtarı
- Genel açıklama kalıplarının tekrarlanmaması
- 14. ekran başlık/içerik uyumu
- Bilinen konuşma ve zamir belirsizliklerinin giderilmesi
- Yedi dersin veli notlarının konuya özel olması

Final build: `4a6745add6a4`; 8 ders ve genel sınav dahil 35 öğe offline önbelleğe alındı. Source–dist eşitlik testi geçti.

## Manuel tarayıcı testleri

- Final build üzerinde Modül 1'in yedi dersi yeniden baştan sona çözüldü.
- Yedi ders tamamlanınca genel sınav açıldı; 25 soru, yedi etkinlik türüyle tamamlandı.
- Sonuç ekranında yedi konu ayrı gösterildi; sonuç 25/25 ve %100 olarak veli paneline yansıdı.
- Subject Pronouns dersinde yanlış cevap oluşturuldu; yanlış etkinlik tekrar havuzunda ders ve ekran adıyla açıldı.
- Önceden kalan birden fazla derse ait havuz öğeleri aynı oturumda çalışıldı; doğru cevaplardan sonra havuz sıfıra indi.
- Dersin 230 puan / 3 yıldız en iyi sonucu tekrar havuzundan etkilenmedi.
- Öğrenci çalışma sayfasında 10 soru, ad/tarih alanı ve yazma çizgileri görüldü; cevaplar görünmedi.
- Veli ekranında ayrı cevap anahtarı, modül sınavı ve konu sonuçları görüldü.
- Genel sınav sonucu sunucu kapalıyken yeniden açıldı.
- Çalışma sayfası 390×844, 768×1024, 1366×768 ve 1920×1080 boyutlarında taşma vermedi.
- Tarayıcı konsolunda hata görülmedi.

Manuel kontroller otomatik test sayısına dahil değildir.
