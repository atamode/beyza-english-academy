# POMA SHIFT — ART DIRECTION / STATE LANGUAGE

**Status:** LOCKED FOR CURRENT MVP

Bu dosya Poma Shift'in görsel durum dilini ve kozmetik yönünü sabitler.

## 1. TEMEL SANAT YÖNÜ

Hedef görünüm:

> Premium casual / soft plastic blocks / koyu modern board.

Kaçınılacak:
- wireframe / CAD benzeri kesik dış board çizgileri
- fazla teknik açıklama
- düz ve cansız bloklar
- çocuk uygulaması gibi aşırı renkli UI
- sürekli kırmızı alarm atmosferi

Poma kullanımı:
- yaklaşık %80 bağımsız casual oyun
- yaklaşık %20 Poma marka/meta katmanı
- Poma board ve blokların üstüne basılmaz
- tutorial, level map, sonuç ekranı, menu/loading gibi alanlarda kullanılır

## 2. RENK DURUM DİLİ — LOCKED

### NORMAL / CONTROL
Ana duygu: sakinlik ve kontrol.
- lacivert / koyu mavi arka plan
- mavi UI vurguları
- normal timer mavi -> teal
- kırmızı normal durumda kullanılmaz

### POSITIVE / SUCCESS
Ana duygu: rahatlama ve başarı.
- teal / mint / yumuşak yeşil
- line clear, başarı feedback'i ve olumlu glow burada kullanılır

### WARNING
Ana duygu: yaklaşan risk.
- amber / sarı / turuncu
- SHIFT'e yaklaşırken ilk uyarı seviyesi
- kırmızıya geçmeden önce hazırlık sinyali

### CRITICAL DANGER
Ana duygu: gerçek ölüm baskısı.
- kırmızı yalnız burada kullanılır
- SHIFT tavan alarmı
- RUSH timer kritik son bölüm
- kaybetme eşiği

Kural:

> Kırmızı sürekli görünmez. Kırmızı nadir ve güçlü kalır.

## 3. SHIFT / TAVAN KURALI — LOCKED

Oyuncu doğal olarak aşağıdan yukarı doğru blok biriktirir.

- yatay satır tamamen dolunca satır anında temizlenir
- temizlenen her gerçek satır SHIFT sayacına +1 verir
- 3 gerçek satır clear = SHIFT
- SHIFT'te board +1 kolon genişler ve -1 satır kısalır
- hücre boyutu level boyunca sabit kalır; morph gözle gerçekten görünür

Kritik ölüm kuralı:

> SHIFT geldiğinde tavanın ineceği üst sırada tek bir blok bile varsa GAME OVER — MORPH CRUSH.

Üst satır blokları güvenli biçimde silinip oyun devam etmez.

Oyuncunun kurtuluş yolu:
- SHIFT gelmeden önce aşağıda satır tamamlamak
- satır temizleyerek mevcut blok yapısını aşağı taşımak
- tavanla çarpışmadan alan açmak

Bu oyunun ana gerilim loop'udur.

## 4. SHIFT TEHDİT UX

Dış kesik / hayalet board çerçevesi kaldırıldı.

Görsel dil:
- normal: sakin board
- 1/3 sonrası: amber hazırlık
- 2/3: kırmızı alarm
- üst risk satırı görünür
- mesaj anlamı: "Tavan inecek; burada blok varsa kaybedersin."

"Bu satır silinir" gibi güvenli silme çağrışımı yapan copy kullanılmaz.

## 5. RUSH TIMER — LOCKED

- Level 1–10 timer yok
- Level 11 ilk RUSH
- sonra seçili özel RUSH level düğümleri
- erken RUSH: yaklaşık 7 sn
- orta RUSH: 6 sn
- ileri RUSH: 5 sn

Timer batch geldiğinde değil, ilk parça yerleştirildikten sonra başlar.

Normal timer dili:
- mavi / teal

Kritik son bölüm:
- kırmızı
- timer son yaklaşık %35'inde heartbeat devreye girer

## 6. HEARTBEAT / IMMERSION

Amaç yalnız bilgi vermek değil, oyuncunun baskıyı hissetmesi.

Kritik RUSH anında:
- hafif kırmızı vignette nabzı
- çok küçük board scale/brightness çift vuruşu
- hafif çift kalp atışı sesi
- desteklenen telefonda kısa çift haptic

Ritim:

> DUM-dum ... bekle ... DUM-dum

Kurallar:
- parça yerleştirmeyi zorlaştıracak ekran sallanması yok
- SHIFT kritik alarmı aktifse iki efekt üst üste bindirilmez; SHIFT alarmı önceliklidir
- reduced-motion tercihine saygı gösterilir

## 7. LEVEL TAMAMLAMA

Hedef SHIFT sayısı level bitiş koşuludur.

Hedef tamamlanınca:
1. input kapanır / level kazanılır
2. final board morph kısa süre görünür kalır
3. sonuç ekranı açılır
4. Sonraki Level ve Haritaya Bak aksiyonları çalışır

Harita progression:
- Level 1 aşağıda
- ilerleme yukarı doğru
- RUSH düğümleri özel işaretli

## 8. KOZMETİK SONRAKİ SPRINT

Yeni mekanik eklenmeden önce öncelik:
1. board yüzey derinliği
2. soft-plastic blok materyali
3. premium HUD sadeleştirme
4. SHIFT fiziksel kesilme / tavan hissi
5. renk paleti ve state language polish

Yeni coin, power-up, joker, meta progression, shop veya karakter sistemi bu sprintte eklenmez.
