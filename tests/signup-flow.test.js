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
test("student account is the visible default during the payment pause",()=>{const html=renderSignup("");assert.match(html,/name="accountType"[\s\S]*?<option value="student">Öğrenci hesabı<\/option>/);assert.doesNotMatch(html,/name="couponCode"|signup-extra-options/);});
test("signup conversion copy and actions are present",()=>{const html=renderSignup("");assert.match(html,/Öğrenci hesabını aç ve derslerine doğrudan geç/);assert.match(html,/Ücretsiz Hesap Oluştur/);assert.match(html,/data-route="login">Zaten hesabım var/);});
test("account view source and dist are identical",()=>{assert.equal(fs.readFileSync(new URL("../js/account-views.js",import.meta.url),"utf8"),fs.readFileSync(new URL("../dist/js/account-views.js",import.meta.url),"utf8"));});
