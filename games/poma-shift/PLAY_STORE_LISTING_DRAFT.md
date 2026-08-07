# POMA SHIFT — PLAY STORE LISTING DRAFT

**Status:** INTERNAL DRAFT  
**Updated:** 2026-08-07

Bu metin mevcut production davranışına göre hazırlanmıştır. Play Console'a göndermeden önce final app name, screenshots, privacy URL ve target-audience beyanıyla birlikte son kontrol yapılır.

## 1. POSITIONING

Current release positioning:
- broad casual puzzle
- simple one-finger placement
- short level loop + long progression
- differentiator: SHIFT board morph
- Poma IP = meta/progression layer; core boardu domine etmez

Kullanılmaması gereken store positioning:
- “çocuk oyunu” diye daraltma
- “eğitim oyunu / İngilizce öğreten oyun” iddiası
- para kazandırma / ödül kazanma gibi yanıltıcı ifade
- sınırsız ücretsiz booster / reklamsız gibi gerçek olmayan vaat

Recommended Play category:
- **Game → Puzzle**

Tags Play Console'daki mevcut seçeneklerden final aşamada seçilir; repo içinde olmayan tag uydurulmaz.

---

## 2. APP NAME

Current product name:

**Poma Shift**

Not: `GAME_SPEC.md` içindeki legacy “final name open” notu yayın öncesi master context ile reconcile edilmelidir. Android application ID zaten `com.pomante.pomashift`.

---

## 3. SHORT DESCRIPTION — TR

**3 parçayı yerleştir, satırları temizle, SHIFT ile değişen tahtayı yönet.**

Store character-limit kontrolü Play Console'a girişte tekrar yapılır.

---

## 4. LONG DESCRIPTION — TR

**Poma Shift**, her hamlede küçük bir yerleştirme problemi sunan casual bir puzzle oyunudur.

Üç parçadan birini seç, tahtaya yerleştir ve yatay satırları tamamen doldurarak temizle. Her 3 gerçek satır temizliğinde **SHIFT** gerçekleşir: oyun alanı genişler ama tavan aşağı iner. Alan büyürken güvenli bölge küçülür; doğru parçayı doğru anda kullanmak giderek daha önemli hale gelir.

### Oyunun öne çıkanları
- Tek parmakla sürükle-bırak oynanış
- Her tur 3 parçalık karar seti
- Yatay satır temizleme
- Oyunun şeklini değiştiren SHIFT sistemi
- Normal ve süreli RUSH bölümleri
- Uzun level haritası ve ilerleme sistemi
- Açılan Poma karakterleri ve opsiyonel güçler
- 3 güç slotuyla bölüm öncesi hazırlık
- Özel boss bölümleri; ilk boss Yapışkan Şeker Bulutu

### SHIFT'e dikkat
Her 3 satırdan sonra tahta bir sütun genişler ve bir satır alçalır. Üst risk bölgesini temizleyemezsen bloklar tavana sıkışabilir. Amaç yalnız satır temizlemek değil, bir sonraki SHIFT'i de planlamaktır.

### Güçlerini seç
İlerledikçe Bilgisayar, Telefon, Ok, Kurt Pençesi, Emzik Salyası, Asa Gücü, Alev Dalgası ve Sihirli Yaprak gibi farklı güçler açılır. Bölüme girmeden önce en fazla 3 gücü slotlarına ekleyebilirsin.

### RUSH bölümleri
Bazı bölümlerde bütün level için süre çalışır. Hedef SHIFT sayısına süre bitmeden ulaşman gerekir.

Poma Shift'in temel hedefi basit: **tahtayı oku, alanını koru ve bir SHIFT daha yap.**

---

## 5. STORE CLAIM CHECK

Bu metinde bilinçli olarak iddia edilmeyenler:
- “offline oyun” — final native/network davranışı ayrı doğrulanmadan yazılmaz
- “reklamsız” — uygulamada reklam sistemi vardır
- “ücretsiz tüm özellikler” — Coin/economy vardır
- “çocuklar için” — target broad casual
- “10.000 level hazır” — sistem 10.000+ direction/generator desteklese de listing'de doğrulanmamış içerik sayısı pazarlama iddiasına çevrilmez
- “en iyi / #1” gibi kanıtsız superlative

---

## 6. ADS / MONETIZATION CONSISTENCY

Play Console tarafında:
- Ads declaration gerçek AdMob entegrasyonuyla uyumlu olmalı
- rewarded reklamlar opsiyonel devam/can gibi mekaniklerde kullanılabilir
- interstitial placement mevcut production kuralına göre L5+ completion tarafındadır

Store copy reklamları saklayacak veya “reklamsız” izlenimi verecek şekilde yazılmaz.

---

## 7. TARGET AUDIENCE / CONTENT RATING INPUT

Current product decision:
- broad casual puzzle
- Poma görsel dili yumuşak/çocuk dostu olabilir; bu tek başına app'i child-directed-only yapmaz
- final Play Target Audience seçimi store screenshots, copy, ads configuration ve actual audience intent ile tutarlı olmalıdır

Before submission:
- [ ] Target Audience form
- [ ] Content Rating questionnaire
- [ ] Ads declaration
- [ ] Families policy applicability review

---

## 8. STORE ASSET COPY PLAN

### Screenshot 1
**3 PARÇA. TEK KARAR.**  
Board + tray, temiz başlangıç görünümü.

### Screenshot 2
**3 SATIR = SHIFT**  
SHIFT öncesi risk bandı + morph anı.

### Screenshot 3
**TAHTA BÜYÜR, TAVAN İNER**  
İki farklı board stage yan yana/ardışık anlatım.

### Screenshot 4
**3 GÜCÜNÜ SEÇ**  
Living lobby, inventory/shop ve 3 slot.

### Screenshot 5
**RUSH'TA SÜREYE KARŞI OYNA**  
Gerçek full-level RUSH HUD.

### Screenshot 6
**BOSS: YAPIŞKAN ŞEKER BULUTU**  
Level 90 boss HUD + real art.

Screenshotlarda DEV panel, demo-ad label, debug overlay, tarayıcı chrome'u veya sahte skor kullanılmaz.

---

## 9. FEATURE GRAPHIC DIRECTION

Final feature graphic için önerilen mesaj:

**POMA SHIFT**  
**Her 3 satırda oyun değişir.**

Görsel:
- koyu premium board
- morph/SHIFT hissi
- bir tarafta Poma küçük meta karakter olarak
- Poma boardu kaplamaz
- Sugar Cloud launch hero gibi kullanılmaz; boss sürpriz/ilerleme katmanı kalır

---

## 10. RELEASE BLOCKERS FOR LISTING

- [ ] final app-name reconciliation
- [ ] 512×512 Play icon
- [ ] adaptive launcher icon
- [ ] 1024×500 feature graphic
- [ ] clean phone screenshots from production/native build
- [ ] official support/developer contact
- [ ] public privacy-policy URL
- [ ] final Target Audience / Content Rating / Ads declarations

Bu maddeler tamamlanmadan listing “release ready” sayılmaz.
