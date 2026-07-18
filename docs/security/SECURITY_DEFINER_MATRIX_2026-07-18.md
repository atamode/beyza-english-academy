# SECURITY DEFINER Yetki Matrisi — 18 Temmuz 2026

Bu kayıt, `gzsrcjovhhlfpvvpucri` projesinin canlı `public` şemasında 18 Temmuz 2026 tarihinde yapılan salt-okunur katalog denetimini belgeler. Kapsam yalnız `pg_proc.prosecdef = true` olan fonksiyonlardır.

## Özet

| Ölçüm | Sonuç |
|---|---:|
| SECURITY DEFINER toplamı | 51 |
| PUBLIC execute | 0 |
| anon execute | 0 |
| authenticated execute | 38 |
| service_role execute | 1 |
| Internal-only | 12 |
| search_path eksik | 0 |
| search_path boş (`''`) | 24 |
| search_path `public` | 26 |
| search_path `pg_catalog` | 1 |

`PUBLIC`, `anon`, `authenticated` ve `service_role` rollerinin `public` şemasında `CREATE` yetkisi yoktur. “Internal” rolü, bu dört rolün hiçbirinde `EXECUTE` bulunmadığını; fonksiyonun trigger, başka bir fonksiyon veya veritabanı içi mekanizma tarafından çağrıldığını belirtir.

Risk seviyesi veri hassasiyeti ve mutasyon etkisini anlatır; tek başına açık bulgusu değildir. “Koru” kararı mevcut ACL ve yetkilendirme modelinin korunması anlamındadır.

## Admin-only RPC

| Fonksiyon | Argümanlar | Amaç | Çalıştırabilen rol | Yetkilendirme yöntemi | search_path | Veri kapsamı | Risk seviyesi | Karar |
|---|---|---|---|---|---|---|---|---|
| `admin_cancel_commission_payout` | `p_payout_id uuid, p_admin_note text` | Bekleyen payout'ı iptal eder | authenticated | Doğrudan `is_poma_admin()`; `auth.uid()` audit aktörü | boş | Tek payout ve bağlı kazançlar | Yüksek | Koru |
| `admin_create_commission_payout` | `p_teacher_id uuid, p_period_start date, p_period_end date, p_admin_note text` | Komisyonları kilitleyip payout oluşturur | authenticated | Doğrudan `is_poma_admin()`; `auth.uid()` audit aktörü | boş | Bir öğretmen ve tarih dönemi | Yüksek | Koru |
| `admin_mark_commission_payout_paid` | `p_payout_id uuid, p_admin_note text` | Payout ve bağlı kazançları paid yapar | authenticated | Doğrudan `is_poma_admin()`; `auth.uid()` audit aktörü | boş | Tek payout ve bağlı kazançlar | Yüksek | Koru |
| `admin_set_teacher_approval` | `p_teacher_id uuid, p_status text, p_admin_note text` | Öğretmen onay durumunu değiştirir | authenticated | Oturum + doğrudan `is_poma_admin()` | boş | Tek öğretmen profili ve audit | Yüksek | Koru |
| `admin_upsert_teacher_partner` | `p_teacher_id uuid, p_partner_code text, p_status text, p_commission_rate numeric, p_access_ends_at timestamptz, p_admin_note text` | Partner durumunu ve erişimini yönetir | authenticated | Doğrudan `is_poma_admin()` | public | Tek öğretmen partner profili ve audit | Yüksek | Koru; ileride boş search_path adayı |
| `approve_payment` | `p_payment_request_id uuid, p_admin_note text` | Ödemeyi onaylama giriş noktası | authenticated | Dolaylı: `review_payment` → `is_poma_admin()` | public | Tek ödeme; abonelik/referral/kredi/komisyon yan etkileri | Yüksek | Koru; dolaylı kontrol doğrulandı |
| `reject_payment` | `p_payment_request_id uuid, p_admin_note text` | Ödemeyi reddetme giriş noktası | authenticated | Dolaylı: `review_payment` → `is_poma_admin()` | public | Tek ödeme | Yüksek | Koru; dolaylı kontrol doğrulandı |
| `list_admin_commission_payouts` | `p_status text` | Yönetici payout listesini döndürür | authenticated | Doğrudan `is_poma_admin()` | boş | Filtreli payout ve bağlı kazanç sayısı | Orta | Koru |
| `list_admin_payments` | boş | Yönetici ödeme listesini döndürür | authenticated | Doğrudan `is_poma_admin()` | public | Ödeme, plan, kullanıcı ve makbuz özeti | Yüksek | Koru; ileride boş search_path adayı |
| `list_admin_teacher_partners` | boş | Partner öğretmenleri listeler | authenticated | Doğrudan `is_poma_admin()` | public | Partner, referral ve komisyon özeti | Orta | Koru; ileride boş search_path adayı |
| `list_admin_teacher_profiles` | `p_status text` | Öğretmen başvurularını listeler | authenticated | Oturum + doğrudan `is_poma_admin()` | boş | Filtreli öğretmen profilleri | Orta | Koru |

