# SECURITY DEFINER Yetki Matrisi — 18 Temmuz 2026

Bu kayıt, `gzsrcjovhhlfpvvpucri` projesinin canlı `public` şemasında 18 Temmuz 2026 tarihinde yapılan salt-okunur katalog denetimini belgeler. Kapsam yalnız `pg_proc.prosecdef = true` olan fonksiyonlardır.

## Özet

| Ölçüm | Sonuç |
|---|---:|
| SECURITY DEFINER toplamı | 67 |
| PUBLIC execute | 0 |
| anon execute | 0 |
| authenticated execute | 51 |
| service_role execute | 3 |
| Internal-only | 13 |
| search_path eksik | 0 |
| search_path boş (`''`) | 40 |
| search_path `public` | 26 |
| search_path `pg_catalog` | 1 |

`PUBLIC`, `anon`, `authenticated` ve `service_role` rollerinin `public` şemasında `CREATE` yetkisi yoktur. “Internal” rolü, bu dört rolün hiçbirinde `EXECUTE` bulunmadığını; fonksiyonun trigger, başka bir fonksiyon veya veritabanı içi mekanizma tarafından çağrıldığını belirtir.

Risk seviyesi veri hassasiyeti ve mutasyon etkisini anlatır; tek başına açık bulgusu değildir. “Koru” kararı mevcut ACL ve yetkilendirme modelinin korunması anlamındadır.

## Admin-only RPC

| Fonksiyon | Argümanlar | Amaç | Çalıştırabilen rol | Yetkilendirme yöntemi | search_path | Veri kapsamı | Risk seviyesi | Karar |
|---|---|---|---|---|---|---|---|---|
| `admin_cancel_commission_payout` | `p_payout_id uuid, p_admin_note text` | Bekleyen payout'ı iptal eder | authenticated | Doğrudan `is_poma_admin()`; `auth.uid()` audit aktörü | boş | Tek payout ve bağlı kazançlar | Yüksek | Koru |
| `admin_complete_refund` | `p_refund_request_id uuid, p_refund_method text, p_refund_reference text, p_admin_note text` | Gerçek para gönderimi sonrası iadeyi tamamlayıp erişim ve komisyon etkilerini uygular | authenticated | Doğrudan `is_poma_admin()`; ödeme tutarı sunucudan ve talep durumundan doğrulanır | boş | Tek iade, bağlı erişim, reminder, komisyon ve audit | Yüksek | Koru; tamamlanmış çağrı idempotent |
| `admin_create_commission_payout` | `p_teacher_id uuid, p_period_start date, p_period_end date, p_admin_note text` | Komisyonları kilitleyip payout oluşturur | authenticated | Doğrudan `is_poma_admin()`; `auth.uid()` audit aktörü | boş | Bir öğretmen ve tarih dönemi | Yüksek | Koru |
| `admin_mark_commission_payout_paid` | `p_payout_id uuid, p_admin_note text` | Payout ve bağlı kazançları paid yapar | authenticated | Doğrudan `is_poma_admin()`; `auth.uid()` audit aktörü | boş | Tek payout ve bağlı kazançlar | Yüksek | Koru |
| `admin_resolve_refund_accounting_alert` | `p_alert_id uuid, p_resolution_note text` | Ödenmiş veya payout'a ayrılmış komisyon iade uyarısını çözer | authenticated | Doğrudan `is_poma_admin()`; zorunlu çözüm notu ve ortak audit | boş | Tek muhasebe uyarısı | Yüksek | Koru |
| `admin_review_refund` | `p_refund_request_id uuid, p_decision text, p_admin_note text` | İade talebini kabul, ret veya iptal eder | authenticated | Doğrudan `is_poma_admin()`; geçiş ve uygunluk yeniden doğrulaması | boş | Tek iade talebi ve olay/audit kaydı | Yüksek | Koru |
| `admin_set_teacher_approval` | `p_teacher_id uuid, p_status text, p_admin_note text` | Öğretmen onay durumunu değiştirir | authenticated | Oturum + doğrudan `is_poma_admin()` | boş | Tek öğretmen profili ve audit | Yüksek | Koru |
| `admin_upsert_teacher_partner` | `p_teacher_id uuid, p_partner_code text, p_status text, p_commission_rate numeric, p_access_ends_at timestamptz, p_admin_note text` | Partner durumunu ve erişimini yönetir | authenticated | Doğrudan `is_poma_admin()` | public | Tek öğretmen partner profili ve audit | Yüksek | Koru; ileride boş search_path adayı |
| `approve_payment` | `p_payment_request_id uuid, p_admin_note text` | Ödemeyi onaylama giriş noktası | authenticated | Dolaylı: `review_payment` → `is_poma_admin()` | public | Tek ödeme; abonelik/referral/kredi/komisyon yan etkileri | Yüksek | Koru; dolaylı kontrol doğrulandı |
| `reject_payment` | `p_payment_request_id uuid, p_admin_note text` | Ödemeyi reddetme giriş noktası | authenticated | Dolaylı: `review_payment` → `is_poma_admin()` | public | Tek ödeme | Yüksek | Koru; dolaylı kontrol doğrulandı |
| `list_admin_commission_payouts` | `p_status text` | Yönetici payout listesini döndürür | authenticated | Doğrudan `is_poma_admin()` | boş | Filtreli payout ve bağlı kazanç sayısı | Orta | Koru |
| `list_admin_audit_log` | `p_action text, p_entity_type text, p_limit integer` | Kritik yönetici mutasyonlarının ortak audit geçmişini listeler | authenticated | Oturum + doğrudan `is_poma_admin()`; tablo doğrudan erişime kapalı | boş | En yeni 1–200 minimize edilmiş audit kaydı | Yüksek | Koru; salt-okunur yönetici RPC'si |
| `list_admin_payments` | boş | Stale pending talepleri sona erdirip yönetici ödeme listesini döndürür | authenticated | Doğrudan `is_poma_admin()`; internal expiration helper | public | Ödeme, süre, plan, kullanıcı ve makbuz özeti | Yüksek | Koru; ileride boş search_path adayı |
| `list_admin_refunds` | boş | İade taleplerini, erişim etkisini, komisyonu ve açık muhasebe uyarısını listeler | authenticated | Doğrudan `is_poma_admin()` | boş | Tüm iade yönetim özeti | Yüksek | Koru; salt-okunur yönetici RPC'si |
| `list_admin_teacher_partners` | boş | Partner öğretmenleri listeler | authenticated | Doğrudan `is_poma_admin()` | public | Partner, referral ve komisyon özeti | Orta | Koru; ileride boş search_path adayı |
| `list_admin_teacher_profiles` | `p_status text` | Öğretmen başvurularını listeler | authenticated | Oturum + doğrudan `is_poma_admin()` | boş | Filtreli öğretmen profilleri | Orta | Koru |

