# POMA SHIFT — ART DIRECTION / STATE LANGUAGE

**Status:** CURRENT VISUAL AUTHORITY

Bu dosya Poma Shift'in görsel durum dilini ve kozmetik yönünü sabitler. Ürün/genel durum için `POMA_SHIFT_MASTER_CONTEXT.md`, RUSH davranışı için `RUSH_RULES.md` otoritedir.

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
- tutorial, level map, sonuç ekranı, menu/loading, karakter milestone ve unlock alanlarında kullanılır

## 2. RENK DURUM DİLİ — LOCKED

### NORMAL / CONTROL
Ana duygu: sakinlik ve kontrol.
- lacivert / koyu mavi arka plan
- mavi UI vurguları
- normal göstergelerde mavi / teal
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

> SHIFT geldiğinde normal levelde üstteki gerçek 1 danger row, RUSH levelde üstteki gerçek 2 danger row güvenli değilse GAME OVER — MORPH CRUSH.

Danger bölgesi blokları güvenli biçimde silinip oyun devam etmez.

Oyuncunun kurtuluş yolu:
- SHIFT gelmeden önce aşağıda satır tamamlamak
- satır temizleyerek mevcut blok yapısını aşağı taşımak
- tavanla çarpışmadan alan açmak
- envanterde mevcut uygun boosterı kullanmak

Bu oyunun ana gerilim loop'udur.

## 4. SHIFT TEHDİT UX

Dış kesik / hayalet board çerçevesi kaldırıldı.

Görsel dil:
- normal: sakin board
- 1/3 sonrası: amber hazırlık
- 2/3: kırmızı alarm
- normal levelde üst 1 risk satırı görünür
- RUSH levelde üst 2 risk satırı görünür
- mesaj anlamı: "Tavan inecek; tehlike bölgesinde blok kalırsa kaybedersin."

"Bu satır silinir" gibi güvenli silme çağrışımı yapan copy kullanılmaz.

## 5. RUSH TIMER — LOCKED CURRENT RULE

RUSH davranışı için `RUSH_RULES.md` tek otoritedir.

Eski 7/6/5 saniyelik tray timer **kalıcı olarak iptal edilmiştir**.

Güncel görsel akış:
- Level 1–10 timer yok
- Level 11 ilk RUSH
- sonra 15, 20, 25, 30...; boss slotları hariç
- RUSH başlamadan önce kural kartı çıkar
- `BAŞLA` denmeden timer çalışmaz
- timer bütün leveli sayar
- Level 11: 60 saniye / 2 SHIFT
- Level 15–24: 50 saniye / 3 SHIFT
- Level 25–49: 45 saniye / 3 SHIFT
- Level 50+: 40 saniye / 4 SHIFT

Timer dili:
- normal kalan sürede mavi / teal
- son yaklaşık %30'da kırmızı critical state
- süre baskısı okunur ancak board readability bozulmaz

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
4. Coin / milestone / unlock varsa açık biçimde gösterilir
5. Sonraki Level ve Haritaya Bak aksiyonları çalışır

Harita progression:
- Level 1 aşağıda
- ilerleme yukarı doğru
- RUSH düğümleri özel işaretli
- boss düğümleri RUSH gibi gösterilmez
- karakter milestone hedefleri görünür

## 8. AUDIO DIRECTION — CURRENT

- haritada background music kullanılabilir
- gameplay'de SFX önceliklidir
- placement, line clear, SHIFT, fail, complete, booster ve boss olayları ayrı okunmalıdır
- kritik SFX gerektiğinde müziği duck edebilir
- ses aç/kapat zorunludur

## 9. LAUNCH POLISH ORDER

Yeni mekanik eklemeden önce görsel/ürün önceliği:
1. board yüzey derinliği
2. soft-plastic blok materyali
3. premium HUD sadeleştirme
4. SHIFT fiziksel kesilme / tavan hissi
5. renk paleti ve state-language polish
6. map / character milestone presentation final
7. unlock / reward modal final
8. Level 90 Sugar Cloud boss presentation final
9. fail / complete ekranı polish
10. ilk 10 level onboarding polish

Coin, booster, karakter, reklam ve boss sistemleri artık mevcut meta katmanıdır; bu dosyada "sonra eklenmeyecek" olarak değerlendirilmez.
