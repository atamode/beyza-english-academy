const e = v => String(v ?? "").replace(/[&<>\"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

export function authLandingView(message = "") {
  return `<section class="welcome account-auth"><article class="card hero"><div><p class="eyebrow">POMA ACADEMY</p><h1>Hesabına giriş yap.</h1><p class="lead">Öğrenci ilerlemesi, Kelime Ligi, futbol ve voleybol sonuçları artık seçili öğrenci profiline güvenli şekilde bağlanır.</p>${message ? `<p class="feedback incorrect">${e(message)}</p>` : ""}<div class="button-row"><button class="button primary" data-route="login">Giriş Yap</button><button class="button secondary" data-route="signup">Kayıt Ol</button></div></div><div class="hero-visual poma-hero-art" aria-hidden="true"><img src="assets/brand/poma-academy/poma-main-wave.png" alt=""></div></article></section>`;
}

export function loginView(message = "") {
  return `<section class="welcome account-auth"><article class="card"><p class="eyebrow">GİRİŞ</p><h1>Poma Academy hesabı</h1>${message ? `<p class="feedback incorrect">${e(message)}</p>` : ""}<form class="profile-form" data-account-form="login"><div class="field"><label>E-posta</label><input name="email" type="email" autocomplete="email" required></div><div class="field"><label>Şifre</label><input name="password" type="password" autocomplete="current-password" minlength="8" required></div><div class="button-row"><button class="button primary">Giriş yap</button><button type="button" class="button secondary" data-route="signup">Kayıt ol</button></div></form></article></section>`;
}

export function signupView(message = "") {
  return `<section class="welcome account-auth"><article class="card"><p class="eyebrow">KAYIT</p><h1>Yeni hesap oluştur</h1>${message ? `<p class="feedback incorrect">${e(message)}</p>` : ""}<form class="profile-form" data-account-form="signup"><div class="field"><label>Ad soyad</label><input name="displayName" maxlength="40" required></div><div class="field"><label>E-posta</label><input name="email" type="email" autocomplete="email" required></div><div class="field"><label>Şifre</label><input name="password" type="password" autocomplete="new-password" minlength="8" required></div><div class="field"><label>Hesap türü</label><select name="accountType" class="fill-input"><option value="parent">Veli</option><option value="teacher">Öğretmen</option><option value="student">Öğrenci</option></select></div><div class="button-row"><button class="button primary">Kayıt ol</button><button type="button" class="button secondary" data-route="login">Giriş yap</button></div></form></article></section>`;
}

export function roleSwitchView(account) {
  return `<section><div class="page-head"><div><p class="eyebrow">ROL SEÇ</p><h1>Merhaba ${e(account.profile.display_name)}</h1><p class="lead">Bu hesap hem aile profilleri hem öğretmen paneli kullanabilir.</p></div><button class="button secondary" data-action="account-logout">Çıkış</button></div><div class="analysis-grid grid"><article class="card"><h2>Aile profilleri</h2><p>Çocuk kartı seç, ilerlemeyi o öğrenciye bağla.</p><button class="button primary" data-route="profiles">Aile profilleri</button></article><article class="card"><h2>Öğretmen paneli</h2><p>Sınıflar, ödevler ve öğrenci raporları.</p><button class="button primary" data-route="teacher">Öğretmen paneli</button></article></div></section>`;
}

export function profileSelectorView(account, children, { lastId = null, needsMigration = false } = {}) {
  const cards = children.map(c => `<article class="card profile-card ${c.id === lastId ? "selected" : ""}"><div class="profile-avatar">${e((c.avatar_key || "P").slice(0, 1).toUpperCase())}</div><h2>${e(c.name)}</h2><p class="meta">Öğrenci kodu: <strong>${e(c.student_code || "hazırlanıyor")}</strong></p>${c.id === lastId ? "<span class='tag'>Son kullanılan</span>" : ""}<button class="button primary" data-child-id="${e(c.id)}">Devam Et</button></article>`).join("");
  return `<section><div class="page-head"><div><p class="eyebrow">PROFİL SEÇİMİ</p><h1>Kim çalışıyor?</h1><p class="lead">PIN yok, şifre yok. Kart seçilmeden öğrenci ana ekranı açılmaz.</p></div><div class="button-row"><button class="button secondary" data-route="account">Hesap</button><button class="button secondary" data-action="account-logout">Çıkış</button></div></div>${needsMigration ? `<article class="card feedback correct"><h2>Bu cihazdaki mevcut ilerleme bulundu.</h2><p>Bir çocuk kartı seçtiğinde istersen bu ilerlemeyi o profile aktarabilirsin.</p></article>` : ""}<div class="analysis-grid grid">${cards || "<article class='card'><h2>Henüz çocuk profili yok.</h2><p>Yeni çocuk kartı oluşturabilir veya öğrenci koduyla bağlanabilirsin.</p></article>"}</div><section class="card"><h2>Profil yönetimi</h2><form class="profile-form" data-account-form="create-child"><div class="field"><label>Çocuk adı</label><input name="name" maxlength="32" required></div><div class="field"><label>Doğum yılı</label><input name="birthYear" type="number" min="2008" max="2020"></div><button class="button primary">Çocuk profili oluştur</button></form><form class="profile-form" data-account-form="link-code"><div class="field"><label>Öğrenci kodu</label><input name="studentCode" maxlength="12" required></div><button class="button secondary">Öğrenci koduyla bağlan</button></form></section></section>`;
}

export function migrationConfirmView(child) {
  return `<section class="welcome"><article class="card"><p class="eyebrow">İLERLEME AKTARIMI</p><h1>Bu cihazdaki mevcut ilerleme bulundu.</h1><p class="lead">Bu ilerlemeyi ${e(child.name)} profiline aktaralım mı?</p><div class="button-row"><button class="button primary" data-action="migrate-yes" data-child-id="${e(child.id)}">Aktar</button><button class="button secondary" data-action="migrate-no" data-child-id="${e(child.id)}">Şimdilik aktarma</button></div></article></section>`;
}

export function accountHomeView(account, children = []) {
  return `<section><div class="page-head"><div><p class="eyebrow">HESAP</p><h1>${e(account.profile.display_name)}</h1><p class="lead">Hesap türü: ${e(account.profile.account_type)} · Bağlı öğrenci: ${children.length}</p></div><button class="button secondary" data-action="account-logout">Çıkış</button></div><div class="button-row"><button class="button primary" data-route="profiles">Profil seç</button>${["teacher","both"].includes(account.profile.account_type) ? `<button class="button secondary" data-route="teacher">Öğretmen paneli</button>` : ""}</div></section>`;
}

export function teacherStatusView(profile) {
  const status = profile?.approval_status || "pending";
  const text = {
    pending: "Öğretmen hesabınız yönetici onayı bekliyor.",
    rejected: "Öğretmen başvurunuz reddedildi. Lütfen yöneticiyle iletişime geçin.",
    suspended: "Öğretmen hesabınız askıya alınmış.",
    approved: "Öğretmen paneli hazır."
  }[status] || "Öğretmen durumu okunamadı.";
  if (status !== "approved") return `<section class="welcome"><article class="card"><p class="eyebrow">ÖĞRETMEN PANELİ</p><h1>${e(text)}</h1><p class="lead">Onay olmadan sınıf ve ödev yönetimi açılamaz.</p><button class="button secondary" data-route="account">Hesaba dön</button></article></section>`;
  return `<section><div class="page-head"><div><p class="eyebrow">ÖĞRETMEN PANELİ</p><h1>Sınıflar ve ödevler</h1><p class="lead">Öğrenci ilerlemesi salt okunur; aile e-postaları gösterilmez.</p></div><button class="button secondary" data-route="account">Hesap</button></div><section class="card"><h2>Yeni sınıf</h2><form class="profile-form" data-account-form="create-class"><div class="field"><label>Sınıf adı</label><input name="name" required></div><div class="field"><label>Seviye</label><input name="gradeLevel" placeholder="A1 / A2"></div><button class="button primary">Sınıf oluştur</button></form></section><section class="card" data-teacher-classes><h2>Sınıflar</h2><p>Sınıflar yüklendiğinde burada listelenir. Katılım kodu kopyalanabilir.</p></section></section>`;
}