## Kullanıcının kendi verisine bağlı RPC

| Fonksiyon | Argümanlar | Amaç | Çalıştırabilen rol | Yetkilendirme yöntemi | search_path | Veri kapsamı | Risk seviyesi | Karar |
|---|---|---|---|---|---|---|---|---|
| `create_family_child` | `p_name text, p_avatar_key text, p_birth_year smallint` | Veli için çocuk profili oluşturur | authenticated | `auth.uid()` ve parent/both hesap kontrolü | boş | Çağıranın aile profili | Orta | Koru |
| `join_class_by_code` | `p_child_id uuid, p_join_code text` | Yönetilen çocuğu sınıfa ekler | authenticated | Dolaylı: `can_manage_child` → `is_self_student` / `is_guardian_of_child`; hesap/action bazlı 5/15 dk rate limit | boş | Tek çocuk ve tek sınıf | Orta | Koru; dolaylı kontrol ve rate limit doğrulandı |
| `link_guardian_by_student_code` | `p_student_code text, p_relationship text` | Veli-öğrenci bağlantısı kurar | authenticated | `auth.uid()`; parent/both kontrolü; hesap/action bazlı 5/15 dk rate limit | boş | Tek öğrenci kodu ve çağıran guardian | Orta | Koru; rate limit doğrulandı |
| `mark_instagram_receipt_sent` | `p_payment_request_id uuid, p_instagram_username text` | Süresi geçmemiş pending ödeme bildirimini işaretler | authenticated | `auth.uid()` ile ödeme sahipliği; pending expiry kontrolü | public | Çağıranın tek ödeme talebi | Orta | Koru; receipt_sent korunur, expired işlem reddedilir |
| `register_payment_receipt` | `p_payment_request_id uuid, p_storage_path text, p_original_filename text, p_mime_type text, p_size_bytes bigint` | Süresi geçmemiş pending veya receipt_sent talebe makbuz metadata kaydı oluşturur | authenticated | `auth.uid()` ile ödeme ve storage yolu sahipliği; pending expiry kontrolü | public | Çağıranın tek ödeme/makbuz kaydı | Orta | Koru; receipt_sent ek dekont davranışı korunur |
| `request_refund` | `p_payment_request_id uuid, p_reason text` | Uygun onaylı ödeme için tam iade talebi oluşturur | authenticated | `auth.uid()` ile ödeme sahipliği; tutar sunucudan, aktif en son erişim dönemi ve tek açık/tamamlanmış talep kontrolü | boş | Çağıranın tek ödemesi ve bağlı erişim dönemi | Yüksek | Koru |

