import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { authLandingView, signupView } from "../js/account-views.js";

const renderSignup = coupon => {
  globalThis.sessionStorage = { getItem: () => coupon };
  return signupView();
};

test("auth landing leads with free signup and keeps login",()=>{const html=authLandingView();assert.match(html,/Ücretsiz hesabınızı oluşturun\./);assert.match(html,/data-route="signup">Ücretsiz Başla/);assert.match(html,/data-route="login">Giriş Yap/);});
test("signup keeps required identity fields accessible",()=>{const html=renderSignup("");for(const name of ["displayName","email","password"])assert.match(html,new RegExp(`name="${name}"`));assert.match(html,/autocomplete="name"/);assert.match(html,/aria-describedby="signup-password-help"/);assert.match(html,/En az 8 karakter\./);});
test("extra account fields remain in the form with parent first",()=>{const html=renderSignup("");assert.match(html,/<details class="signup-extra-options">/);assert.match(html,/name="accountType"[\s\S]*?<option value="parent">Veli hesabı \(önerilen\)<\/option>[\s\S]*?<option value="teacher">Öğretmen hesabı<\/option>[\s\S]*?<option value="student">Öğrenci hesabı<\/option>/);assert.match(html,/name="couponCode"/);});
test("coupon opens extra options and is HTML escaped",()=>{const html=renderSignup('POMA10"><script>');assert.match(html,/<details class="signup-extra-options" open>/);assert.match(html,/value="POMA10&quot;&gt;&lt;script&gt;"/);assert.doesNotMatch(html,/<script>/);});
test("signup conversion copy and actions are present",()=>{const html=renderSignup("");assert.match(html,/Başlangıç için kart bilgisi veya ödeme gerekmez\./);assert.match(html,/Ücretsiz Hesap Oluştur/);assert.match(html,/data-route="login">Zaten hesabım var/);});
test("account view source and dist are identical",()=>{assert.equal(fs.readFileSync(new URL("../js/account-views.js",import.meta.url),"utf8"),fs.readFileSync(new URL("../dist/js/account-views.js",import.meta.url),"utf8"));});
