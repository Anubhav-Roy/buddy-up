// buddyup — verifies a local's phone number with an SMS code. This is profile verification,
// not a way to sign in: Firebase Phone Auth sends the SMS and checks the code in a separate,
// temporary app session, and the phone-only Firebase user it creates is deleted straight
// after, so the number never becomes a login method and the person's real session is untouched.
// Firebase requires a reCAPTCHA, which runs invisibly on the "Send code" button. For free
// testing, add test numbers + fixed codes in Firebase console → Authentication → Sign-in
// method → Phone (real SMS needs the Blaze plan).
// Prototype only: production should confirm the result server-side (e.g. a Cloud Function
// that checks the temporary user's ID token) rather than trusting what the browser reports.
(function () {
  const SECONDARY = "buddyup-phone";
  let verifier = null, verifierEl = null, pending = null, pendingPhone = "", pendingAuth = null;

  const config = () => window.BUDDY_FIREBASE_CONFIG || {};
  // Verification always runs in its own app instance so it never affects the main sign-in.
  function secondaryAuth() {
    const fb = window.firebase;
    const app = fb.apps.find((a) => a.name === SECONDARY) || fb.initializeApp(config(), SECONDARY);
    return app.auth();
  }

  const ERRORS = {
    "auth/invalid-phone-number": "That phone number doesn't look right. Include your country code, e.g. +351 912 345 678.",
    "auth/missing-phone-number": "Please enter your phone number.",
    "auth/too-many-requests": "Too many attempts. Please wait a few minutes and try again.",
    "auth/quota-exceeded": "We've hit today's SMS limit. Please try again later.",
    "auth/captcha-check-failed": "The security check failed. Please try sending the code again.",
    "auth/invalid-verification-code": "That code doesn't match. Check the SMS and try again.",
    "auth/code-expired": "That code has expired. Tap “Send code” to get a new one.",
    "auth/missing-verification-code": "Please enter the 6-digit code from the SMS.",
    "auth/operation-not-allowed": "Phone verification isn't enabled in Firebase yet (Authentication → Sign-in method → Phone).",
    "auth/billing-not-enabled": "SMS needs the Firebase Blaze plan — or add a test number under Authentication → Sign-in method → Phone.",
    "auth/unauthorized-domain": "This website's address isn't authorised in Firebase yet (Authentication → Settings → Authorized domains).",
    "auth/network-request-failed": "Network error — check your connection and try again.",
  };
  const friendly = (e) => {
    console.warn("buddyup phone verification:", e?.code, e?.message);
    if (/region enabled/i.test(e?.message || "")) return "SMS to this country isn't enabled in Firebase yet (Authentication → Settings → SMS region policy).";
    return ERRORS[e?.code] || "We couldn't verify your number right now. Please try again.";
  };

  function clearVerifier() {
    try { verifier?.clear(); } catch { /* already cleared */ }
    verifier = null;
    verifierEl = null;
  }

  // The app re-renders with innerHTML, so the button the reCAPTCHA was bound to may be gone.
  function getVerifier(buttonEl, auth) {
    if (verifier && verifierEl === buttonEl && document.contains(buttonEl)) return verifier;
    clearVerifier();
    verifier = new window.firebase.auth.RecaptchaVerifier(buttonEl, { size: "invisible" }, auth);
    verifierEl = buttonEl;
    return verifier;
  }

  // Local testing only: numbers in BUDDY_TEST_PHONES (firebase-config.js) skip Firebase and
  // accept their fixed code. Ignored on any host other than localhost.
  const isLocalhost = () => ["localhost", "127.0.0.1"].includes(location.hostname);
  const testCode = (phone) => (isLocalhost() && (window.BUDDY_TEST_PHONES || {})[phone]) || "";

  function toE164(raw) {
    const s = String(raw || "").trim();
    if (!s.startsWith("+")) return "";
    const digits = s.replace(/\D/g, "");
    return digits.length >= 8 && digits.length <= 15 ? "+" + digits : "";
  }

  window.BuddyPhone = {
    // Test-only: lets the module run from a file:// test page with a mocked Firebase.
    _allowFileForTests: false,

    available() {
      const c = config();
      const served = location.protocol === "http:" || location.protocol === "https:" || this._allowFileForTests;
      return !!(window.firebase?.auth && c.apiKey && c.authDomain && served);
    },

    toE164,

    async send(rawPhone, buttonEl) {
      if (!this.available()) return { ok: false, error: "Phone verification isn't set up yet — buddyup needs Firebase configured and must be opened from a web address." };
      const phone = toE164(rawPhone);
      if (!phone) return { ok: false, error: ERRORS["auth/invalid-phone-number"] };
      pending = null;
      const code = testCode(phone);
      if (code) {
        pending = { test: true, code };
        pendingPhone = phone;
        return { ok: true };
      }
      try {
        pendingAuth = secondaryAuth();
        pending = await pendingAuth.signInWithPhoneNumber(phone, getVerifier(buttonEl, pendingAuth));
        pendingPhone = phone;
        return { ok: true };
      } catch (e) {
        clearVerifier();
        return { ok: false, error: friendly(e) };
      }
    },

    async confirm(code) {
      const c = String(code || "").trim();
      if (!pending) return { ok: false, error: "Tap “Send code” first so we can text you a code." };
      if (!/^\d{6}$/.test(c)) return { ok: false, error: ERRORS["auth/missing-verification-code"] };
      if (pending.test) {
        if (c !== pending.code) return { ok: false, error: ERRORS["auth/invalid-verification-code"] };
        const phone = pendingPhone;
        this.reset();
        return { ok: true, phone };
      }
      let result;
      try {
        result = await pending.confirm(c); // the code is right: the number is verified
      } catch (e) {
        return { ok: false, error: friendly(e) };
      }
      // Remove the temporary phone-only user so the number can't be used to sign in. Only
      // delete users created just now — never an existing account that happens to use it.
      if (result?.additionalUserInfo?.isNewUser) await result.user.delete().catch(() => {});
      await pendingAuth.signOut().catch(() => {});
      const phone = pendingPhone;
      pending = null;
      pendingAuth = null;
      clearVerifier();
      return { ok: true, phone };
    },

    reset() {
      pending = null;
      pendingPhone = "";
      pendingAuth = null;
      clearVerifier();
    },
  };
})();