## Öğretmen/veli/sınıf yetki yardımcısı

| Fonksiyon | Argümanlar | Amaç | Çalıştırabilen rol | Yetkilendirme yöntemi | search_path | Veri kapsamı | Risk seviyesi | Karar |
|---|---|---|---|---|---|---|---|---|
| `can_manage_child` | `target_child_id uuid` | Çocuk yönetim yetkisini birleştirir | authenticated | Dolaylı: `is_self_student` veya `is_guardian_of_child` | boş | Tek çocuk için boolean | Düşük | Koru; kontrolsüz değildir |
| `has_active_teacher_access` | boş | Öğretmen mutasyon kapısını değerlendirir | authenticated | `auth.uid()` + approved öğretmen + active partner + süre | boş | Çağıran öğretmen için boolean | Orta | Koru |
| `is_approved_teacher` | `target_teacher_id uuid` | Onaylı öğretmeni doğrular | authenticated | `auth.uid()` varlığı + hedef profil durumu | boş | Tek öğretmen için boolean | Düşük | Koru |
| `is_current_user_in_class` | `target_class_id uuid` | Kullanıcının yönettiği çocuk üzerinden sınıf üyeliğini sınar | authenticated | Dolaylı: class_students → `can_manage_child` | boş | Tek sınıf için boolean | Düşük | Koru |
| `is_guardian_of_child` | `target_child_id uuid` | Guardian bağlantısını doğrular | authenticated | `auth.uid()` + guardian_students | boş | Tek çocuk için boolean | Düşük | Koru |
| `is_guardian_of_class` | `target_class_id uuid` | Guardian'ın sınıf erişimini doğrular | authenticated | Dolaylı: `is_current_user_in_class` → `can_manage_child` | boş | Tek sınıf için boolean | Düşük | Koru |
| `is_poma_admin` | boş | JWT app_metadata admin rolünü doğrular | authenticated | `auth.jwt()` içindeki güvenilir app_metadata | public | Çağıran için boolean | Orta | Koru; ileride boş search_path adayı |
| `is_self_student` | `target_child_id uuid` | Auth kullanıcısına bağlı öğrenci profilini doğrular | authenticated | `auth.uid()` + children.auth_user_id | boş | Tek çocuk için boolean | Düşük | Koru |
| `is_teacher_of_child` | `target_child_id uuid` | Öğretmen-çocuk sınıf bağını doğrular | authenticated | `auth.uid()` + sınıf/öğrenci ilişkisi | boş | Tek çocuk için boolean | Düşük | Koru |
| `is_teacher_of_class` | `target_class_id uuid` | Sınıf öğretmenini doğrular | authenticated | `auth.uid()` + classes.teacher_id | boş | Tek sınıf için boolean | Düşük | Koru |

## Ödeme ve partner RPC

