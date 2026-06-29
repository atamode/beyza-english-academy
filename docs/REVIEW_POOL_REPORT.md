# Tekrar Havuzu Test Sonucu

Yanlış yapılan ders etkinlikleri `lessonId + screenId` çiftiyle saklanır. Ana ekrandaki **Yanlışlarımı tekrar et** düğmesi farklı derslerden gelen öğeleri tek oturumda yükler.

Doğrulanan akış:

1. Subject Pronouns çoktan seçmeli sorusunda yanlış cevap verildi.
2. Havuzda ders ve etkinlik adı görüntülendi.
3. Farklı derslere ait eşleştirme kayıtlarıyla aynı oturum açıldı.
4. Her öğe doğru çözüldüğünde ilgili ID havuzdan çıkarıldı.
5. Oturum sonunda havuz sayısı sıfırlandı.
6. Dersin en iyi puanı ve yıldızı değişmedi.

Doğru eşleştirmelerde yalnız adım sayısının artması artık yanlış kayıt oluşturmuyor.
