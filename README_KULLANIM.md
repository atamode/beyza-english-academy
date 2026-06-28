# Beyza English Academy — Kullanım Rehberi

Bu paket Sprint 1'in çalışan sürümüdür. İnternet gerektirmez; ilk çevrim içi/yerel açılıştan sonra uygulama dosyaları tarayıcı önbelleğine alınır.

## Windows'ta başlatma

1. ZIP dosyasını bir klasöre çıkarın.
2. `START_APP.bat` dosyasına çift tıklayın.
3. Uygulama `http://127.0.0.1:8765/` adresinde otomatik açılır.
4. Windows güvenlik uyarısı gösterirse yalnızca özel ağ erişimine izin vermek yeterlidir.

Başlatıcı önce `py`, sonra `python`, son olarak `node` komutunu dener. Python veya Node.js bulunamazsa ekranda kurulum uyarısı gösterir. Sunucuyu kapatmak için açılan komut penceresinde `Ctrl+C` kullanın.

## İlk kullanım

Öğrencinin adı ve yaşı girildikten sonra 25 soruluk seviye testi açılır. Her soru yanıtlanmalıdır; önceki soruya dönülebilir. Test sonunda toplam puan, düzey, konu bazlı doğrular ve geliştirilecek alanlar gösterilir. Yanlış sorularda seçilen cevabın neden uygun olmadığı Türkçe açıklanır.

Ana ekrandaki **Derse devam et** düğmesi 22 ekranlık “Present Simple — Olumlu Cümleler” dersini açar. Etkinlik tamamlanmadan sonraki ekrana geçilemez. Dinleme ekranında metin başta gizlidir; önce ses dinlenir, doğru yanıt sonrasında transkript açılabilir.

## Ekran araçları

- **Ses:** Dinleme ve İngilizce seslendirmeyi kapatır/açar.
- **Tema:** Açık ve koyu tema arasında geçer.
- **Tam ekran:** TV veya projeksiyonda tarayıcı çerçevesini gizler.
- **Veli Modu:** Hedef, anlatım notu, sorular, dinleme metni, değerlendirme ölçütü, çalışma sayfası ve ilerleme özetini gösterir.

Klavye ile `Tab` tuşu kullanılarak düğmeler arasında dolaşılabilir; `Enter` ve `Space` ile seçim yapılabilir.

## İlerleme ve sıfırlama

Test sonucu, ders ekranı, puan, yıldız, seri ve ayarlar bu tarayıcıdaki LocalStorage alanında saklanır. Sayfa yenilense veya bilgisayar yeniden başlatılsa da korunur. Tarayıcı verileri temizlenirse kayıt silinir. Veli Modu altındaki **Tüm ilerlemeyi sıfırla** düğmesi kontrollü sıfırlama yapar.

## Çevrimdışı kullanım

Uygulamayı en az bir kez `START_APP.bat` ile açın ve ana ekranın yüklenmesini bekleyin. PWA önbelleği hazırlandıktan sonra ağ bağlantısı kesilse bile aynı adresten açık sekme yenilenebilir. Başka bir bilgisayara taşırken ZIP içindeki tüm dosyaları birlikte kopyalayın.

## Sprint 2 kapsamı

Modül 1'in yedi dersi ve Sprint 1'deki Present Simple dersi yayımlanmıştır. Dersler ana ekrandaki gerçek curriculum kataloğundan dinamik yüklenir. Modül 1 normal akışta sırayla açılır; tanılama sonucu daha ileri bir yayımlanmış ders önerirse o ders doğrudan açılabilir.

Yeni veya değiştirilmiş derslerden sonra kök klasörde `npm run build` çalıştırılır. Build sistemi curriculum içindeki tüm yayımlanmış dersleri Service Worker listesine ve `dist/` klasörüne otomatik ekler.

## Sprint 2.1 kalite özellikleri

Modül 1'in yedi dersi tamamlanınca ana ekranda **Modül 1 Genel Tekrar** açılır. 25 soruluk sınavın sonucu yedi konu için ayrı ayrı öğrenci ve veli ekranında gösterilir.

Ders sırasında yanlış yapılan etkinlikler ana ekrandaki **Yanlışlarımı tekrar et** oturumunda bir araya gelir. Doğru çözülen öğe havuzdan çıkar; bu çalışma dersin daha önceki en iyi puanını değiştirmez.

Veli modunda her dersin **Öğrenci sayfasını aç** düğmesi 10 soruluk yazdırılabilir çalışmayı gösterir. Cevaplar öğrenci sayfasında bulunmaz; veli cevap anahtarı ayrı bölümden açılır.