| Fonksiyon | Argümanlar | Amaç | Çalıştırabilen rol | Yetkilendirme yöntemi | search_path | Veri kapsamı | Risk seviyesi | Karar |
|---|---|---|---|---|---|---|---|---|
| `create_payment_request` | `p_plan_code text, p_payment_method text, p_coupon_code text, p_instagram_username text, p_sender_name text, p_transfer_date date, p_partner_code text` | Kullanıcının stale pending taleplerini sona erdirip 72 saat geçerli ödeme talebi oluşturur | authenticated | `auth.uid()`; plan/kupon/partner iş kuralları; internal expiration helper | public | Çağıranın yeni ödeme talebi | Yüksek | Koru; ileride boş search_path adayı |
| `get_my_partner_access` | boş | Öğretmenin erişim durumunu döndürür | authenticated | `auth.uid()` ile kendi öğretmen/partner satırı | public | Çağıranın erişim özeti | Düşük | Koru; ileride boş search_path adayı |
| `get_my_partner_summary` | boş | Partner finans ve erişim özetini döndürür | authenticated | `auth.uid()` ile kendi partner verisi | boş | Çağıranın partner özeti | Orta | Koru |
| `list_my_commission_history` | boş | Öğretmenin komisyon geçmişini döndürür | authenticated | `auth.uid()` ile teacher_id | public | Çağıranın komisyonları | Orta | Koru; ileride boş search_path adayı |
| `list_my_partner_referrals` | boş | Öğretmenin referral geçmişini döndürür | authenticated | `auth.uid()` ile teacher_id | public | Çağıranın referral kayıtları | Orta | Koru; ileride boş search_path adayı |
| `quote_coupon` | `p_plan_code text, p_coupon_code text` | Kupon uygunluğu ve indirimi hesaplar | Internal | `auth.uid()` + plan, tarih ve kullanım limitleri; dış ACL kapalı | public | Çağıranın kupon kullanımı | Orta | Internal koru; `validate_coupon`/ödeme akışından çağrılır |
| `register_my_teacher_partner` | boş | Öğretmenin kendi partner profilini oluşturur | authenticated | `auth.uid()` + teacher_profiles varlığı | public | Çağıranın partner profili | Orta | Koru; ileride boş search_path adayı |
| `review_payment` | `p_payment_request_id uuid, p_decision text, p_admin_note text` | Stale pending talepleri sona erdiren ödeme kararı merkezi; ortak audit ve transactional e-posta outbox kaydı | Internal | Doğrudan `is_poma_admin()`; dış ACL kapalı; expired talep reddi | public | Ödeme, abonelik, referral, kredi, komisyon ve karar teslimat snapshot'ı | Yüksek | Internal koru; receipt_sent incelenebilir, wrapper'lar üzerinden çağrılır; outbox aynı transaction'da oluşur |
| `validate_coupon` | `p_plan_code text, p_coupon_code text` | Kupon sonucunu ve ödenecek tutarı döndürür | authenticated | Dolaylı: `quote_coupon` → `auth.uid()` ve kupon limitleri | public | Plan ve çağıranın kupon hakkı | Orta | Koru; dolaylı kontrol doğrulandı |
| `validate_partner_code` | `p_partner_code text` | Aktif/onaylı partner kodunu doğrular | authenticated | authenticated ACL + aktif partner/onaylı öğretmen filtresi | public | Kod için sınırlı ad/geçerlilik sonucu | Düşük | Koru; ileride boş search_path adayı |

## Rapor RPC