## Kullanıcının kendi verisine bağlı RPC

| Fonksiyon | Argümanlar | Amaç | Çalıştırabilen rol | Yetkilendirme yöntemi | search_path | Veri kapsamı | Risk seviyesi | Karar |
|---|---|---|---|---|---|---|---|---|
| `create_family_child` | `p_name text, p_avatar_key text, p_birth_year smallint` | Veli için çocuk profili oluşturur | authenticated | `auth.uid()` ve parent/both hesap kontrolü | boş | Çağıranın aile profili | Orta | Koru |
| `join_class_by_code` | `p_child_id uuid, p_join_code text` | Yönetilen çocuğu sınıfa ekler | authenticated | Dolaylı: `can_manage_child` → `is_self_student` / `is_guardian_of_child`; hesap/action bazlı 5/15 dk rate limit | boş | Tek çocuk ve tek sınıf | Orta | Koru; dolaylı kontrol ve rate limit doğrulandı |
| `link_guardian_by_student_code` | `p_student_code text, p_relationship text` | Veli-öğrenci bağlantısı kurar | authenticated | `auth.uid()`; parent/both kontrolü; hesap/action bazlı 5/15 dk rate limit | boş | Tek öğrenci kodu ve çağıran guardian | Orta | Koru; rate limit doğrulandı |
| `mark_instagram_receipt_sent` | `p_payment_request_id uuid, p_instagram_username text` | Kullanıcının ödeme bildirimini işaretler | authenticated | `auth.uid()` ile ödeme sahipliği | public | Çağıranın tek ödeme talebi | Orta | Koru; ileride boş search_path adayı |
| `register_payment_receipt` | `p_payment_request_id uuid, p_storage_path text, p_original_filename text, p_mime_type text, p_size_bytes bigint` | Makbuz metadata kaydı oluşturur | authenticated | `auth.uid()` ile ödeme ve storage yolu sahipliği | public | Çağıranın tek ödeme/makbuz kaydı | Orta | Koru; ileride boş search_path adayı |

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
| `create_payment_request` | `p_plan_code text, p_payment_method text, p_coupon_code text, p_instagram_username text, p_sender_name text, p_transfer_date date, p_partner_code text` | Kullanıcının ödeme talebini oluşturur | authenticated | `auth.uid()`; plan/kupon/partner iş kuralları | public | Çağıranın yeni ödeme talebi | Yüksek | Koru; ileride boş search_path adayı |
| `get_my_partner_access` | boş | Öğretmenin erişim durumunu döndürür | authenticated | `auth.uid()` ile kendi öğretmen/partner satırı | public | Çağıranın erişim özeti | Düşük | Koru; ileride boş search_path adayı |
| `get_my_partner_summary` | boş | Partner finans ve erişim özetini döndürür | authenticated | `auth.uid()` ile kendi partner verisi | boş | Çağıranın partner özeti | Orta | Koru |
| `list_my_commission_history` | boş | Öğretmenin komisyon geçmişini döndürür | authenticated | `auth.uid()` ile teacher_id | public | Çağıranın komisyonları | Orta | Koru; ileride boş search_path adayı |
| `list_my_partner_referrals` | boş | Öğretmenin referral geçmişini döndürür | authenticated | `auth.uid()` ile teacher_id | public | Çağıranın referral kayıtları | Orta | Koru; ileride boş search_path adayı |
| `quote_coupon` | `p_plan_code text, p_coupon_code text` | Kupon uygunluğu ve indirimi hesaplar | Internal | `auth.uid()` + plan, tarih ve kullanım limitleri; dış ACL kapalı | public | Çağıranın kupon kullanımı | Orta | Internal koru; `validate_coupon`/ödeme akışından çağrılır |
| `register_my_teacher_partner` | boş | Öğretmenin kendi partner profilini oluşturur | authenticated | `auth.uid()` + teacher_profiles varlığı | public | Çağıranın partner profili | Orta | Koru; ileride boş search_path adayı |
| `review_payment` | `p_payment_request_id uuid, p_decision text, p_admin_note text` | Ödeme kararının merkezi iş mantığı | Internal | Doğrudan `is_poma_admin()`; dış ACL kapalı | public | Ödeme, abonelik, referral, kredi ve komisyon | Yüksek | Internal koru; wrapper'lar üzerinden çağrılır |
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
| `service_cleanup_partner_e2e_run` | `p_run_id text` | Dar kapsamlı canlı partner E2E public verisini temizler | service_role | `auth.jwt()->>'role' = 'service_role'`; sıkı run ID/domain/kullanıcı sınırı | boş | Yalnız metadata'sı tam run ID ile eşleşen en fazla üç test kullanıcısının bağlı public verisi | Yüksek | Koru; tek service_role RPC |

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