| Fonksiyon | Argümanlar | Amaç | Çalıştırabilen rol | Yetkilendirme yöntemi | search_path | Veri kapsamı | Risk seviyesi | Karar |
|---|---|---|---|---|---|---|---|---|
| `build_learning_report_payload` | `p_child_id uuid, p_period_type text, p_period_start date` | Rapor payload'unu hesaplar | Internal | `can_parent_access_learning_report_child`; dış ACL kapalı | public | Tek çocuk ve dönem | Yüksek | Internal koru |
| `can_parent_access_learning_report_child` | `p_child_id uuid` | Eski rapor sahiplik yardımcısı | Internal | `is_poma_admin()` veya `auth.uid()` guardian/aktif çocuk kontrolü | public | Tek çocuk için boolean | Orta | Internal koru |
| `generate_learning_report` | `p_child_id uuid, p_period_type text, p_period_start date` | Yetkili veli için snapshot üretir | authenticated | `auth.uid()` + güncel guardian sahipliği | public | Tek çocuk ve dönem snapshot'ı | Yüksek | Koru; ileride boş search_path adayı |
| `get_learning_report` | `p_report_id uuid` | Tek snapshot döndürür | authenticated | `auth.uid()` + güncel guardian/snapshot sahipliği | public | Tek rapor | Yüksek | Koru; ileride boş search_path adayı |
| `is_current_learning_report_guardian` | `p_child_id uuid` | Güncel veli sahipliğini doğrular | Internal | `auth.uid()` + parent/both + guardian + aktif çocuk | public | Tek çocuk için boolean | Orta | Internal koru |
| `list_my_learning_reports` | `p_child_id uuid` | Yetkili velinin raporlarını listeler | authenticated | `auth.uid()` + güncel guardian sahipliği | public | Tek çocuk raporları | Yüksek | Koru; ileride boş search_path adayı |
| `preview_learning_report` | `p_child_id uuid, p_period_type text, p_period_start date` | Snapshot yazmadan rapor önizler | authenticated | Dolaylı: `secure_learning_report_payload` → `auth.uid()` + güncel guardian | public | Tek çocuk ve dönem payload'u | Yüksek | Koru; dolaylı kontrol doğrulandı |
| `secure_learning_report_payload` | `p_child_id uuid, p_period_type text, p_period_start date` | Güvenli rapor payload katmanı | Internal | `auth.uid()` + `is_current_learning_report_guardian`; dış ACL kapalı | public | Tek çocuk ve dönem | Yüksek | Internal koru |

## Internal helper / trigger

| Fonksiyon | Argümanlar | Amaç | Çalıştırabilen rol | Yetkilendirme yöntemi | search_path | Veri kapsamı | Risk seviyesi | Karar |
|---|---|---|---|---|---|---|---|---|
| `ensure_child_student_code` | boş | Çocuk satırına öğrenci kodu atayan trigger | Internal | Trigger bağlamı; dış ACL kapalı | boş | Trigger'ın NEW çocuk satırı | Orta | Internal koru |
| `generate_payment_code` | boş | Benzersiz ödeme kodu üretir | Internal | Dış ACL kapalı; tablo default/iş akışı | public | Kod üretimi | Düşük | Internal koru |
| `generate_student_code` | boş | Benzersiz öğrenci kodu üretir | Internal | Dış ACL kapalı; trigger tarafından çağrılır | boş | Kod üretimi | Düşük | Internal koru |
| `handle_new_child` | boş | Yeni çocuk için bağlı kayıtları kuran trigger | Internal | Trigger bağlamı; dış ACL kapalı | boş | Trigger'ın NEW çocuk satırı | Orta | Internal koru |
| `handle_new_parent` | boş | Auth kullanıcısından parent/teacher/child profilleri üretir | Internal | Auth trigger bağlamı; dış ACL kapalı | boş | Trigger'ın NEW auth kullanıcısı | Yüksek | Internal koru |
| `rls_auto_enable` | boş | Yeni public tablolarında RLS'yi otomatik açar | Internal | Event trigger bağlamı; dış ACL kapalı | pg_catalog | DDL eventindeki tablolar | Yüksek | Internal koru |

## service_role E2E cleanup

| Fonksiyon | Argümanlar | Amaç | Çalıştırabilen rol | Yetkilendirme yöntemi | search_path | Veri kapsamı | Risk seviyesi | Karar |
|---|---|---|---|---|---|---|---|---|
| `service_cleanup_partner_e2e_run` | `p_run_id text` | Dar kapsamlı canlı partner E2E public, ortak audit ve payment delivery verisini temizler | service_role | `auth.jwt()->>'role' = 'service_role'`; sıkı run ID/domain/kullanıcı sınırı | boş | Yalnız metadata'sı tam run ID ile eşleşen en fazla üç test kullanıcısının kesin varlık kimlikleri | Yüksek | Koru; tek service_role RPC; audit ve delivery kalan sayılarını doğrular |
| `service_claim_membership_reminder_job` | `p_job_token uuid, p_limit integer` | Cron tarafından kuyruğa alınan üyelik bitiş hatırlatmalarını claim eder | service_role | `auth.jwt()->>'role' = 'service_role'`; 15 dakikalık tek kullanımlık token; entitlement yeniden doğrulaması | boş | En fazla 100 uygun delivery snapshot'ı; e-posta adresi dönmez | Yüksek | Koru; yüksek riskli fakat dar kapsamlı worker RPC'si |

## Dolaylı yetkilendirme zincirleri

- `approve_payment` → `review_payment` → `is_poma_admin()`
- `reject_payment` → `review_payment` → `is_poma_admin()`
- `preview_learning_report` → `secure_learning_report_payload` → `auth.uid()` + güncel guardian kontrolü
- `validate_coupon` → `quote_coupon` → `auth.uid()` + kupon kullanım limitleri
- `can_manage_child` → `is_self_student` / `is_guardian_of_child`
- `join_class_by_code` → `can_manage_child`

Bu wrapper ve bileşik yardımcılar, kendi tanımlarında doğrudan `auth.uid`, `auth.jwt` veya `is_poma_admin` metni bulunmasa bile kontrolsüz değildir.

## Denetim kararı

- PUBLIC veya anon açık SECURITY DEFINER bulunmadı.
- search_path eksik fonksiyon bulunmadı.
- `search_path=public` kullanan fonksiyonlar gelecekte boş search_path standardına geçirilebilir.
- Ancak public şemasında güvensiz rollerin CREATE yetkisi bulunmadığından bu, şu an acil açık değildir.
- Toplu fonksiyon yeniden yazımı bu görevde yapılmayacaktır.
- Security Advisor’ın authenticated SECURITY DEFINER uyarıları fonksiyon bazında bu yetkilendirme matrisiyle değerlendirilmelidir; authenticated ACL tek başına kontrolsüz erişim anlamına gelmez.

Tekrar denetim için [`scripts/security-definer-audit.sql`](../../scripts/security-definer-audit.sql) kullanılmalıdır.

Bu fazda eklenen `record_admin_audit` ve kimlik koruma trigger fonksiyonu `SECURITY INVOKER` olarak, boş `search_path` ve tüm API rollerine kapalı ACL ile çalışır; bu nedenle SECURITY DEFINER toplamına dahil değildir. Ortak audit payload'ları yalnız durum geçişi, kısa iş bağlamı ve yönetici notu gibi gerekli alanlarla sınırlandırılır.

Ödeme süresi fazında eklenen `expire_stale_payment_requests(uuid)` da `SECURITY INVOKER`, boş `search_path`, owner `postgres` ve tüm API rollerine kapalı internal helper'dır. Yalnız mevcut güvenli SECURITY DEFINER ödeme RPC'lerinden çağrılır; bu nedenle SECURITY DEFINER toplamı 52 olarak kalır. Yalnız süresi geçmiş `pending` talepleri `expired` yapar ve yalnız bu taleplerin kupon rezervasyonlarını serbest bırakır; `receipt_sent`, `approved` ve `rejected` kayıtları korunur.

Ödeme karar e-postası fazı yeni bir SECURITY DEFINER fonksiyon eklemez. Mevcut `review_payment`, başarılı approve/reject kararıyla aynı transaction içinde yalnız teslimat snapshot'ı oluşturur; gönderim ayrı, JWT ve `is_poma_admin()` ile korunan Edge Function üzerinden yapılır. SECURITY DEFINER toplamı 52 olarak kalır.

Üyelik bitiş hatırlatma fazı `service_claim_membership_reminder_job` fonksiyonunu ekler ve SECURITY DEFINER toplamını 53'e çıkarır. Cron runner ve enqueue fonksiyonu SECURITY INVOKER'dır. Cron, service-role anahtarını Vault'a kopyalamaz ve statik cron secret kullanmaz; bunun yerine en fazla 15 dakika geçerli, tek kullanımlık UUID job token üretir. Edge Function `verify_jwt=false` olsa da browser endpoint'i değildir: Origin reddedilir ve iş başlamadan önce token atomik olarak tüketilir. Claim sırasında aile üyeliği veya öğretmen erişimi tekrar doğrulanır; değişen veya geçersiz entitlement gönderilmeden skipped yapılır.

Tam iade fazı `request_refund`, `admin_review_refund`, `admin_complete_refund`, `admin_resolve_refund_accounting_alert` ve `list_admin_refunds` fonksiyonlarını ekler; SECURITY DEFINER toplamı 58 olur. Beşinin de PUBLIC/anon erişimi kapalı, yalnız authenticated ACL'si açık, `search_path` değeri boştur. Kullanıcı RPC'si `auth.uid()` sahipliğiyle; dört yönetici RPC'si doğrudan `is_poma_admin()` ile korunur.

## FAZ 2.1 eki — Haftalık veli raporları

| Fonksiyon | Argümanlar | Amaç | Çalıştırabilen rol | Yetkilendirme yöntemi | search_path | Veri kapsamı | Risk seviyesi | Karar |
|---|---|---|---|---|---|---|---|---|
| `record_student_learning_event` | `uuid,text,text,text,text,text,text,boolean` | Doğrulanmış öğrenme olayını append-only kaydeder | authenticated | `auth.uid()` veli/both ve güncel guardian ilişkisi; puan sunucuda hesaplanır, süre kabul edilmez | boş | Tek çocuk ve idempotency anahtarı | Yüksek | Koru |
| `generate_weekly_parent_report_for` | `uuid,uuid,date` | Olaylardan değişmez çocuk/hafta snapshot'ı üretir | Internal | Dış ACL kapalı; yalnız yetkili wrapper ve veritabanı runner'ı çağırır, guardian ilişkisini yeniden doğrular | boş | Tek çocuk ve tamamlanmış hafta | Yüksek | Internal koru |
| `generate_weekly_parent_report` | `uuid,date` | Veli veya admin için manuel haftalık rapor üretir | authenticated | `auth.uid()` guardian veya `is_poma_admin()`; dolaylı üretim helper'ı | boş | Tek çocuk ve hafta | Yüksek | Koru |
| `list_my_weekly_parent_reports` | `uuid` | Velinin kendi haftalık raporlarını listeler | authenticated | `auth.uid()` snapshot sahibi ve güncel guardian | boş | Veliye ait raporlar | Orta | Koru |
| `update_weekly_progress_email_preference` | `boolean` | Velinin ayrı haftalık e-posta tercihini değiştirir | authenticated | `auth.uid()` parent/both; hedef kullanıcı parametresi yok | boş | Yalnız çağıran veli | Orta | Koru |
| `admin_set_weekly_parent_reports_enabled` | `boolean` | Otomatik toplu gönderim anahtarını değiştirir | authenticated | Doğrudan `is_poma_admin()` | boş | Tek feature flag | Yüksek | Koru; varsayılan kapalı |
| `list_admin_weekly_report_deliveries` | `integer` | Teslimat durumlarını yöneticiye listeler | authenticated | Doğrudan `is_poma_admin()` | boş | En fazla 200 teslimat | Yüksek | Koru |
| `admin_retry_weekly_report_delivery` | `uuid` | Başarısız ve limiti dolmamış teslimatı yeniden kuyruğa alır | authenticated | Doğrudan `is_poma_admin()` | boş | Tek teslimat | Yüksek | Koru |
| `service_claim_weekly_parent_report_job` | `uuid,integer` | Worker için atomik ve sınırlı claim yapar | service_role | `auth.jwt()->>'role'='service_role'`, tek kullanımlık kısa ömürlü token ve sunucu feature flag kontrolü | boş | En fazla 100 uygun teslimat | Yüksek | Koru |

FAZ 2.1 ile toplam 67 olur: authenticated 51, service_role 3 ve internal-only 13. Dokuz yeni fonksiyonun tamamı boş `search_path` kullanır; PUBLIC/anon açık fonksiyon eklenmez. `generate_weekly_parent_report` → `generate_weekly_parent_report_for` zinciri kontrolsüz değildir: wrapper çağıranı doğrular, helper da snapshot sahipliğini güncel guardian ilişkisi üzerinden yeniden doğrular. Cron runner ve enqueue fonksiyonu `SECURITY INVOKER` olarak kalır. Otomatik gönderim anahtarı migration sonunda kapalıdır.
