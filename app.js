// buddyup — front-end. Accounts, profiles, meetups, chat, reviews and files are stored in
// Firebase (Auth + Cloud Firestore) through the BuddyDB layer in db.js.
(function () {
  const app = document.getElementById("app");
  const modalRoot = document.getElementById("modal-root");
  const toastRoot = document.getElementById("toast-root");
  const { INTERESTS, LANGUAGES, ymd, addDays } = window.BuddyData;
  const DB = window.BuddyDB;

  // ---------- Utilities ----------
  const esc = (v) =>
    String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const initials = (name) => name.trim().split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  // "new york" -> "New York". Only upper-cases first letters, so "USA" stays "USA".
  const titleCase = (s) => String(s || "").trim().replace(/\s+/g, " ").replace(/(^|[\s\-(])(\p{L})/gu, (m, a, b) => a + b.toUpperCase());
  const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;
  const clock = (ts) => new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const shortTime = (ts) => (new Date(ts).toDateString() === new Date().toDateString() ? clock(ts) : new Date(ts).toLocaleDateString([], { day: "numeric", month: "short" }));

  const svg = (d, extra = "") => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" ${extra}>${d}</svg>`;
  const I = {
    back: svg('<path d="M15 18l-6-6 6-6"/>'),
    chev: svg('<path d="M9 18l6-6-6-6"/>'),
    home: svg('<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>'),
    calendar: svg('<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/>'),
    grid: svg('<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>'),
    chat: svg('<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.4A8 8 0 1 1 21 12z"/>'),
    shield: svg('<path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6l8-3z"/><path d="M9 12l2 2 4-4"/>'),
    user: svg('<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>'),
    pin: svg('<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>'),
    star: `<svg class="star" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/></svg>`,
    plane: svg('<path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4z"/>'),
    eye: svg('<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'),
    eyeOff: svg('<path d="M3 3l18 18"/><path d="M10.6 5.1A10 10 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.2 4M6.6 6.6A17 17 0 0 0 2 12s3.6 7 10 7a9.7 9.7 0 0 0 5.4-1.6"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>'),
    close: svg('<path d="M18 6L6 18M6 6l12 12"/>', 'stroke-width="2.2"'),
    more: svg('<circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/>', 'stroke-width="2.5"'),
    arrow: svg('<path d="M5 12h14M13 6l6 6-6 6"/>', 'stroke-width="2"'),
    search: svg('<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>'),
    smile: svg('<circle cx="12" cy="12" r="9"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><path d="M9 9h.01M15 9h.01"/>'),
    tick: `<svg class="tick" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="currentColor"/><path d="M7.5 12.5l3 3 6-6" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    google: `<svg viewBox="0 0 48 48" width="20" height="20"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>`,
    // Map pin (travel) holding two people (buddies).
    logo: `<svg viewBox="0 0 64 64"><path d="M32 4C20 4 11 13.2 11 24.6 11 39.5 32 60 32 60s21-20.5 21-35.4C53 13.2 44 4 32 4z" fill="#fff"/><circle cx="38" cy="19.5" r="4.6" fill="#ff8a5c"/><path d="M29.6 35.5c0-5.6 3.8-9 8.4-9s8.4 3.4 8.4 9z" fill="#ff8a5c"/><circle cx="26" cy="19.5" r="4.6" fill="#1fb393"/><path d="M17.6 35.5c0-5.6 3.8-9 8.4-9s8.4 3.4 8.4 9z" fill="#1fb393" stroke="#fff" stroke-width="1.6"/></svg>`,
  };
  const logo = (href = "#/") => `<a class="logo" href="${href}"><span class="logo-mark">${I.logo}</span>buddyup</a>`;

  function toast(msg) {
    const el = document.createElement("div");
    el.className = "toast";
    el.textContent = msg;
    toastRoot.appendChild(el);
    setTimeout(() => el.remove(), 3200);
  }

  function photo(p, size) {
    return `<img class="avatar" src="${esc(p.photo)}" alt="${esc(p.name)}" data-initials="${esc(initials(p.name))}" style="width:${size}px;height:${size}px" loading="lazy" />`;
  }
  const userAvatar = (u, size) => (u.photoURL
    ? `<img class="avatar" src="${esc(u.photoURL)}" alt="${esc(u.name)}" data-initials="${esc(initials(u.name))}" style="width:${size}px;height:${size}px" referrerpolicy="no-referrer"/>`
    : initialsAvatar(u.name, size));
  function initialsAvatar(name, size) {
    return `<div class="avatar avatar-initials" style="width:${size}px;height:${size}px;font-size:${Math.round(size / 2.8)}px">${esc(initials(name))}</div>`;
  }
  // Swap broken profile photos (offline, blocked CDN) for initials.
  document.addEventListener("error", (e) => {
    const img = e.target;
    if (img.tagName !== "IMG") return;
    if (!img.dataset.initials) return;
    const div = document.createElement("div");
    div.className = "avatar avatar-initials";
    div.style.cssText = img.style.cssText + `;font-size:${Math.round(parseInt(img.style.width || 54) / 2.8)}px`;
    div.textContent = img.dataset.initials;
    img.replaceWith(div);
  }, true);

  // People from Firestore may not have a photo yet; fall back to initials.
  const face = (p, size) => (p.photo ? photo(p, size) : initialsAvatar(p.name || "?", size));
  const fail = (e) => toast(e?.message && !e.code ? e.message : DB.friendlyError(e));
  // Firestore applies local writes immediately; give the listeners a tick to update the cache.
  const settle = () => new Promise((r) => setTimeout(r, 40));

  // ---------- State & routing ----------
  const state = {
    authTab: "signup", role: "traveller", interests: [], showPw: false,
    filter: null, chatSearch: "", pcAck: null, signingUp: false, screen: "",
    verify: null, results: null, thread: null, completing: new Set(),
  };

  // Routes: #/discover (trip) → #/discover/find → #/discover/<local|buddy>, #/availability, #/meetups,
  // #/messages[/<chatId>], #/safety, #/profile
  function route() {
    const [, page = "discover", id] = location.hash.split("/");
    return { page: page || "discover", id: id ? decodeURIComponent(id) : null };
  }
  const go = (hash) => { if (location.hash === hash) render(); else location.hash = hash; };
  window.addEventListener("hashchange", render);
  const me = () => DB.me();

  function render() {
    const { page, id } = route();
    if (state.thread && (page !== "messages" || id !== state.thread.id)) { state.thread.unsub(); state.thread = null; }
    if (!DB.ready) return renderSetupNeeded();
    const c = DB.cache;
    if (!c.authKnown || (c.uid && !c.loaded) || state.signingUp) return renderLoading();
    if (!c.uid) return renderLanding();
    if (!c.profile) return renderCompleteProfile();
    const user = me();
    if (user.mode === "local" && !user.verification?.completed) return renderVerify(user);
    if (page === "trip") return go("#/discover");
    if (user.availability) releaseCancelledSlots(user); // locals only have availability
    renderApp(user);
  }

  function renderLoading() {
    state.screen = "loading";
    app.innerHTML = `<div class="loading-screen"><span class="logo-mark big">${I.logo}</span><div class="spinner"></div></div>`;
  }

  function renderSetupNeeded() {
    state.screen = "setup";
    app.innerHTML = `
      <section class="verify-page"><div class="verify">
        ${logo()}
        <h1 style="margin-top:20px">Firebase isn't connected</h1>
        <p class="sub">buddyup stores accounts and profiles in Firebase. ${location.protocol === "file:" ? "Open it from a web address (run <code>node server.js</code> and visit http://localhost:5173) — it can't run as a file." : "Add your project details to <code>firebase-config.js</code> and reload."}</p>
      </div></section>`;
  }

  // Re-render only what depends on the data that changed, and never while someone is typing.
  DB.onChange((kind) => {
    if (kind?.error) return fail(kind.error);
    if (kind === "auth" || kind === "loaded") return render();
    if (!DB.cache.loaded) return;
    // Outside the app shell, only the loading / finish-profile screens react to data (the profile
    // appearing); forms like local verification must not re-render while someone fills them in.
    if (state.screen !== "app") { if (kind === "profile" && ["loading", "complete"].includes(state.screen) && !state.signingUp) render(); return; }
    if (kind === "meetups") autoComplete();
    updateNavBadges();
    const { page, id } = route();
    const typing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName || "");
    if (page === "messages") {
      refreshConvos(id);
      if (id && kind === "meetups") refreshMeetupBar(id);
      return;
    }
    const live = page === "meetups" || page === "profile" || (page === "discover" && me()?.mode === "local" && !id);
    if (live && !modalRoot.innerHTML && !typing) render();
  });

  // Confirmed meetups whose time has passed become "completed" so both sides can review.
  function autoComplete() {
    DB.cache.meetups.forEach((m) => {
      if (m.status === "confirmed" && DB.ms(m.slotEnd) < Date.now() && !state.completing.has(m.id)) {
        state.completing.add(m.id);
        DB.setMeetupStatus(m, "completed").catch(() => state.completing.delete(m.id));
      }
    });
  }

  // ---------- Illustrations ----------
  const ART = {
    mountains: `
      <svg viewBox="0 0 600 300" preserveAspectRatio="xMidYMid slice">
        <defs><linearGradient id="sky1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bff0df"/><stop offset="1" stop-color="#e6f7f2"/></linearGradient></defs>
        <rect width="600" height="300" fill="url(#sky1)"/>
        <circle cx="450" cy="85" r="30" fill="#ff8a5c"/>
        <path d="M0 190 L120 100 L200 150 L320 40 L420 140 L480 110 L600 170 V300 H0Z" fill="#6fd6b8"/>
        <path d="M290 72 L320 40 L352 86 L336 80 L322 96 L308 78Z" fill="#fff"/>
        <path d="M0 220 L100 170 L200 215 L300 160 L410 220 L510 185 L600 210 V300 H0Z" fill="#1fb393"/>
        <path d="M0 250 Q150 215 300 240 T600 235 V300 H0Z" fill="#149479"/>
        <g fill="#0f6f5b">${[25, 60, 95, 470, 505, 540, 575].map((x, i) => `<path d="M${x} ${250 - (i % 3) * 10} l13 40 h-26z M${x} ${235 - (i % 3) * 10} l10 28 h-20z"/>`).join("")}</g>
        <path d="M0 280 Q300 255 600 280 V300 H0Z" fill="#0f6f5b"/>
        <path d="M120 120 Q 250 30 420 70" stroke="#fff" stroke-width="2.5" stroke-dasharray="5 7" fill="none"/>
        <path d="M424 62 l14 6 -14 6 3 -6z" fill="#fff"/>
      </svg>`,
    city: `
      <svg viewBox="0 0 600 300" preserveAspectRatio="xMidYMid slice">
        <defs><linearGradient id="sky2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1fb393"/><stop offset="1" stop-color="#bff0df"/></linearGradient></defs>
        <rect width="600" height="300" fill="url(#sky2)"/>
        <circle cx="110" cy="80" r="40" fill="#fff" opacity=".35"/>
        <g fill="#159a7e" opacity=".55">${[[10, 140, 50], [70, 110, 40], [120, 150, 60], [190, 90, 45], [245, 130, 55], [310, 110, 40], [360, 150, 55], [425, 100, 50], [485, 140, 45], [540, 120, 60]].map(([x, y, w]) => `<rect x="${x}" y="${y}" width="${w}" height="${300 - y}"/>`).join("")}</g>
        <g fill="#0f6f5b">${[[0, 200, 70], [80, 180, 50], [220, 190, 60], [290, 215, 50], [345, 195, 55], [410, 210, 60], [480, 185, 50], [540, 205, 60]].map(([x, y, w]) => `<rect x="${x}" y="${y}" width="${w}" height="${300 - y}"/>`).join("")}<path d="M140 215 h70 v85 h-70z M175 175 l35 40 h-70z"/></g>
        <g fill="#ffe7a8">${Array.from({ length: 34 }, (_, i) => `<rect x="${8 + (i * 37) % 590}" y="${220 + ((i * 53) % 70)}" width="6" height="8" rx="1"/>`).join("")}</g>
        <path d="M220 110 c0-20 30-20 30 0 c0 15-15 30-15 30 s-15-15-15-30z" fill="#ff8a5c"/><circle cx="235" cy="110" r="6" fill="#fff"/>
        <path d="M350 75 c0-20 30-20 30 0 c0 15-15 30-15 30 s-15-15-15-30z" fill="#fff"/><circle cx="365" cy="75" r="6" fill="#1fb393"/>
        <path d="M240 145 Q300 70 360 110" stroke="#fff" stroke-width="2.5" stroke-dasharray="5 6" fill="none"/>
      </svg>`,
  };

  // ---------- Sign-in ----------
  // City suggestions on an input. `cityOnly` stores "Lisbon" instead of "Lisbon, Portugal".
  function suggestCities(input, cityOnly) {
    if (!input || !window.BuddyCities) return;
    BuddyCities.attach(input, { onPick: (c) => { if (cityOnly && c.city) input.value = c.city; } });
  }

  const socialButtons = (after) => `
    <div class="socials">
      <button type="button" class="social-btn" data-social="google">${I.google} Continue with Google</button>
    </div>
    <div class="divider">${after}</div>`;

  async function googleSignIn() {
    if (location.protocol === "file:") return toast("Google sign-in only works when buddyup is served from a web address (e.g. http://localhost:5173), not from a file.");
    try {
      await DB.signInGoogle(); // the auth listener takes it from here
      if (!location.hash.startsWith("#/")) location.hash = "#/discover";
    } catch (e) { fail(e); }
  }

  // Signed in (Google, or an email sign-up that didn't finish) but no buddyup profile yet.
  function renderCompleteProfile() {
    state.screen = "complete";
    const au = DB.currentAuthUser();
    const local = state.role === "local";
    const name = au.displayName || "";
    app.innerHTML = `
      <header class="nav"><div class="container">${logo()}<button class="btn btn-soft btn-sm" id="cancel">Cancel</button></div></header>
      <section class="verify-page">
        <div class="verify fade">
          <div class="complete-head">
            ${au.photoURL ? `<img class="avatar" src="${esc(au.photoURL)}" alt="" data-initials="${esc(initials(name || "?"))}" style="width:64px;height:64px" referrerpolicy="no-referrer"/>` : initialsAvatar(name || "?", 64)}
            <div><h1>Welcome${name ? `, ${esc(name.split(" ")[0])}` : ""}! 👋</h1>
            <p class="muted">Signed in${au.email ? ` as ${esc(au.email)}` : ""}. A few details to finish your buddyup profile.</p></div>
          </div>
          <form id="complete" novalidate>
            <div class="role-picker">
              <button type="button" class="role traveller ${!local ? "on" : ""}" data-role="traveller"><span class="ico">🎒</span><strong>Traveller</strong><small>Visiting a city, looking for a local or buddy</small></button>
              <button type="button" class="role local ${local ? "on" : ""}" data-role="local"><span class="ico">🏠</span><strong>Local</strong><small>I live here and love showing people around</small></button>
            </div>
            <div class="row">
              <div class="field"><label>Full name</label><input class="input" name="name" value="${esc(name)}" autocomplete="name" placeholder="Jane Cooper"/></div>
              <div class="field"><label>${local ? "City you live in" : "Where are you from?"}</label><input class="input" name="city" placeholder="${local ? "Lisbon" : "City or country"}"/></div>
            </div>
            <div class="field"><label>What are you into?</label>
              <div class="chips">${INTERESTS.slice(0, 10).map((t) => `<button type="button" class="chip ${state.interests.includes(t) ? "active" : ""}" data-interest="${esc(t)}">${esc(t)}</button>`).join("")}</div></div>
            <label class="check"><input type="checkbox" name="adult"/> I'm 18 or older and agree to the buddyup community guidelines.</label>
            <div class="error" id="err"></div>
            <button class="btn ${local ? "btn-coral" : "btn-primary"} btn-block" type="submit">${local ? "Continue to verification" : "Create my profile"} ${I.arrow}</button>
          </form>
        </div>
      </section>`;
    const form = $("#complete");
    suggestCities($('[name="city"]', form), local);
    $("#cancel").addEventListener("click", () => DB.signOut());
    bindRoleAndInterests(form, renderCompleteProfile, "#complete");
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const f = Object.fromEntries(new FormData(form));
      const err = $("#err");
      if (!f.name?.trim() || !f.city?.trim()) return (err.textContent = local ? "Please add your name and the city you live in." : "Please add your name and where you're from.");
      if (!f.adult) return (err.textContent = "You need to be 18+ and accept the guidelines.");
      try {
        await createProfileFor(au, { name: f.name.trim(), city: f.city });
        toast(local ? "Profile created — let's verify you're a local." : `Welcome to buddyup, ${f.name.trim().split(" ")[0]}! 🎉`);
        go("#/discover");
      } catch (ex) { err.textContent = DB.friendlyError(ex); }
    });
  }

  function createProfileFor(au, { name, city }) {
    const local = state.role === "local";
    return DB.createProfile(au.uid,
      { name, role: state.role, mode: state.role, interests: state.interests, from: local ? "" : titleCase(city), localCity: local ? titleCase(city) : "", photoURL: au.photoURL || "", available: true, trip: null },
      { email: au.email || "", verification: local ? { step: 0 } : null },
    );
  }

  // Role picker + interest chips shared by the sign-up and complete-profile forms.
  function bindRoleAndInterests(form, rerender, formSel) {
    $$("[data-role]", form).forEach((b) => b.addEventListener("click", () => {
      const values = Object.fromEntries(new FormData(form)); // keep typed values across the re-render
      state.role = b.dataset.role;
      rerender();
      Object.entries(values).forEach(([k, v]) => { const el = $(`${formSel} [name="${k}"]`); if (el && el.type !== "checkbox") el.value = v; });
    }));
    $$("[data-interest]", form).forEach((c) => c.addEventListener("click", () => {
      const t = c.dataset.interest;
      state.interests = state.interests.includes(t) ? state.interests.filter((x) => x !== t) : [...state.interests, t];
      c.classList.toggle("active");
    }));
  }

  // ---------- Landing (log in / sign up) ----------
  function renderLanding() {
    app.innerHTML = `
      <header class="nav"><div class="container">
        ${logo()}
        <nav class="landing-nav-links"><a href="#" data-scroll="how">How it works</a><a href="#" data-scroll="safety">Safety</a><a href="#" data-scroll="locals">For locals</a></nav>
        <div class="nav-right">
          <button class="btn btn-soft btn-sm" data-auth="login">Log in</button>
          <button class="btn btn-primary btn-sm" data-auth="signup">Sign up free</button>
        </div>
      </div></header>

      <section class="hero"><div class="container">
        <div class="fade">
          <h1>Explore any city with <em>someone who gets it.</em></h1>
          <p class="lead">Meet a verified local who'll show you the city they love — or pair up with a fellow traveller who's in town right now.</p>
          <div class="stats-row">
            <div><strong>Verified</strong><span>local hosts</span></div>
            <div><strong>2-way</strong><span>reviews</span></div>
            <div><strong>Free</strong><span>always</span></div>
          </div>
          <div class="hero-art">
            ${ART.city}
            <div class="float-card" style="left:20px;top:22px">🏠<div><b>Verified local</b><small>Residency, ID &amp; selfie checked</small></div></div>
            <div class="float-card" style="right:20px;bottom:24px;animation-delay:-3s">💬<div><b>Request accepted!</b><small>“Meet you at the café at 11?”</small></div></div>
          </div>
        </div>
        <div class="auth-card fade" style="animation-delay:.1s">
          <div class="tabs">
            <button data-tab="signup" class="${state.authTab === "signup" ? "on" : ""}">Sign up</button>
            <button data-tab="login" class="${state.authTab === "login" ? "on" : ""}">Log in</button>
          </div>
          <div id="auth-body">${state.authTab === "signup" ? signupForm() : loginForm()}</div>
        </div>
      </div></section>

      <section class="section white" id="how"><div class="container">
        <div class="section-head"><h2>How buddyup works</h2><p>Three steps from landing in a new city to exploring it with someone.</p></div>
        <div class="steps">
          <div class="step"><div class="num">1</div><h3>Tell us where you're going</h3><p>Sign up, then enter the city you're travelling to and what you're into.</p></div>
          <div class="step"><div class="num">2</div><h3>Find a local or a buddy</h3><p>Browse verified locals who'll show you around, or fellow travellers in town right now.</p></div>
          <div class="step"><div class="num">3</div><h3>Chat, then meet</h3><p>Send a request, plan in the in-app chat and meet somewhere public. If a local showed you around, tip generously!</p></div>
        </div>
      </div></section>

      <section class="section" id="safety"><div class="container">
        <div class="section-head"><h2>Safe by design</h2><p>Everyone deserves to explore without worrying. Here's how we keep buddyup safe.</p></div>
        <div class="safety-strip" style="margin-top:0">${safetyCards()}</div>
      </div></section>

      <section class="section white" id="locals"><div class="container">
        <div class="section-head"><h2>Love your city? Become a local.</h2><p>Meet people from around the world and show them the places you love. You can switch between traveller and local any time.</p></div>
        <div class="steps">
          <div class="step coral"><div class="num">🏠</div><h3>Prove your roots</h3><p>Tell us how long you've lived in the city (at least 6 months), your neighbourhood and postcode.</p></div>
          <div class="step coral"><div class="num">🧭</div><h3>Show your local knowledge</h3><p>Answer a few questions only a real local could — hidden spots, food, getting around.</p></div>
          <div class="step coral"><div class="num">🪪</div><h3>Verify your identity</h3><p>Phone, ID and a selfie check. Travellers only ever see verified locals.</p></div>
        </div>
        <div class="center" style="margin-top:34px"><button class="btn btn-coral" id="become-local">Sign up as a local</button></div>
      </div></section>

      <footer class="footer"><div class="container">${logo()}<span>© ${new Date().getFullYear()} buddyup · Prototype</span></div></footer>`;

    // In-page links scroll instead of using #anchors, which the hash router owns.
    $$("[data-scroll]").forEach((a) => a.addEventListener("click", (e) => { e.preventDefault(); document.getElementById(a.dataset.scroll).scrollIntoView({ behavior: "smooth" }); }));
    $$("[data-auth]").forEach((b) => b.addEventListener("click", () => switchAuth(b.dataset.auth, true)));
    $$(".tabs button").forEach((b) => b.addEventListener("click", () => switchAuth(b.dataset.tab)));
    $("#become-local").addEventListener("click", () => { state.role = "local"; switchAuth("signup", true); });
    bindAuth();
  }

  function switchAuth(tab, scroll) {
    state.authTab = tab;
    $$(".tabs button").forEach((b) => b.classList.toggle("on", b.dataset.tab === tab));
    $("#auth-body").innerHTML = tab === "signup" ? signupForm() : loginForm();
    bindAuth();
    if (scroll) $(".auth-card").scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function pwField(name, placeholder, autocomplete) {
    return `<div class="input-wrap"><input class="input" name="${name}" type="${state.showPw ? "text" : "password"}" placeholder="${placeholder}" autocomplete="${autocomplete}"/>
      <button type="button" class="eye" data-eye aria-label="Show password">${state.showPw ? I.eyeOff : I.eye}</button></div>`;
  }

  function signupForm() {
    const local = state.role === "local";
    return `
      <form id="signup" novalidate>
        <h2>Create your account</h2>
        <p class="sub">First, tell us who you are on buddyup. You can switch any time.</p>
        <div class="role-picker">
          <button type="button" class="role traveller ${!local ? "on" : ""}" data-role="traveller"><span class="ico">🎒</span><strong>Traveller</strong><small>Visiting a city, looking for a local or buddy</small></button>
          <button type="button" class="role local ${local ? "on" : ""}" data-role="local"><span class="ico">🏠</span><strong>Local</strong><small>I live here and love showing people around</small></button>
        </div>
        ${socialButtons("or sign up with your email")}
        <div class="row">
          <div class="field"><label>Full name</label><input class="input" name="name" autocomplete="name" placeholder="Jane Cooper"/></div>
          <div class="field"><label>${local ? "City you live in" : "Where are you from?"}</label><input class="input" name="city" placeholder="${local ? "Lisbon" : "City or country"}"/></div>
        </div>
        <div class="field"><label>Email</label><input class="input" name="email" type="email" autocomplete="email" placeholder="you@example.com"/></div>
        <div class="field"><label>Password</label>${pwField("password", "At least 8 characters", "new-password")}</div>
        <div class="field"><label>What are you into?</label>
          <div class="chips">${INTERESTS.slice(0, 10).map((t) => `<button type="button" class="chip ${state.interests.includes(t) ? "active" : ""}" data-interest="${esc(t)}">${esc(t)}</button>`).join("")}</div></div>
        <label class="check"><input type="checkbox" name="adult"/> I'm 18 or older and agree to the buddyup community guidelines.</label>
        <div class="error" id="err"></div>
        <button class="btn ${local ? "btn-coral" : "btn-primary"} btn-block" type="submit">${local ? "Continue to verification" : "Create account"} ${I.arrow}</button>
        ${local ? `<p class="hint center" style="margin-top:12px">🛡️ Locals complete a short verification so travellers know who they're meeting.</p>` : ""}
      </form>`;
  }

  function loginForm() {
    return `
      <form id="login" novalidate>
        <h2>Welcome back 👋</h2>
        <p class="sub">Log in to find your local or buddy.</p>
        ${socialButtons("or log in with your email")}
        <div class="field"><label>Email</label><input class="input" name="email" type="email" autocomplete="email" placeholder="you@example.com"/></div>
        <div class="field"><label>Password</label>${pwField("password", "••••••••", "current-password")}</div>
        <div class="error" id="err"></div>
        <button class="btn btn-primary btn-block" type="submit">Log in</button>
        <p class="center" style="margin-top:14px"><button type="button" class="link-btn" id="forgot">Forgot your password?</button></p>
      </form>`;
  }

  function bindAuth() {
    $$("[data-eye]").forEach((b) => b.addEventListener("click", () => {
      state.showPw = !state.showPw;
      b.previousElementSibling.type = state.showPw ? "text" : "password";
      b.innerHTML = state.showPw ? I.eyeOff : I.eye;
    }));
    $$("[data-social]").forEach((b) => b.addEventListener("click", googleSignIn));

    const signup = $("#signup");
    if (signup) {
      suggestCities($('[name="city"]', signup), state.role === "local");
      bindRoleAndInterests(signup, () => switchAuth("signup"), "#signup");
      signup.addEventListener("submit", async (e) => {
        e.preventDefault();
        const f = Object.fromEntries(new FormData(signup));
        const err = $("#err");
        const email = (f.email || "").trim();
        const local = state.role === "local";
        if (!f.name?.trim() || !f.city?.trim()) return (err.textContent = local ? "Please add your name and the city you live in." : "Please add your name and where you're from.");
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return (err.textContent = "That email doesn't look right.");
        if ((f.password || "").length < 8) return (err.textContent = "Password needs at least 8 characters.");
        if (!f.adult) return (err.textContent = "You need to be 18+ and accept the guidelines.");
        state.signingUp = true; // hold the loading screen until the profile exists
        render();
        try {
          const cred = await DB.signUpEmail(email, f.password);
          await cred.user.updateProfile({ displayName: f.name.trim() });
          await createProfileFor(cred.user, { name: f.name.trim(), city: f.city });
          cred.user.sendEmailVerification().catch(() => {});
          state.signingUp = false;
          toast(local ? "Account created — let's verify you're a local." : `Welcome to buddyup, ${f.name.trim().split(" ")[0]}! 🎉`);
          window.scrollTo(0, 0);
          go("#/discover");
        } catch (ex) {
          state.signingUp = false;
          render();
          const box = $("#err");
          if (box) box.textContent = DB.friendlyError(ex); else fail(ex);
        }
      });
    }

    const login = $("#login");
    login?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const f = Object.fromEntries(new FormData(login));
      try {
        await DB.signInEmail((f.email || "").trim(), f.password || "");
        state.filter = null;
        window.scrollTo(0, 0);
        location.hash = "#/discover";
      } catch (ex) { $("#err").textContent = DB.friendlyError(ex); }
    });
    $("#forgot")?.addEventListener("click", async () => {
      const email = ($('#login [name="email"]').value || "").trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return ($("#err").textContent = "Enter your email above, then tap “Forgot your password?”.");
      // Same message whether or not the account exists, so emails can't be probed.
      await DB.resetPassword(email).catch(() => {});
      toast(`If there's a buddyup account for ${email}, we've emailed a reset link.`);
    });
  }

  // ---------- Switching between traveller and local ----------
  async function switchMode(user, mode) {
    if (user.mode === mode) return;
    if (mode === "local" && !user.verification) return openBecomeLocal(user);
    DB.saveProfile({ mode }).catch(fail);
    state.filter = null;
    await settle();
    toast(mode === "traveller" ? "Switched to traveller mode 🎒" : user.verification.completed ? "Switched to local mode 🏠" : "Let's finish your local verification.");
    go("#/discover");
  }

  function openBecomeLocal(user) {
    openModal(`
      <button class="modal-close" data-close aria-label="Close">${I.close}</button>
      <div class="modal-body plain">
        <div class="become-ico">🏠</div>
        <h3>Become a local</h3>
        <p style="margin:8px 0 20px">Show travellers around the city you live in. We'll ask a few questions to confirm you really live there — it takes about 5 minutes. You can switch back to traveller mode any time.</p>
        <form id="become" novalidate>
          <div class="field"><label>Which city do you live in?</label><input class="input" name="city" placeholder="Lisbon"/></div>
          <div class="error" id="become-err"></div>
          <button class="btn btn-coral btn-block">Start verification ${I.arrow}</button>
        </form>
      </div>`);
    suggestCities($('#become [name="city"]'), true);
    $("#become").addEventListener("submit", async (e) => {
      e.preventDefault();
      const city = titleCase(e.target.city.value);
      if (!city) return ($("#become-err").textContent = "Please enter the city you live in.");
      DB.saveProfile({ localCity: city, mode: "local" }).catch(fail);
      DB.savePrivate({ verification: { step: 0 } }).catch(fail);
      closeModal();
      await settle();
      go("#/discover");
    });
  }

  // ---------- Local verification ----------
  const RESIDENCY = [
    { v: "lt6m", label: "Less than 6 months", score: 0 },
    { v: "6to12m", label: "6–12 months", score: 10 },
    { v: "1to3y", label: "1–3 years", score: 20 },
    { v: "3to10y", label: "3–10 years", score: 25 },
    { v: "10y", label: "10+ years", score: 30 },
    { v: "born", label: "Born & raised", score: 30 },
  ];
  const VERIFY_STEPS = [
    { title: "Your roots", sub: "How well do you know {city}? Be honest — this helps travellers trust you." },
    { title: "Local knowledge", sub: "A few questions only a real local could answer well. Our team reviews these." },
    { title: "Identity check", sub: "We verify every local's identity. Your documents are never shown to other users." },
    { title: "Safety pledge", sub: "buddyup only works if everyone feels safe. Please confirm the following." },
  ];

  function renderVerify(user) {
    state.screen = "verify";
    if (!state.verify || state.verify.uid !== user.uid) state.verify = { uid: user.uid, v: clone(user.verification || { step: 0 }) };
    const v = state.verify.v;
    // Live Firestore updates re-render this page; keep a pending SMS code unless the user or step changed.
    const phoneKey = user.uid + ":" + v.step;
    if (state.verify.phoneKey !== phoneKey) { BuddyPhone.reset(); v.codeSent = false; state.verify.sendError = ""; state.verify.phoneKey = phoneKey; }
    const s = VERIFY_STEPS[v.step];
    const last = v.step === VERIFY_STEPS.length - 1;
    const canTravel = user.role === "traveller" || !!user.trip;
    app.innerHTML = `
      <header class="nav"><div class="container">${logo()}
        ${canTravel ? `<button class="btn btn-soft btn-sm" id="to-traveller">🎒 Back to traveller mode</button>` : `<button class="btn btn-soft btn-sm" id="logout">Save &amp; log out</button>`}
      </div></header>
      <section class="verify-page">
        <div class="verify fade">
          <div class="verify-top"><span class="badge badge-local">🏠 Local verification · ${esc(user.localCity)}</span><span class="muted" style="font-size:13px">Step ${v.step + 1} of ${VERIFY_STEPS.length}</span></div>
          <div class="progress"><div style="width:${((v.step + 1) / VERIFY_STEPS.length) * 100}%"></div></div>
          <h1>${esc(s.title)}</h1>
          <p class="sub">${esc(s.sub.replace("{city}", user.localCity))}</p>
          <form id="vform" novalidate>
            ${verifyStepBody(v.step, { ...user, verification: v })}
            <div class="error" id="err"></div>
            <div class="step-nav">
              ${v.step > 0 ? `<button type="button" class="btn btn-soft" id="back">${I.back} Back</button>` : "<span></span>"}
              <button class="btn btn-primary" type="submit" id="next">${last ? "Submit for review" : "Continue"} ${I.arrow}</button>
            </div>
          </form>
        </div>
      </section>`;

    $$(".option").forEach((o) => o.addEventListener("click", () => {
      $$(".option").forEach((x) => x.classList.remove("on"));
      o.classList.add("on");
      $('[name="residency"]').value = o.dataset.v;
    }));
    $$(".chip input").forEach((inp) => inp.addEventListener("change", () => inp.parentElement.classList.toggle("active", inp.checked)));
    $('[name="langOther"]')?.addEventListener("change", (e) => {
      const box = $("#other-lang");
      box.hidden = !e.target.checked;
      if (e.target.checked) box.querySelector("input").focus();
    });
    $$(".upload input").forEach((inp) => inp.addEventListener("change", () => {
      const label = inp.closest(".upload");
      if (inp.files[0]) { label.classList.add("done"); label.querySelector(".label").textContent = "✓ " + inp.files[0].name + " — uploads when you continue"; }
    }));
    $("#sendcode")?.addEventListener("click", async () => {
      const btn = $("#sendcode"), err = $("#err");
      const phone = BuddyPhone.toE164($('[name="phone"]').value.trim());
      if (!phone) return (err.textContent = "Enter your mobile number with the country code, e.g. +351 912 345 678.");
      err.textContent = "";
      v.phone = phone;
      btn.disabled = true;
      btn.textContent = "Sending…";
      const r = await BuddyPhone.send(phone, btn);
      btn.disabled = false;
      btn.textContent = r.ok ? "Resend code" : "Send code";
      state.verify.sendError = r.ok ? "" : r.error;
      if (!r.ok) { v.codeSent = false; return (err.textContent = r.error); }
      v.codeSent = true;
      toast(`We've sent a 6-digit code to ${phone}.`);
    });
    $("#back")?.addEventListener("click", () => { v.step--; DB.savePrivate({ verification: v }).catch(fail); render(); });
    $("#logout")?.addEventListener("click", () => { BuddyPhone.reset(); DB.signOut(); go("#/"); });
    $("#to-traveller")?.addEventListener("click", () => switchMode(user, "traveller"));
    $("#vform").addEventListener("submit", (e) => { e.preventDefault(); submitVerifyStep(user, v, new FormData(e.target)); });
  }

  function verifyStepBody(step, user) {
    const v = user.verification;
    const city = esc(user.localCity);
    if (step === 0) {
      const pc = v.postcodeCheck;
      return `
      <div class="field"><label>How long have you lived in ${city}?</label></div>
      <input type="hidden" name="residency" value="${esc(v.residency || "")}"/>
      <div class="options">${RESIDENCY.map((r) => `<button type="button" class="option ${v.residency === r.v ? "on" : ""}" data-v="${r.v}">${r.label}</button>`).join("")}</div>
      <div class="row">
        <div class="field"><label>Neighbourhood you live in</label><input class="input" name="neighbourhood" value="${esc(v.neighbourhood)}" placeholder="e.g. Alfama"/></div>
        <div class="field"><label>Postal / ZIP code</label><input class="input" name="postcode" value="${esc(v.postcode)}" placeholder="e.g. 1100-095"/></div>
      </div>
      <div id="pc-result">${pc && pc.status !== "ok" ? postcodeNotice(pc) : ""}</div>
      <div class="field"><label>Languages you speak</label>
        <div class="chips">
          ${LANGUAGES.map((l) => `<label class="chip ${v.languages?.includes(l) ? "active" : ""}"><input type="checkbox" name="languages" value="${l}" ${v.languages?.includes(l) ? "checked" : ""}/>${l}</label>`).join("")}
          <label class="chip ${v.otherLanguages ? "active" : ""}"><input type="checkbox" name="langOther" ${v.otherLanguages ? "checked" : ""}/>Other</label>
        </div>
        <div id="other-lang" class="other-lang" ${v.otherLanguages ? "" : "hidden"}>
          <input class="input" name="otherLanguages" value="${esc(v.otherLanguages || "")}" placeholder="Which other languages? e.g. Catalan, Swahili"/>
          <p class="hint" style="margin-top:6px">Separate multiple languages with commas.</p>
        </div>
      </div>`;
    }
    if (step === 1) return `
      <div class="field"><label>Name 3 places in ${city} that locals love but tourists rarely find</label><textarea class="textarea" name="hiddenSpots" placeholder="A café, a viewpoint, a market…">${esc(v.hiddenSpots)}</textarea></div>
      <div class="field"><label>What's a must-try local dish, and where do you get the best one?</label><textarea class="textarea" name="localDish">${esc(v.localDish)}</textarea></div>
      <div class="field"><label>How would you get from the main train station to your neighbourhood using public transport?</label><textarea class="textarea" name="transit">${esc(v.transit)}</textarea></div>
      <p class="hint">Tip: specific answers (names, lines, streets) get approved faster.</p>`;
    if (step === 2) return `
      <div class="row">
        <div class="field"><label>Mobile number</label>
          <div class="otp-row"><input class="input" name="phone" value="${esc(v.phone)}" placeholder="+351 912 345 678"/><button type="button" class="btn btn-outline" id="sendcode">Send code</button></div></div>
        <div class="field"><label>6-digit code</label>${v.phoneVerified
          ? `<div class="check-result ok" style="margin:0">✓ ${esc(v.phone)} verified</div>`
          : `<input class="input" name="code" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="••••••"/>`}</div>
      </div>
      <label class="upload ${v.idFile ? "done" : ""}"><input type="file" name="idDoc" accept="image/*"/><span class="ico">🪪</span><span class="label">${v.idFile ? "✓ ID uploaded — choose a file to replace it" : "Upload a photo of a government ID or proof of address"}</span></label>
      <label class="upload ${v.selfieFile ? "done" : ""}"><input type="file" name="selfie" accept="image/*" capture="user"/><span class="ico">🤳</span><span class="label">${v.selfieFile ? "✓ Selfie uploaded — choose a file to replace it" : "Upload a selfie so we can match it to your ID"}</span></label>
      <p class="hint">🔒 Your ID and selfie are stored privately — only the buddyup review team can see them.</p>`;
    return `
      <label class="check"><input type="checkbox" name="p1"/> I'll meet travellers in public places, especially the first time.</label>
      <label class="check"><input type="checkbox" name="p2"/> I won't ask for payment. Tips are entirely voluntary and up to the traveller.</label>
      <label class="check"><input type="checkbox" name="p3"/> I'll respect boundaries and never pressure anyone into plans they're uncomfortable with.</label>
      <label class="check"><input type="checkbox" name="p4"/> I understand buddyup may run a background check and remove me for breaking the guidelines.</label>
      <div class="field" style="margin-top:8px"><label>Anything else travellers should know about you? (optional)</label>
        <textarea class="textarea" name="about" placeholder="I'm a teacher, I love jazz bars and I've hosted 20+ friends from abroad…">${esc(v.about)}</textarea></div>`;
  }

  // ---------- Postcode vs neighbourhood check ----------
  const haversineKm = (a, b) => {
    const rad = (d) => (d * Math.PI) / 180;
    const dLat = rad(b.lat - a.lat), dLon = rad(b.lon - a.lon);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
    return 6371 * 2 * Math.asin(Math.sqrt(h));
  };

  // Geocodes the neighbourhood and the postcode with OpenStreetMap Nominatim and
  // compares them. Prototype only: production should do this server-side with a
  // commercial geocoder (Nominatim allows ~1 request/second and no bulk use).
  async function checkPostcode(neighbourhood, postcode, city) {
    const base = "https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=1&";
    const lookup = async (qs) => {
      const res = await fetch(base + qs, { headers: { "Accept-Language": "en" } });
      if (!res.ok) throw new Error("geocoder " + res.status);
      const [hit] = await res.json();
      return hit && { lat: +hit.lat, lon: +hit.lon, address: hit.address || {} };
    };
    const norm = (s) => String(s || "").toUpperCase().replace(/[\s-]/g, "");
    try {
      const area = await lookup("q=" + encodeURIComponent(`${neighbourhood}, ${city}`));
      if (!area) return { status: "unknown", message: `We couldn't find “${neighbourhood}” in ${city}. Check the spelling, or continue and a reviewer will confirm it.` };
      await new Promise((r) => setTimeout(r, 1100));
      const place = await lookup(`postalcode=${encodeURIComponent(postcode)}&countrycodes=${encodeURIComponent(area.address.country_code || "")}`);
      const areaPc = norm(area.address.postcode), entered = norm(postcode);
      if (areaPc && areaPc === entered) return { status: "ok" };
      if (!place) {
        // Not every postcode is in OpenStreetMap; fall back to comparing postcode prefixes.
        const n = Math.max(3, entered.length - 2);
        if (areaPc && areaPc.slice(0, n) === entered.slice(0, n)) return { status: "ok" };
        return { status: "unknown", message: `We couldn't find postcode ${postcode} near ${neighbourhood}. Double-check it, or continue and a reviewer will confirm it.` };
      }
      const km = haversineKm(area, place);
      if (km <= 3) return { status: "ok", km };
      const a = place.address;
      const there = a.neighbourhood || a.quarter || a.suburb || a.village || a.city_district || a.borough;
      return { status: "mismatch", km, message: `Postcode ${postcode} is about ${km.toFixed(1)} km from ${neighbourhood}${there ? ` — it looks like it's in ${there}` : ""}. Please double-check, or continue and a reviewer will confirm it.` };
    } catch {
      return { status: "error", message: "We couldn't check your postcode right now, so a reviewer will confirm it manually." };
    }
  }

  const postcodeNotice = (pc) => pc.status === "ok"
    ? `<div class="check-result ok">✓ Postcode matches your neighbourhood.</div>`
    : `<div class="check-result warn">⚠️ ${esc(pc.message)}</div>`;

  async function submitVerifyStep(user, v, fd) {
    const err = $("#err");
    const btn = $("#next");
    const get = (k) => (fd.get(k) || "").toString().trim();
    err.textContent = "";
    const busy = (label) => { btn.disabled = !!label; btn.innerHTML = label || `${v.step === VERIFY_STEPS.length - 1 ? "Submit for review" : "Continue"} ${I.arrow}`; };

    if (v.step === 0) {
      if (!get("residency")) return (err.textContent = "Tell us how long you've lived here.");
      if (get("residency") === "lt6m") return (err.textContent = "Locals need to have lived in the city for at least 6 months. You can still use buddyup as a traveller and find a buddy!");
      const neighbourhood = titleCase(get("neighbourhood")), postcode = get("postcode");
      if (!neighbourhood || !postcode) return (err.textContent = "Please add your neighbourhood and postal code.");
      const other = fd.get("langOther") ? get("otherLanguages") : "";
      if (fd.get("langOther") && !other) return (err.textContent = "Tell us which other languages you speak.");
      const custom = other.split(",").map(titleCase).filter(Boolean);
      const languages = [...new Set([...fd.getAll("languages"), ...custom])];
      if (!languages.length) return (err.textContent = "Pick at least one language.");

      const key = `${neighbourhood}|${postcode}`.toLowerCase();
      if (v.postcodeCheck?.key !== key) {
        busy("Checking postcode…");
        v.postcodeCheck = { key, ...(await checkPostcode(neighbourhood, postcode, user.localCity)) };
        busy();
      }
      const pc = v.postcodeCheck;
      $("#pc-result").innerHTML = postcodeNotice(pc);
      // Mismatches are flagged, not blocked: the first click warns, a second click continues.
      if ((pc.status === "mismatch" || pc.status === "unknown") && state.pcAck !== key) {
        state.pcAck = key;
        btn.innerHTML = `Continue anyway ${I.arrow}`;
        return;
      }
      v.flags = (v.flags || []).filter((f) => f.type !== "postcode");
      if (pc.status !== "ok") v.flags.push({ type: "postcode", detail: pc.message });
      Object.assign(v, { residency: get("residency"), neighbourhood, postcode, languages, otherLanguages: other });
      DB.saveProfile({ languages, residency: v.residency }).catch(fail); // shown on the public profile
    } else if (v.step === 1) {
      const fields = ["hiddenSpots", "localDish", "transit"];
      if (fields.some((k) => get(k).length < 20)) return (err.textContent = "Please give a bit more detail (20+ characters each).");
      fields.forEach((k) => (v[k] = get(k)));
    } else if (v.step === 2) {
      if (!v.phoneVerified) {
        if (!v.codeSent) return (err.textContent = state.verify.sendError ? `The code wasn't sent: ${state.verify.sendError}` : "Tap “Send code” to get a code by SMS.");
        busy("Checking code…");
        const r = await BuddyPhone.confirm(get("code"));
        busy();
        if (!r.ok) return (err.textContent = r.error);
        v.phone = r.phone;
        v.phoneVerified = true;
        DB.savePrivate({ phone: r.phone, phoneVerifiedAt: Date.now() }).catch(fail);
        DB.saveProfile({ phoneVerified: true }).catch(fail);
      }
      const id = fd.get("idDoc"), selfie = fd.get("selfie");
      if (!v.idFile && !id?.name) return (err.textContent = "Please upload an ID or proof of address.");
      try {
        if (id?.name) { busy("Uploading ID…"); v.idFile = await DB.uploadVerificationFile("id", id); }
        if (selfie?.name) { busy("Uploading selfie…"); v.selfieFile = await DB.uploadVerificationFile("selfie", selfie); }
      } catch (ex) { busy(); return (err.textContent = ex?.code ? DB.friendlyError(ex) : ex.message); }
      busy();
    } else {
      if (!["p1", "p2", "p3", "p4"].every((k) => fd.get(k))) return (err.textContent = "Please accept all safety commitments.");
      v.about = get("about");
      v.completed = true;
      v.submittedAt = Date.now();
      v.trustScore = trustScore(v);
      DB.savePrivate({ verification: v }).catch(fail);
      DB.saveProfile({ trustScore: v.trustScore, bio: v.about || user.bio || "", localSubmittedAt: v.submittedAt }).catch(fail);
      state.verify = null;
      await settle();
      go("#/discover");
      return openModal(`
        <div class="modal-body plain center">
          <div class="ring lg" style="--p:${v.trustScore}"><span>${v.trustScore}</span></div>
          <h3 style="justify-content:center">You're in review! 🎉</h3>
          <p style="margin-top:8px">Your trust score is <b>${v.trustScore}/100</b>. Our team reviews new locals within 24 hours.
          Once approved, travellers in ${esc(user.localCity)} can find you and send you meetup requests.</p>
          <button class="btn btn-primary btn-block" style="margin-top:22px" data-close>Go to my dashboard</button>
        </div>`);
    }
    v.step++;
    DB.savePrivate({ verification: v }).catch(fail);
    window.scrollTo(0, 0);
    render();
  }

  function trustScore(v) {
    let s = RESIDENCY.find((r) => r.v === v.residency)?.score || 0;
    s += Math.min(25, Math.round((v.hiddenSpots.length + v.localDish.length + v.transit.length) / 12));
    if (v.phoneVerified) s += 15;
    if (v.idFile) s += 15;
    if (v.selfieFile) s += 10;
    if (v.languages?.length > 1) s += 5;
    if (v.flags?.length) s -= 10;
    return Math.max(0, Math.min(100, s));
  }

  // ---------- App shell ----------
  const unreadChat = (c) => {
    const lm = c.lastMessage, uid = DB.cache.uid;
    return !!lm && lm.from !== uid && (!c.readAt?.[uid] || DB.ms(lm.ts) > DB.ms(c.readAt[uid]));
  };
  const counts = () => {
    const uid = DB.cache.uid;
    const reviewedByMe = new Set(DB.cache.reviewsByMe.map((r) => r.meetupId));
    return {
      unread: DB.cache.chats.filter(unreadChat).length,
      meetups: DB.cache.meetups.filter((m) => (m.status === "completed" && !reviewedByMe.has(m.id)) || (m.status === "requested" && m.to === uid && bookable(m.slot))).length,
    };
  };

  function renderApp(user) {
    state.screen = "app";
    const { page, id } = route();
    const pages = { discover: discoverPage, availability: availabilityPage, meetups: meetupsPage, messages: messagesPage, safety: safetyPage, profile: profilePage };
    const current = pages[page] ? page : "discover";
    const isLocal = user.mode === "local";
    const n = counts();
    const links = [
      { key: "discover", label: isLocal ? "Dashboard" : "Discover", icon: isLocal ? I.home : I.grid },
      { key: "meetups", label: "Meetups", icon: I.calendar, count: n.meetups },
      { key: "messages", label: "Messages", icon: I.chat, count: n.unread },
      { key: "safety", label: "Safety", icon: I.shield },
      { key: "profile", label: "Profile", icon: I.user },
    ];
    app.innerHTML = `
      <header class="nav"><div class="container">
        ${logo("#/discover")}
        <nav class="nav-links">${links.map((p) => `
          <a href="#/${p.key}" class="${current === p.key || (current === "availability" && p.key === "discover") ? "on" : ""}" data-page="${p.key}">${p.icon}<span>${p.label}</span><b class="count" ${p.count ? "" : "hidden"}>${p.count || ""}</b></a>`).join("")}
        </nav>
        <div class="nav-right">
          <div class="mode-switch" role="group" aria-label="Switch mode">
            <button class="${!isLocal ? "on" : ""}" data-switch="traveller" title="Traveller mode">🎒<span> Traveller</span></button>
            <button class="${isLocal ? "on local" : ""}" data-switch="local" title="Local mode">🏠<span> Local</span></button>
          </div>
          <a class="user-pill" href="#/profile" title="${esc(user.name)}">${userAvatar(user, 36)}</a>
        </div>
      </div></header>
      <main class="container" id="page"></main>
      ${!["safety", "messages"].includes(current) ? `<a class="sos" href="#/safety" title="Safety centre">SOS</a>` : ""}`;
    $$("[data-switch]").forEach((b) => b.addEventListener("click", () => switchMode(me(), b.dataset.switch)));
    pages[current](user, $("#page"), id);
  }

  function updateNavBadges() {
    const n = counts();
    [["meetups", n.meetups], ["messages", n.unread]].forEach(([key, value]) => {
      const b = $(`[data-page="${key}"] .count`);
      if (b) { b.hidden = !value; b.textContent = value || ""; }
    });
  }

  function safetyCards() {
    return [["🛡️", "Verified locals", "Every local passes residency, knowledge and ID checks."],
      ["☕", "Meet in public", "First meetups should always be in busy public places."],
      ["💬", "Chat in-app first", "Get to know each other on buddyup before you meet."],
      ["⭐", "Reviews both ways", "Travellers and locals review each other after every meetup."]]
      .map(([e, t, s]) => `<div><span class="ico">${e}</span><strong>${t}</strong>${s}</div>`).join("");
  }

  const fmtDate = (d) => new Date(d).toLocaleDateString([], { day: "numeric", month: "short" });
  const fmtYmd = (s) => new Date(s + "T00:00").toLocaleDateString([], { day: "numeric", month: "short" });
  const tripDates = (t) => (t?.start ? `${fmtYmd(t.start)}${t.end ? ` – ${fmtYmd(t.end)}` : ""}` : "");

  // ---------- Dates & times ----------
  // Availability is stored per day as time ranges: { "YYYY-MM-DD": [["10:00", "14:00"], ...] }.
  // A bookable slot is "YYYY-MM-DD|HH:MM|HH:MM": an overlap of at least an hour that starts
  // at least 24 hours from now.
  const MIN_MEETUP = 60;
  const toMin = (t) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
  const toTime = (m) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
  const TIMES = Array.from({ length: 36 }, (_, i) => toTime(6 * 60 + i * 30)); // 06:00–23:30
  const slotTime = (slot, edge) => {
    const [d, from, to] = slot.split("|");
    const m = toMin(edge === "start" ? from : to);
    const t = new Date(d + "T00:00");
    t.setHours(Math.floor(m / 60), m % 60);
    return t;
  };
  const bookable = (slot) => slotTime(slot, "start") - Date.now() >= 864e5;
  const dayLabel = (d) => new Date(d + "T00:00").toLocaleDateString([], { weekday: "short", day: "numeric", month: "short" });
  const slotLabel = (slot) => { const [d, from, to] = slot.split("|"); return `${dayLabel(d)} · ${from}–${to}`; };
  const daysFrom = (start, n) => Array.from({ length: n }, (_, i) => addDays(start, i));
  const tomorrow = () => addDays(new Date(), 1);
  const clone = (o) => JSON.parse(JSON.stringify(o || {}));

  function mergeRanges(list) {
    const sorted = list.map(([a, b]) => [toMin(a), toMin(b)]).sort((x, y) => x[0] - y[0]);
    const out = [];
    sorted.forEach(([a, b]) => {
      const last = out[out.length - 1];
      if (last && a <= last[1]) last[1] = Math.max(last[1], b);
      else out.push([a, b]);
    });
    return out.map(([a, b]) => [toTime(a), toTime(b)]);
  }

  function subtractRanges([lo, hi], cuts) {
    let parts = [[lo, hi]];
    cuts.forEach(([c1, c2]) => {
      parts = parts.flatMap(([a, b]) => (c2 <= a || c1 >= b ? [[a, b]] : [[a, Math.min(b, c1)], [Math.max(a, c2), b]].filter(([x, y]) => y > x)));
    });
    return parts;
  }

  // Times free in both maps (minus anything already booked), from 24h out, at least an hour long.
  function matchWindows(mine = {}, theirs = {}, booked = []) {
    const earliest = new Date(Date.now() + 864e5);
    const earliestDay = ymd(earliest);
    const out = [];
    Object.keys(mine).forEach((d) => {
      if (!theirs[d] || d < earliestDay) return;
      const floor = d === earliestDay ? Math.ceil((earliest.getHours() * 60 + earliest.getMinutes()) / 30) * 30 : 0;
      const cuts = booked.filter((s) => s.startsWith(d + "|")).map((s) => s.split("|").slice(1).map(toMin));
      mine[d].forEach(([a1, a2]) => theirs[d].forEach(([b1, b2]) => {
        const lo = Math.max(toMin(a1), toMin(b1), floor), hi = Math.min(toMin(a2), toMin(b2));
        if (hi - lo < MIN_MEETUP) return;
        subtractRanges([lo, hi], cuts).forEach(([x, y]) => { if (y - x >= MIN_MEETUP) out.push(`${d}|${toTime(x)}|${toTime(y)}`); });
      }));
    });
    return [...new Set(out)].sort();
  }

  const windowsSummary = (windows, first, last) => {
    const days = Object.keys(windows).filter((d) => d >= first && d <= last && windows[d].length);
    const mins = days.reduce((s, d) => s + windows[d].reduce((x, [a, b]) => x + toMin(b) - toMin(a), 0), 0);
    return `${plural(days.length, "day")} · ${plural(Math.round(mins / 60), "hour")}`;
  };

  // Month calendar: pick a date, then add the time ranges you're free that day.
  // `windows` is edited in place; `booked` slots are shown but can't be removed.
  function mountCalendar(el, { from, to, windows, booked = [], repeat = true, onChange }) {
    const first = ymd(from), last = ymd(to);
    let month = new Date(from.getFullYear(), from.getMonth(), 1);
    let sel = first, fromT = "10:00", toT = "14:00";
    const inRange = (d) => d >= first && d <= last;
    const bookedOn = (d) => booked.filter((s) => s.startsWith(d + "|"));
    const opts = (val) => TIMES.map((t) => `<option ${t === val ? "selected" : ""}>${t}</option>`).join("");

    const draw = () => {
      const y = month.getFullYear(), m = month.getMonth();
      const lead = (new Date(y, m, 1).getDay() + 6) % 7;
      const cells = [...Array(lead).fill(null), ...Array.from({ length: new Date(y, m + 1, 0).getDate() }, (_, i) => ymd(new Date(y, m, i + 1)))];
      const weekday = new Date(sel + "T00:00").toLocaleDateString([], { weekday: "long" });
      const w = windows[sel] || [];
      el.innerHTML = `
        <div class="mcal-wrap">
          <div class="mcal">
            <div class="mcal-head">
              <button type="button" class="icon-btn" data-nav="-1" ${ymd(new Date(y, m, 0)) >= first ? "" : "disabled"} aria-label="Previous month">${I.back}</button>
              <b>${month.toLocaleDateString([], { month: "long", year: "numeric" })}</b>
              <button type="button" class="icon-btn" data-nav="1" ${ymd(new Date(y, m + 1, 1)) <= last ? "" : "disabled"} aria-label="Next month">${I.chev}</button>
            </div>
            <div class="mcal-week">${["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => `<span>${d}</span>`).join("")}</div>
            <div class="mcal-grid">${cells.map((d) => {
              if (!d) return "<span></span>";
              const dw = windows[d] || [];
              return `<button type="button" class="mday ${dw.length ? "has" : ""} ${d === sel ? "sel" : ""}" data-day="${d}" ${inRange(d) ? "" : "disabled"}>
                <span class="num">${+d.slice(8)}</span>
                ${dw.length ? `<span class="t">${dw[0][0]}–${dw[0][1]}</span>${dw.length > 1 ? `<span class="t">+${dw.length - 1} more</span>` : ""}` : ""}
                ${bookedOn(d).length ? `<span class="dot" title="Booked"></span>` : ""}
              </button>`;
            }).join("")}</div>
          </div>
          <div class="mcal-editor">
            <h4>${dayLabel(sel)}</h4>
            <div class="ranges">
              ${w.map(([a, b], i) => `<span class="range">${a} – ${b}<button type="button" data-del="${i}" aria-label="Remove ${a} to ${b}">${I.close}</button></span>`).join("")}
              ${bookedOn(sel).map((s) => `<span class="range booked">Booked ${s.split("|")[1]} – ${s.split("|")[2]}</span>`).join("")}
              ${!w.length && !bookedOn(sel).length ? `<p class="hint">No times added for this day.</p>` : ""}
            </div>
            <label class="mini-label">Add a time you're free</label>
            <div class="add-range">
              <select class="input" id="t-from" aria-label="From">${opts(fromT)}</select>
              <span>to</span>
              <select class="input" id="t-to" aria-label="To">${opts(toT)}</select>
              <button type="button" class="btn btn-primary btn-sm" id="t-add">Add</button>
            </div>
            <div class="error" id="t-err"></div>
            <div class="copy-row">
              ${repeat ? `<button type="button" class="chip" data-copy="week" ${w.length ? "" : "disabled"}>↻ Repeat every ${weekday}</button>` : ""}
              <button type="button" class="chip" data-copy="all" ${w.length ? "" : "disabled"}>Apply to all days</button>
              <button type="button" class="chip" data-copy="clear" ${w.length ? "" : "disabled"}>Clear this day</button>
            </div>
          </div>
        </div>`;

      $$("[data-nav]", el).forEach((b) => b.addEventListener("click", () => { month = new Date(y, m + +b.dataset.nav, 1); draw(); }));
      $$("[data-day]", el).forEach((b) => b.addEventListener("click", () => { sel = b.dataset.day; draw(); }));
      $$("[data-del]", el).forEach((b) => b.addEventListener("click", () => {
        windows[sel].splice(+b.dataset.del, 1);
        if (!windows[sel].length) delete windows[sel];
        changed();
      }));
      $("#t-from", el).addEventListener("change", (e) => (fromT = e.target.value));
      $("#t-to", el).addEventListener("change", (e) => (toT = e.target.value));
      $("#t-add", el).addEventListener("click", () => {
        if (toMin(toT) - toMin(fromT) < MIN_MEETUP) return ($("#t-err", el).textContent = "Make it at least an hour long.");
        windows[sel] = mergeRanges([...(windows[sel] || []), [fromT, toT]]);
        changed();
      });
      $$("[data-copy]", el).forEach((b) => b.addEventListener("click", () => {
        const kind = b.dataset.copy;
        if (kind === "clear") delete windows[sel];
        else {
          const dow = new Date(sel + "T00:00").getDay();
          for (let d = new Date(from); ymd(d) <= last; d = addDays(d, 1)) {
            if (kind === "all" || d.getDay() === dow) windows[ymd(d)] = clone(windows[sel]);
          }
        }
        changed();
      }));
    };
    const changed = () => { onChange?.(); draw(); };
    draw();
  }

  // ---------- Ratings & reviews ----------
  // Review documents store the reviewer's name and role so lists render without extra reads.
  const asReview = (r) => ({ name: r.fromName || "buddyup member", role: r.fromRole || "Traveller", rating: r.rating, text: r.text, ts: DB.ms(r.ts) });
  const ratingSummary = (list) => (list.length ? { avg: (list.reduce((s, r) => s + r.rating, 0) / list.length).toFixed(1), count: list.length } : { avg: null, count: 0 });
  const ratingText = (list) => {
    const s = ratingSummary(list);
    return `${I.star}<span>${s.count ? `<b>${s.avg}</b> · ${plural(s.count, "review")}` : "New · no reviews yet"}</span>`;
  };
  const stars = (n) => `<span class="stars">${[1, 2, 3, 4, 5].map((i) => `<svg viewBox="0 0 24 24" class="${i <= Math.round(n) ? "on" : ""}"><path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/></svg>`).join("")}</span>`;

  function reviewsBlock(list, emptyText) {
    const reviews = list.map(asReview).sort((a, b) => b.ts - a.ts);
    const s = ratingSummary(reviews);
    if (!s.count) return `<div class="reviews-empty">${I.star} ${emptyText}</div>`;
    return `
      <div class="reviews-summary"><strong>${s.avg}</strong><div>${stars(s.avg)}<span class="muted">${plural(s.count, "review")}</span></div></div>
      <div class="review-list">${reviews.map((r) => `
        <div class="review">
          <div class="review-top"><b>${esc(r.name)}</b><span class="badge ${r.role === "Local" ? "badge-local" : "badge-buddy"}">${esc(r.role)}</span>${stars(r.rating)}<span class="muted">${fmtDate(r.ts)}</span></div>
          <p>${esc(r.text)}</p>
        </div>`).join("")}</div>`;
  }

  // Fill every [data-rating-for] placeholder on the page with that person's rating.
  async function fillRatings(root) {
    const els = $$("[data-rating-for]", root);
    if (!els.length) return;
    const reviews = await DB.reviewsFor(els.map((e) => e.dataset.ratingFor)).catch(() => []);
    els.forEach((e) => (e.innerHTML = ratingText(reviews.filter((r) => r.to === e.dataset.ratingFor))));
  }

  // ---------- Meetups ----------
  const other = (m) => m.participants.find((p) => p !== DB.cache.uid);
  // The other person in a meetup or chat, from the snapshot saved on the document.
  const otherPerson = (doc) => {
    const uid = other(doc);
    const p = doc.people?.[uid] || {};
    return { uid, id: uid, name: p.name || "buddyup member", photo: p.photo || "", from: p.from || "", city: p.city || "", label: p.label || "Buddy" };
  };
  const labelBadge = (label) => `<span class="badge ${label === "Local" ? "badge-local" : "badge-buddy"}">${esc(label)}</span>`;
  const STATUS = { requested: ["Waiting for reply", "badge-wait"], confirmed: ["Confirmed", "badge-buddy"], completed: ["Completed", "badge-buddy"], declined: ["Declined", "badge-wait"], cancelled: ["Cancelled", "badge-wait"] };
  const myReviewOf = (m) => DB.cache.reviewsByMe.find((r) => r.meetupId === m.id);
  const theirReviewOf = (m) => DB.cache.reviewsToMe.find((r) => r.meetupId === m.id);

  const notStarted = (m) => slotTime(m.slot, "start") > Date.now();

  function meetupActions(m, { chat = true } = {}) {
    const uid = DB.cache.uid;
    let a = chat ? `<a class="btn btn-soft btn-sm" href="#/messages/${encodeURIComponent(m.chatId)}">${I.chat} Chat</a>` : "";
    if (m.status === "requested" && m.to === uid && bookable(m.slot)) a += `<button class="btn btn-soft btn-sm" data-act="decline">Decline</button><button class="btn btn-primary btn-sm" data-act="accept">Accept</button>`;
    if (m.status === "requested" && m.from === uid && notStarted(m)) a += `<button class="btn btn-soft btn-sm" data-act="cancel">Cancel request</button>`;
    if (m.status === "confirmed" && notStarted(m)) a += `<button class="btn btn-soft btn-sm" data-act="cancel">Cancel meetup</button>`;
    if (m.status === "completed" && !myReviewOf(m)) a += `<button class="btn btn-primary btn-sm" data-act="review">${I.star} Rate &amp; review</button>`;
    return a;
  }

  function meetupRow(m) {
    const p = otherPerson(m);
    const [label, cls] = STATUS[m.status] || ["", ""];
    const mine = myReviewOf(m), theirs = theirReviewOf(m);
    const expired = m.status === "requested" && !bookable(m.slot);
    return `
      <article class="meetup-row" data-id="${esc(m.id)}">
        <span data-act="profile" style="cursor:pointer">${face(p, 52)}</span>
        <div class="grow">
          <div class="req-top"><strong>${esc(p.name)}</strong> ${labelBadge(p.label)} <span class="badge ${cls}">${expired ? "Expired" : label}</span></div>
          <div class="req-dates">📅 ${slotLabel(m.slot)}${p.city ? ` · ${esc(p.city)}` : ""}</div>
          ${m.status === "requested" && m.to === DB.cache.uid ? `<p class="req-msg">“${esc(m.message)}”</p>` : ""}
          ${m.status === "cancelled" && m.cancelReason ? `<p class="req-msg">${m.cancelledBy === DB.cache.uid ? "You cancelled" : `${esc(p.name)} cancelled`}: “${esc(m.cancelReason)}”</p>` : ""}
          ${mine ? `<div class="mini-review">You rated ${esc(p.name)} ${stars(mine.rating)} <span class="muted">“${esc(mine.text)}”</span></div>` : ""}
          ${theirs ? `<div class="mini-review">${esc(p.name)} rated you ${stars(theirs.rating)} <span class="muted">“${esc(theirs.text)}”</span></div>` : ""}
          ${m.status === "completed" && mine && !theirs ? `<div class="mini-review muted">Waiting for ${esc(p.name)}'s review of you.</div>` : ""}
        </div>
        <div class="row-actions">${meetupActions(m)}</div>
      </article>`;
  }

  function bindMeetupActions(root) {
    $$("[data-id]", root).forEach((row) => row.addEventListener("click", (e) => {
      const act = e.target.closest("[data-act]")?.dataset.act;
      if (!act) return;
      const m = DB.cache.meetups.find((x) => x.id === row.dataset.id);
      if (m) meetupAct(m, act);
    }));
  }

  async function meetupAct(m, act) {
    const u = me(), p = otherPerson(m);
    if (act === "profile") return openProfileById(p.uid, p.label);
    if (act === "review") return openReview(m);
    if (act === "accept") {
      DB.setMeetupStatus(m, "confirmed", `✅ ${u.name} accepted the meetup for ${slotLabel(m.slot)}. Meet somewhere public first.`).catch(fail);
      // A local's accepted slot is no longer offered to other travellers.
      if (m.kind === "local" && u.availability) DB.saveProfile({ availability: { ...u.availability, booked: [...new Set([...(u.availability.booked || []), m.slot])] } }).catch(fail);
      toast(`Meetup with ${p.name} confirmed 🎉`);
    }
    if (act === "decline") { DB.setMeetupStatus(m, "declined", `${u.name} can't make ${slotLabel(m.slot)}.`).catch(fail); toast(`Request from ${p.name} declined.`); }
    if (act === "cancel") return openCancel(m);
    closeModal();
    await settle();
    render();
  }

  function meetupsPage(user, root) {
    const uid = user.uid;
    const all = DB.cache.meetups.slice().sort((a, b) => DB.ms(a.slotStart) - DB.ms(b.slotStart));
    const groups = [
      ["Requests for you", all.filter((m) => m.status === "requested" && m.to === uid && bookable(m.slot))],
      ["Needs your review", all.filter((m) => m.status === "completed" && !myReviewOf(m))],
      ["Upcoming", all.filter((m) => m.status === "confirmed")],
      ["Waiting for a reply", all.filter((m) => m.status === "requested" && m.from === uid)],
      ["Past meetups", all.filter((m) => m.status === "completed" && myReviewOf(m)).reverse()],
      ["Cancelled", all.filter((m) => m.status === "cancelled").reverse()],
    ].filter(([, list]) => list.length);
    root.innerHTML = `
      <div class="page">
        <div class="greet fade"><h1>Your meetups</h1><p class="muted">Once a meetup's time has passed, you and the other person can rate and review each other. Reviews appear on both profiles.</p></div>
        ${groups.length ? groups.map(([title, list]) => `
          <section class="panel fade" style="margin-bottom:22px"><h3>${title}</h3>${list.map(meetupRow).join("")}</section>`).join("")
          : `<div class="empty"><div class="art">📅</div>No meetups yet.<br/>${user.mode === "local" ? "When travellers request a time you're free, it shows up here and on your dashboard." : "Request a meetup with a local or buddy to get started."}<br/><br/><a class="btn btn-primary" href="#/discover">${user.mode === "local" ? "Go to dashboard" : "Find people"}</a></div>`}
      </div>`;
    bindMeetupActions(root);
  }

  // Cancelling asks for a reason and gently reminds people that someone is counting on them.
  function openCancel(m) {
    const p = otherPerson(m);
    const confirmed = m.status === "confirmed";
    const hours = Math.round((slotTime(m.slot, "start") - Date.now()) / 36e5);
    const what = confirmed ? "meetup" : "request";
    openModal(`
      <button class="modal-close" data-close aria-label="Close">${I.close}</button>
      <div class="modal-body plain">
        <h3>Cancel your ${what} with ${esc(p.name)}?</h3>
        <p class="hint" style="margin-top:4px">📅 ${slotLabel(m.slot)}</p>
        <div class="check-result warn">
          ${confirmed
            ? `${esc(p.name)} has set this time aside for you and may already be planning around it. buddyup works because people keep their word, so cancelling a confirmed meetup isn't in the spirit of the community unless something has genuinely come up.`
            : `${esc(p.name)} may already be making room for this. If your plans have changed, cancelling now is kinder than leaving them waiting.`}
          ${confirmed && hours < 48 ? `<br/><br/><strong>It's only ${plural(Math.max(hours, 0), "hour")} away</strong>, so please also message ${esc(p.name)} in the chat.` : ""}
        </div>
        <div class="field" style="margin-top:14px"><label for="creason">Why are you cancelling?</label>
          <textarea class="textarea" id="creason" maxlength="500" placeholder="e.g. I'm unwell, my flight changed, a family emergency…"></textarea>
          <p class="hint">${esc(p.name)} will see this reason.</p></div>
        <div class="error" id="cerr"></div>
        <div style="display:flex;gap:10px;justify-content:flex-end">
          <button class="btn btn-soft" data-close>Keep the ${what}</button>
          <button class="btn btn-primary" id="csend">Cancel ${what}</button>
        </div>
      </div>`);
    $("#creason").focus();
    $("#csend").addEventListener("click", async () => {
      const reason = $("#creason").value.trim();
      if (reason.length < 10) return ($("#cerr").textContent = "Please give a short reason (10+ characters).");
      const u = me();
      $("#csend").disabled = true;
      try {
        await DB.cancelMeetup(m, reason, `❌ ${u.name} cancelled the ${what} for ${slotLabel(m.slot)}. Reason: “${reason}”`);
        closeModal();
        toast(`${confirmed ? "Meetup" : "Request"} cancelled. ${p.name} has been told why.`);
        render();
      } catch (e) { $("#csend").disabled = false; $("#cerr").textContent = DB.friendlyError(e); }
    });
  }

  // A local's booked slots stay blocked until the local's own app frees them (only they can
  // edit their profile), so drop slots whose meetup was cancelled by either side.
  function releaseCancelledSlots(user) {
    const booked = user.availability?.booked || [];
    if (!booked.length) return;
    const mine = DB.cache.meetups.filter((m) => m.kind === "local" && m.to === user.uid);
    const live = new Set(mine.filter((m) => m.status === "confirmed").map((m) => m.slot));
    const gone = new Set(mine.filter((m) => m.status === "cancelled").map((m) => m.slot));
    const keep = booked.filter((s) => live.has(s) || !gone.has(s));
    if (keep.length !== booked.length) DB.saveProfile({ availability: { ...user.availability, booked: keep } }).catch(fail);
  }

  function openReview(m) {
    const p = otherPerson(m);
    let rating = 0;
    openModal(`
      <button class="modal-close" data-close aria-label="Close">${I.close}</button>
      <div class="modal-body plain center">
        <div style="display:flex;justify-content:center;margin-bottom:12px">${face(p, 84)}</div>
        <h3 style="justify-content:center">How was your meetup with ${esc(p.name)}?</h3>
        <p class="hint" style="margin-top:4px">📅 ${slotLabel(m.slot)}</p>
        <div class="star-pick" id="pick">${[1, 2, 3, 4, 5].map((i) => `<button type="button" data-star="${i}" aria-label="${i} star${i > 1 ? "s" : ""}"><svg viewBox="0 0 24 24"><path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/></svg></button>`).join("")}</div>
        <textarea class="textarea" id="rtext" maxlength="1000" placeholder="What was great? Was ${esc(p.name)} on time, friendly, as described?" style="text-align:left"></textarea>
        <div class="error" id="rerr"></div>
        <button class="btn btn-primary btn-block" id="rsend">Post review</button>
        <p class="hint" style="margin-top:12px">Reviews are public on profiles. Be honest and kind.</p>
      </div>`);
    $$("[data-star]", modalRoot).forEach((b) => b.addEventListener("click", () => {
      rating = +b.dataset.star;
      $$("[data-star]", modalRoot).forEach((x) => x.classList.toggle("on", +x.dataset.star <= rating));
    }));
    $("#rsend").addEventListener("click", async () => {
      const text = $("#rtext").value.trim();
      if (!rating) return ($("#rerr").textContent = "Tap the stars to choose a rating.");
      if (text.length < 10) return ($("#rerr").textContent = "Add a few words about the meetup (10+ characters).");
      const u = me();
      const role = m.kind === "local" ? (m.to === u.uid ? "Local" : "Traveller") : "Buddy";
      $("#rsend").disabled = true;
      try {
        await DB.addReview(m, { rating, text, fromName: u.name, fromRole: role });
        closeModal();
        toast(`Thanks! Your review of ${p.name} is live.`);
        render();
      } catch (e) { $("#rsend").disabled = false; $("#rerr").textContent = DB.friendlyError(e); }
    });
  }

  // ---------- Discover (traveller): trip details, then find a local or a buddy ----------
  const MAX_TRIP_DAYS = 30;
  const tripReady = (u) => !!(u.trip?.city && u.trip.start && u.trip.end && Object.keys(u.trip.windows || {}).length);
  const MODES = [
    { key: "local", cls: "local", art: "city", title: "Find a local", desc: "Verified locals who'll show you the city through their eyes." },
    { key: "buddy", cls: "buddy", art: "mountains", title: "Find a buddy", desc: "Other travellers in town at the same time. Split the adventure, double the fun." },
  ];

  const RES_LABEL = { "6to12m": "under a year", "1to3y": "1–3 years", "3to10y": "3–10 years", "10y": "10+ years", born: "born & raised" };
  // A Firestore user as a card/profile in the UI. `kind` is the role they're shown in.
  function toPerson(u, kind) {
    const isLocal = kind === "local";
    const t = u.trip || {};
    return {
      id: u.uid, uid: u.uid, type: isLocal ? "local" : "buddy", traveller: kind === "traveller",
      name: u.name || "buddyup member", photo: u.photoURL || "", from: u.from || "",
      city: isLocal ? u.localCity : t.city || "", residency: u.residency, tripStart: t.start, tripEnd: t.end,
      interests: u.interests || [], languages: u.languages || [], bio: u.bio || "",
      verified: isLocal ? !!u.approved : false, phoneVerified: !!u.phoneVerified,
      windows: (isLocal ? u.availability?.windows : t.windows) || {}, booked: isLocal ? u.availability?.booked || [] : [],
    };
  }

  // Real people in the trip city who are free for at least an hour when the traveller is.
  async function peopleFor(user, mode) {
    const today = ymd(new Date());
    const found = mode === "local" ? await DB.findLocals(user.trip.city) : await DB.findTravellers(user.trip.city);
    const mine = user.interests || [];
    const people = found
      .filter((u) => u.uid !== user.uid && (mode === "local" ? u.available !== false && u.availability : u.trip?.end >= today))
      .map((u) => toPerson(u, mode))
      .map((p) => ({ ...p, match: matchWindows(user.trip.windows, p.windows, p.booked), overlap: p.interests.filter((t) => mine.includes(t)).length }))
      .filter((p) => p.match.length)
      .sort((a, b) => b.match.length - a.match.length || b.overlap - a.overlap);
    const reviews = await DB.reviewsFor(people.map((p) => p.uid)).catch(() => []);
    people.forEach((p) => (p.reviews = reviews.filter((r) => r.to === p.uid)));
    return people;
  }

  function discoverPage(user, root, mode) {
    if (user.mode === "local") return hostDashboard(user, root);
    if (mode && !tripReady(user)) return go("#/discover");
    if (mode === "find") return findPage(user, root);
    if (mode) return MODES.some((m) => m.key === mode) ? resultsPage(user, root, mode) : go("#/discover");

    const t = user.trip || {};
    const windows = clone(t.windows);
    const today = ymd(new Date());
    const popular = ["Lisbon", "Tokyo", "Mumbai", "Barcelona", "Mexico City", "Bali", "Berlin", "New York"];
    root.innerHTML = `
      <div class="page">
        <div class="greet fade">
          <h1>Hey ${esc(user.name.split(" ")[0])}, where are you travelling to?</h1>
          <p class="muted">Tell us where you're going and when you're free — we'll only show locals and buddies who are free at the same times.</p>
        </div>
        <section class="panel trip-panel fade">
          <form id="tripform" novalidate>
            <div class="trip-top">
              <div class="field"><label>Destination</label>
                <div class="city-bar big">${I.pin}<input name="city" value="${esc(t.city || "")}" placeholder="City or country, e.g. Lisbon" autocomplete="off"/></div></div>
              <div class="field"><label>Arriving</label><input class="input" type="date" name="start" min="${today}" value="${esc(t.start || "")}"/></div>
              <div class="field"><label>Leaving</label><input class="input" type="date" name="end" min="${t.start || today}" value="${esc(t.end || "")}"/></div>
            </div>
            <div class="chips">${popular.map((c) => `<button type="button" class="chip" data-city="${c}">${c}</button>`).join("")}</div>
            <div id="times"></div>
          </form>
        </section>
        <div class="trip-next">
          <div class="error" id="err"></div>
          <button type="button" class="next-arrow" id="next" aria-label="Next: find a local or a buddy">Next ${I.arrow}</button>
        </div>
      </div>`;

    const form = $("#tripform");
    suggestCities(form.city, true);
    // Meetups need a day's notice, so the calendar starts tomorrow at the earliest.
    const range = () => {
      const s = form.start.value, e = form.end.value;
      if (!s || !e || e < s) return null;
      let from = new Date(s + "T00:00");
      if (from < tomorrow()) from = tomorrow();
      let to = new Date(e + "T00:00");
      if (to < from) return { empty: true };
      if ((to - from) / 864e5 >= MAX_TRIP_DAYS) to = addDays(from, MAX_TRIP_DAYS - 1);
      return { from, to };
    };
    const summary = () => {
      const r = range();
      if (r && !r.empty) $("#times-count").textContent = windowsSummary(windows, ymd(r.from), ymd(r.to));
      $("#err").textContent = "";
    };
    const drawTimes = () => {
      const box = $("#times");
      const r = range();
      if (!r) { box.innerHTML = `<p class="hint times-hint">📅 Add your dates to choose when you're free to meet people.</p>`; return; }
      if (r.empty) { box.innerHTML = `<div class="check-result warn" style="margin-top:16px">Meetups need at least a day's notice, so choose dates from tomorrow onwards.</div>`; return; }
      // Forget times that fall outside the new dates.
      Object.keys(windows).forEach((d) => { if (d < ymd(r.from) || d > ymd(r.to)) delete windows[d]; });
      box.innerHTML = `
        <div class="times-head"><h3>When are you free to meet?</h3><span class="muted" id="times-count"></span></div>
        <p class="hint" style="margin-bottom:14px">Pick a date and add the times you're free — or apply them to every day of your trip. Requests are sent at least a day ahead.</p>
        <div id="cal"></div>`;
      mountCalendar($("#cal"), { from: r.from, to: r.to, windows, repeat: false, onChange: summary });
      summary();
    };
    drawTimes();
    form.start.addEventListener("change", () => {
      form.end.min = form.start.value || today;
      if (form.end.value && form.end.value < form.start.value) form.end.value = form.start.value;
      drawTimes();
    });
    form.end.addEventListener("change", drawTimes);
    form.addEventListener("submit", (e) => e.preventDefault());
    $$("[data-city]", root).forEach((b) => b.addEventListener("click", () => { form.city.value = b.dataset.city; }));

    $("#next").addEventListener("click", () => {
      const err = $("#err");
      const city = titleCase(form.city.value), start = form.start.value, end = form.end.value, r = range();
      const fail = (msg) => { err.textContent = msg; err.scrollIntoView({ behavior: "smooth", block: "center" }); };
      if (!city) return fail("Where are you headed? Add a destination above.");
      if (!start || !end) return fail("Add the dates you're travelling.");
      if (!r || r.empty) return fail("Meetups need at least a day's notice — choose dates from tomorrow onwards.");
      if (!Object.keys(windows).length) return fail("Add at least one time you're free to meet on the calendar.");
      DB.saveProfile({ trip: { city, start, end, windows } }).catch(fail);
      state.filter = null;
      window.scrollTo(0, 0);
      settle().then(() => go("#/discover/find"));
    });
  }

  // Step 2 for travellers: choose between a local and a buddy for the saved trip.
  function findPage(user, root) {
    const t = user.trip;
    root.innerHTML = `
      <div class="page">
        <a class="back-link" href="#/discover">${I.back} Edit trip</a>
        <div class="greet fade">
          <h1>Who do you want to explore ${esc(t.city)} with?</h1>
          <a class="change-link" href="#/discover">${I.pin} ${esc(t.city)} · ${tripDates(t)} · ${windowsSummary(t.windows, t.start, t.end)} free · Change</a>
        </div>
        <div class="modes">${MODES.map((m) => `
          <a class="mode ${m.cls}" href="#/discover/${m.key}">
            <div class="art">${ART[m.art]}</div>
            <div class="body"><div><h3>${m.title}</h3><p>${m.desc}</p></div><span class="go">${I.arrow}</span></div>
          </a>`).join("")}
        </div>
        <div class="safety-strip">${safetyCards()}</div>
      </div>`;
    $$(".mode", root).forEach((a) => a.addEventListener("click", () => { state.filter = null; window.scrollTo(0, 0); }));
  }

  async function resultsPage(user, root, mode) {
    const label = mode === "local" ? "Verified locals" : "Buddies";
    const head = (count) => `
      <a class="back-link" href="#/discover/find">${I.back} Back</a>
      <div class="results-head fade">
        <div><h1>${label} in ${esc(user.trip.city)}</h1>
          <span class="count">${count} · ${tripDates(user.trip)} · <a href="#/discover">change times</a></span></div>
        <a class="btn btn-outline btn-sm" href="#/discover/${mode === "local" ? "buddy" : "local"}">${mode === "local" ? "Find a buddy instead" : "Find a local instead"}</a>
      </div>`;
    const key = `${mode}|${user.trip.city}|${JSON.stringify(user.trip.windows)}`;
    if (state.results?.key !== key) {
      root.innerHTML = `<div class="page">${head("Looking for people free when you are…")}<div class="grid">${'<div class="pcard skeleton"></div>'.repeat(4)}</div></div>`;
      try {
        state.results = { key, all: await peopleFor(user, mode) };
      } catch (e) {
        root.innerHTML = `<div class="page">${head("")}<div class="empty"><div class="art">⚠️</div>${esc(DB.friendlyError(e))}</div></div>`;
        return;
      }
      if (route().page !== "discover" || route().id !== mode) return; // navigated away while loading
    }
    const all = state.results.all;
    const people = state.filter ? all.filter((p) => p.interests.includes(state.filter)) : all;
    const tags = [...new Set(all.flatMap((p) => p.interests))].slice(0, 10);
    const emptyText = mode === "local"
      ? `No verified locals in ${esc(user.trip.city)} are free at the times you picked yet.<br/>buddyup is new — try more times, or invite a friend who lives there to become a local.`
      : `No other travellers in ${esc(user.trip.city)} are free at the same times yet.<br/>Try adding more times, or share buddyup with friends who are travelling.`;

    root.innerHTML = `
      <div class="page">
        ${head(`${plural(people.length, "person").replace("persons", "people")} free when you are`)}
        ${all.length ? `<div class="chips filters">
          <button class="chip ${!state.filter ? "active" : ""}" data-filter="">All</button>
          ${tags.map((t) => `<button class="chip ${state.filter === t ? "active" : ""}" data-filter="${esc(t)}">${esc(t)}</button>`).join("")}
        </div>` : ""}
        ${mode === "local" && all.length ? `<div class="note"><span class="e">💛</span><div><b>buddyup is free — always.</b> Locals volunteer their time to show you around. If you had a great time, it's a lovely gesture to leave them a <b>generous tip</b>.</div></div>` : ""}
        ${people.length ? `<div class="grid">${people.map((p, i) => personCard(p, i, activeMeetupWith(p.uid))).join("")}</div>`
          : `<div class="empty"><div class="art">🗓️</div>${all.length ? "No one matches that filter yet." : `${emptyText}<br/><br/><a class="btn btn-primary" href="#/discover">Add more times</a>`}</div>`}
      </div>`;

    $$("[data-filter]", root).forEach((c) => c.addEventListener("click", () => { state.filter = c.dataset.filter || null; resultsPage(user, root, mode); }));
    $$(".pcard", root).forEach((c) => c.addEventListener("click", (e) => {
      const p = people.find((x) => x.id === c.dataset.id);
      const active = activeMeetupWith(p.uid);
      if (e.target.closest("[data-connect]") && active) return go(`#/messages/${encodeURIComponent(active.chatId)}`);
      openProfile(me(), p, { focus: !!e.target.closest("[data-connect]") });
    }));
  }

  // A pending or confirmed meetup with this person, if any.
  const activeMeetupWith = (uid) => DB.cache.meetups.find((m) => m.participants.includes(uid) && ["requested", "confirmed"].includes(m.status));

  const typeBadge = (p) => (p.type === "local" ? '<span class="badge badge-local">Local</span>'
    : p.traveller ? '<span class="badge badge-buddy">Traveller</span>' : '<span class="badge badge-buddy">Buddy</span>');
  const subline = (p) => (p.type === "local"
    ? `Local in ${esc(p.city)}${RES_LABEL[p.residency] ? ` · ${RES_LABEL[p.residency]}` : ""}`
    : `${p.from ? `From ${esc(p.from)}` : "Traveller"}${p.tripEnd ? ` · until ${fmtYmd(p.tripEnd)}` : ""}`);

  function personCard(p, i, active) {
    return `
      <article class="pcard" data-id="${esc(p.id)}" style="animation-delay:${i * 0.03}s">
        <div class="cover ${p.type === "local" ? "local" : ""}">${typeBadge(p)}</div>
        <div class="face">${face(p, 84)}</div>
        <div class="inner">
          <h4>${esc(p.name)} ${p.verified ? I.tick : ""}</h4>
          <div class="sub">${subline(p)}</div>
          <div class="stats"><span>${ratingText(p.reviews || [])}</span></div>
          ${p.bio ? `<p class="bio">${esc(p.bio)}</p>` : ""}
          <div class="chips">${p.interests.map((t) => `<span class="chip tag">${esc(t)}</span>`).join("")}</div>
          <div class="match-line">🗓️ <b>${plural(p.match.length, "matching time")}</b><br/>Next: ${slotLabel(p.match[0])}</div>
          <div class="card-actions">
            <button class="btn btn-primary btn-sm" data-connect>${active ? `${I.chat} Open chat` : `${I.plane} Request meetup`}</button>
            <button class="btn btn-outline btn-sm" data-view>${I.user} View profile</button>
          </div>
        </div>
      </article>`;
  }

  // ---------- Local (host) availability ----------
  const AVAIL_DAYS = 35;
  // Locals review their availability at least 30 days ahead (and add at least one time in the next 4 weeks).
  const needsAvailability = (u) => !u.availability?.horizon || u.availability.horizon < ymd(addDays(new Date(), 30));

  function availabilityPage(user, root) {
    if (user.mode !== "local" || !user.approved) return go("#/discover");
    const from = tomorrow(), to = addDays(from, AVAIL_DAYS - 1);
    const windows = clone(user.availability?.windows);
    Object.keys(windows).forEach((d) => { if (d < ymd(from)) delete windows[d]; });
    const booked = user.availability?.booked || [];
    root.innerHTML = `
      <div class="page">
        <a class="back-link" href="#/discover">${I.back} Dashboard</a>
        <div class="greet fade">
          <h1>${user.availability ? "Your availability" : "You're verified! When are you free to host?"}</h1>
          <p class="muted">Add the dates and times you're free over the next 5 weeks — at least one time in the next 4 weeks. Travellers can only request you at these times, and always at least a day in advance.</p>
        </div>
        <section class="panel fade"><div id="cal"></div></section>
        <div class="save-bar"><span id="count"></span><div class="error" id="err" style="margin:0;flex:1"></div><button class="btn btn-primary" id="save">Save availability</button></div>
      </div>`;
    const count = () => {
      $("#count").textContent = `${windowsSummary(windows, ymd(from), ymd(to))} · until ${fmtDate(to)}`;
      $("#err").textContent = "";
    };
    mountCalendar($("#cal"), { from, to, windows, booked, onChange: count });
    count();
    $("#save").addEventListener("click", () => {
      const nextFourWeeks = daysFrom(from, 28).map(ymd);
      if (!nextFourWeeks.some((d) => windows[d]?.length)) {
        $("#err").textContent = `Add at least one time you're free before ${fmtDate(addDays(from, 27))}.`;
        return;
      }
      DB.saveProfile({ availability: { windows, booked: user.availability?.booked || [], horizon: ymd(to), savedAt: Date.now() } }).catch(fail);
      toast("Availability saved. Travellers free at the same times can now request you.");
      settle().then(() => go("#/discover"));
    });
  }

  // ---------- Local (host) dashboard ----------
  // Locals don't browse travellers: travellers request a time the local is free, and the
  // local chooses who to meet. That keeps tourists from being cold-messaged.
  function hostDashboard(user, root) {
    const first = esc(user.name.split(" ")[0]);
    const city = esc(user.localCity);
    const v = user.verification || {};
    const av = user.availability;
    const uid = user.uid;
    const freeDays = new Set(matchWindows(av?.windows, av?.windows, av?.booked).filter((s) => s.slice(0, 10) <= ymd(addDays(new Date(), 30))).map((s) => s.slice(0, 10))).size;
    const sidebar = `
      <aside class="host-side">
        ${user.approved ? `
          <section class="panel">
            <h3>Availability</h3>
            <label class="list-item" style="cursor:pointer"><span class="li-ico">🟢</span><span class="grow">Available to host<small>${user.available !== false ? `Travellers in ${city} can find you` : "Paused — you won't get new requests"}</small></span>
              <input type="checkbox" id="avail" ${user.available !== false ? "checked" : ""} class="switch"/></label>
            <div class="list-item"><span class="li-ico">📅</span><span class="grow">${av ? `Free on ${plural(freeDays, "day")} in the next 30 days` : "Not set yet"}<small>${av ? `Set until ${fmtYmd(av.horizon)}` : "Required before you get requests"}</small></span></div>
            <a class="btn ${needsAvailability(user) ? "btn-primary" : "btn-outline"} btn-block" href="#/availability">${av ? "Edit availability" : "Add availability"}</a>
          </section>` : ""}
        <section class="panel">
          <h3>Hosting tips</h3>
          ${[["☕", "Start somewhere public", "A busy café or landmark for the first hour."],
             ["🗺️", "Share the plan", "Tell the traveller where you're going before you set off."],
             ["💛", "Tips are optional", "Never ask for money — travellers tip if they want to."]]
            .map(([e, t, s]) => `<div class="list-item"><span class="li-ico">${e}</span><span class="grow">${t}<small>${s}</small></span></div>`).join("")}
        </section>
        <section class="panel switch-card">
          <h3>Travelling soon?</h3>
          <p class="hint" style="margin-bottom:14px">Switch to traveller mode to find locals and buddies wherever you're going.</p>
          <button class="btn btn-outline btn-block" data-switch="traveller">🎒 Switch to traveller mode</button>
        </section>
      </aside>`;

    if (!user.approved) {
      root.innerHTML = `
        <div class="page">
          <div class="greet fade"><h1>Hey ${first}, your local profile is in review</h1><p class="muted">Once approved, you'll add your availability and travellers in ${city} can send you meetup requests.</p></div>
          <div class="host-grid">
            <div>
              <section class="panel fade">
                <div class="review-top">
                  <div class="ring" style="--p:${v.trustScore || 0}"><span>${v.trustScore || 0}</span></div>
                  <div><strong>Trust score ${v.trustScore || 0}/100</strong><p class="hint">Based on your residency, local knowledge and identity checks.</p></div>
                </div>
                <ol class="timeline">
                  <li class="done"><b>Application submitted</b><small>${v.submittedAt ? fmtDate(v.submittedAt) : ""}</small></li>
                  <li class="current"><b>Team review</b><small>We check your answers, ID and selfie — usually within 24 hours.</small></li>
                  <li><b>Add your availability</b><small>Choose when you're free over the next month.</small></li>
                  <li><b>Go live</b><small>Travellers free at the same times can request you.</small></li>
                </ol>
                ${v.flags?.length ? `<div class="note"><span class="e">⚠️</span><div><b>Flagged for manual review</b><br/>${v.flags.map((f) => esc(f.detail)).join("<br/>")}</div></div>` : ""}
                <p class="hint review-tip">Reviewers approve a local by setting <code>approved</code> to <code>true</code> on <code>users/${esc(uid)}</code> in Firebase console → Firestore. This page updates automatically.</p>
              </section>
            </div>
            ${sidebar}
          </div>
        </div>`;
    } else {
      const pending = DB.cache.meetups.filter((m) => m.status === "requested" && m.to === uid && bookable(m.slot));
      const upcoming = DB.cache.meetups.filter((m) => m.status === "confirmed").sort((a, b) => DB.ms(a.slotStart) - DB.ms(b.slotStart));
      const mine = ratingSummary(DB.cache.reviewsToMe);
      root.innerHTML = `
        <div class="page">
          <div class="greet fade"><h1>Welcome back, ${first} 👋</h1><p class="muted">${I.tick} Verified local in ${city}${v.trustScore ? ` · trust score ${v.trustScore}/100` : ""}</p></div>
          <div class="stat-row fade">
            <div class="stat"><strong>${pending.length}</strong><span>New requests</span></div>
            <div class="stat"><strong>${upcoming.length}</strong><span>Upcoming meetups</span></div>
            <div class="stat"><strong>${mine.count ? `★ ${mine.avg}` : "New"}</strong><span>${mine.count ? plural(mine.count, "review") : "Your rating"}</span></div>
            <div class="stat"><strong id="in-town">…</strong><span>Travellers in ${city} this week</span></div>
          </div>
          <div class="host-grid">
            <div>
              ${needsAvailability(user) ? `
                <section class="panel fade cta-panel">
                  <div class="become-ico">📅</div>
                  <div class="grow"><h3>${av ? "Your availability is running out" : "Add your availability for the next month"}</h3>
                  <p class="hint">Travellers can only request you at times you're free, at least a day in advance.</p></div>
                  <a class="btn btn-primary" href="#/availability">${av ? "Extend availability" : "Add availability"}</a>
                </section>` : ""}
              <section class="panel fade">
                <div class="panel-head"><h3>Meetup requests</h3>${pending.length ? `<span class="badge badge-local">${pending.length} new</span>` : ""}</div>
                ${pending.length ? pending.map(requestCard).join("") : `<div class="empty small"><div class="art">📭</div>No new requests right now.${!av ? "<br/>Add your availability so travellers can request you." : user.available === false ? "<br/>You're paused — turn on “Available to host” to get requests." : ""}</div>`}
              </section>
              <section class="panel fade">
                <div class="panel-head"><h3>Upcoming meetups</h3><a class="change-link" href="#/meetups" style="margin:0">All meetups ${I.chev}</a></div>
                ${upcoming.length ? upcoming.map((m) => { const p = otherPerson(m); return `
                  <div class="meetup">
                    ${face(p, 44)}
                    <div class="grow"><strong>${esc(p.name)}</strong> ${p.from ? `<span class="muted">from ${esc(p.from)}</span>` : ""}<small>📅 ${slotLabel(m.slot)}</small></div>
                    <a class="btn btn-outline btn-sm" href="#/messages/${encodeURIComponent(m.chatId)}">${I.chat} Open chat</a>
                  </div>`; }).join("") : `<p class="hint">Accepted requests show up here.</p>`}
              </section>
            </div>
            ${sidebar}
          </div>
        </div>`;
      DB.findTravellers(user.localCity).then((list) => {
        const today = ymd(new Date()), weekEnd = ymd(addDays(new Date(), 7));
        const n = list.filter((t) => t.uid !== uid && t.trip?.start <= weekEnd && t.trip?.end >= today).length;
        const el = $("#in-town");
        if (el) el.textContent = n;
      }).catch(() => { const el = $("#in-town"); if (el) el.textContent = "–"; });
      fillRatings(root);
    }

    $$("[data-switch]", root).forEach((b) => b.addEventListener("click", () => switchMode(me(), b.dataset.switch)));
    $("#avail")?.addEventListener("change", async (e) => { DB.saveProfile({ available: e.target.checked }).catch(fail); await settle(); render(); });
    bindMeetupActions(root);
  }

  function requestCard(m) {
    const p = otherPerson(m);
    return `
      <article class="request" data-id="${esc(m.id)}">
        <span data-act="profile" style="cursor:pointer">${face(p, 56)}</span>
        <div class="grow">
          <div class="req-top"><strong>${esc(p.name)}</strong> ${labelBadge(p.label)} ${p.from ? `<span class="muted">from ${esc(p.from)}</span>` : ""}<span class="time">${ago(DB.ms(m.createdAt))}</span></div>
          <div class="stats" style="margin:4px 0" data-rating-for="${esc(p.uid)}">${ratingText([])}</div>
          <div class="req-dates">📅 <b>${slotLabel(m.slot)}</b> <span class="badge badge-buddy">Matches your availability</span></div>
          <p class="req-msg">“${esc(m.message)}”</p>
          <div class="req-actions">
            <button class="btn btn-soft btn-sm" data-act="profile">${I.user} View profile</button>
            <button class="btn btn-soft btn-sm" data-act="decline">Decline</button>
            <button class="btn btn-primary btn-sm" data-act="accept">Accept &amp; chat</button>
          </div>
        </div>
      </article>`;
  }

  const ago = (t) => {
    const h = Math.round((Date.now() - t) / 36e5);
    return h < 1 ? "just now" : h < 24 ? `${h}h ago` : `${Math.round(h / 24)}d ago`;
  };

  // ---------- Profile modal & request ----------
  // The first message is pre-filled differently for locals (a guide giving their time)
  // and buddies (a fellow traveller), so travellers know what a good opener looks like.
  function opener(user, p, slot) {
    const first = user.name.split(" ")[0];
    const shared = p.interests.find((t) => (user.interests || []).includes(t)) || p.interests[0] || "exploring";
    const [d, from, to] = slot.split("|");
    const when = `${dayLabel(d)}, any time between ${from} and ${to}`;
    return p.type === "local"
      ? `Hi ${p.name}! I'm ${first}${user.from ? ` from ${user.from}` : ""}, visiting ${p.city} ${tripDates(user.trip)}. I'd love to see the city through a local's eyes — especially ${shared.toLowerCase()}. Would you be up for showing me around on ${when}?`
      : `Hey ${p.name}! I'm ${first}, also in ${p.city} ${tripDates(user.trip)}. Fancy teaming up for some ${shared.toLowerCase()} on ${when}? Happy to meet at a café first.`;
  }

  // Open someone's profile from a meetup or chat (only their uid and role label are known).
  async function openProfileById(uid, label) {
    try {
      const u = await DB.getProfile(uid);
      if (!u) return toast("This profile is no longer available.");
      openProfile(me(), toPerson(u, label === "Local" ? "local" : label === "Traveller" ? "traveller" : "buddy"), { readOnly: true });
    } catch (e) { fail(e); }
  }

  function openProfile(user, p, opts = {}) {
    const isLocal = p.type === "local";
    const active = activeMeetupWith(p.uid);
    const canRequest = !opts.readOnly && !active && user.mode === "traveller" && p.match?.length;
    let actions = "";
    if (active && !opts.readOnly) actions = `<div class="modal-actions" style="margin-top:22px"><button class="btn btn-primary" id="open">${I.chat} Open chat</button></div>`;
    else if (canRequest) actions = `
      <h5>Pick a time · you're both free</h5>
      <div class="chips slot-chips">${p.match.slice(0, 12).map((s, i) => `<button type="button" class="chip ${i === 0 ? "active" : ""}" data-pick="${s}">${slotLabel(s)}</button>`).join("")}</div>
      <p class="hint" style="margin-top:6px">These are the times you're both free (at least an hour, and at least a day from now) so ${esc(p.name)} has time to plan.</p>
      <h5>Your first message</h5>
      <div class="prompt-tip ${isLocal ? "local" : ""}">
        ${isLocal
          ? `💡 <b>Messaging a local?</b> Say what you'd love to see or do, mention your interests and confirm the time. Locals give their time for free — be friendly and specific.`
          : `💡 <b>Messaging a buddy?</b> Share your travel plans and what you'd like to do together — food, sights, a night out — and suggest somewhere public to meet.`}
      </div>
      <textarea class="textarea" id="hello" maxlength="600"></textarea>
      <div class="chips prompt-chips">${(isLocal
        ? ["What's your favourite spot that tourists miss?", "I'm happy to meet at a café first.", "Any food I absolutely must try?"]
        : ["Want to split a day trip?", "I'm up for trying the street food.", "Shall we meet at a café first?"])
        .map((t) => `<button type="button" class="chip" data-add="${esc(t)}">+ ${esc(t)}</button>`).join("")}</div>
      <div class="modal-actions">
        <button class="btn btn-primary" id="send">${I.plane} Send meetup request</button>
        <button class="btn btn-soft" id="report" title="Report">🚩 Report</button>
      </div>`;
    else if (!opts.readOnly || p.uid !== user.uid) actions = `<div class="modal-actions" style="margin-top:22px"><button class="btn btn-soft" id="report">🚩 Report</button></div>`;
    openModal(`
      <button class="modal-close" data-close aria-label="Close">${I.close}</button>
      <div class="modal-cover ${isLocal ? "local" : ""}"></div>
      <div class="modal-face">${face(p, 112)}</div>
      <div class="modal-body">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px">
          <div>
            <h3>${esc(p.name)} ${p.verified ? I.tick : ""}</h3>
            <div class="muted" style="font-size:13.5px;margin-top:2px">${subline(p)}</div>
          </div>
          ${typeBadge(p)}
        </div>
        <div class="stats" style="margin-top:12px"><span id="m-rating">${ratingText(p.reviews || [])}</span>${isLocal ? `<span>${p.verified ? "🪪 Verified local" : "⏳ Not verified yet"}</span>` : ""}${p.phoneVerified ? "<span>📱 Phone verified</span>" : ""}</div>
        ${p.bio ? `<h5>About</h5><p>${esc(p.bio)}</p>` : ""}
        ${p.interests.length ? `<h5>Interests</h5><div class="chips">${p.interests.map((t) => `<span class="chip tag">${esc(t)}</span>`).join("")}</div>` : ""}
        ${p.languages.length ? `<h5>Speaks</h5><p>${p.languages.map(esc).join(" · ")}</p>` : ""}
        <h5>Reviews</h5><div id="m-reviews">${p.reviews ? reviewsBlock(p.reviews, `No reviews yet — ${esc(p.name)} is new to buddyup.`) : `<p class="hint">Loading reviews…</p>`}</div>
        ${isLocal && canRequest ? `<div class="note"><span class="e">💛</span><div>${esc(p.name)} is showing people around for free. A <b>generous tip</b> at the end is a great way to say thanks!</div></div>` : ""}
        ${actions}
      </div>`);

    if (!p.reviews) {
      DB.reviewsFor([p.uid]).then((list) => {
        if (!$("#m-reviews")) return;
        $("#m-reviews").innerHTML = reviewsBlock(list, `No reviews yet — ${esc(p.name)} is new to buddyup.`);
        $("#m-rating").innerHTML = ratingText(list);
      }).catch(() => { if ($("#m-reviews")) $("#m-reviews").innerHTML = `<p class="hint">Couldn't load reviews.</p>`; });
    }
    if (canRequest) {
      let slot = p.match[0], edited = false;
      const box = $("#hello");
      box.value = opener(user, p, slot);
      box.addEventListener("input", () => (edited = true));
      $$("[data-pick]", modalRoot).forEach((b) => b.addEventListener("click", () => {
        slot = b.dataset.pick;
        $$("[data-pick]", modalRoot).forEach((x) => x.classList.toggle("active", x === b));
        if (!edited) box.value = opener(user, p, slot);
      }));
      $$("[data-add]", modalRoot).forEach((b) => b.addEventListener("click", () => {
        box.value = `${box.value.trim()} ${b.dataset.add}`.trim();
        edited = true;
        b.remove();
      }));
      if (opts.focus) setTimeout(() => box.focus(), 260);
      $("#send").addEventListener("click", async () => {
        const text = box.value.trim();
        if (text.length < 10) return toast("Write a short message so they know what you'd like to do.");
        if (!bookable(slot)) return toast("That time is less than a day away — pick a later one.");
        $("#send").disabled = true;
        const kind = isLocal ? "local" : "buddy";
        const people = {
          [user.uid]: { name: user.name, photo: user.photoURL || "", from: user.from || "", city: user.trip.city, label: isLocal ? "Traveller" : "Buddy" },
          [p.uid]: { name: p.name, photo: p.photo, from: p.from, city: p.city, label: isLocal ? "Local" : "Buddy" },
        };
        try {
          const { chatId } = await DB.requestMeetup({ to: p.uid, kind, slot, slotStart: slotTime(slot, "start").getTime(), slotEnd: slotTime(slot, "end").getTime(), message: text, people });
          closeModal();
          toast(`Request sent to ${p.name}. You'll see their reply in Messages.`);
          go(`#/messages/${encodeURIComponent(chatId)}`);
        } catch (e) { $("#send").disabled = false; fail(e); }
      });
    }
    $("#open")?.addEventListener("click", () => { closeModal(); go(`#/messages/${encodeURIComponent(active.chatId)}`); });
    $("#report")?.addEventListener("click", () => openReport(p.uid, p.name));
  }

  function openReport(uid, name, chatId) {
    openModal(`
      <button class="modal-close" data-close aria-label="Close">${I.close}</button>
      <div class="modal-body plain">
        <h3>Report ${esc(name)}</h3>
        <p class="hint" style="margin:6px 0 16px">Our safety team reviews every report. ${esc(name)} won't be told who reported them.</p>
        <div class="chips" id="reasons">${["Fake profile", "Inappropriate messages", "Asked for money", "Made me feel unsafe", "Other"].map((r) => `<button type="button" class="chip" data-reason="${r}">${r}</button>`).join("")}</div>
        <textarea class="textarea" id="rdetail" maxlength="1000" placeholder="Anything else we should know? (optional)" style="margin-top:14px"></textarea>
        <div class="error" id="rerr"></div>
        <button class="btn btn-primary btn-block" id="rsend">Send report</button>
      </div>`);
    let reason = "";
    $$("[data-reason]", modalRoot).forEach((b) => b.addEventListener("click", () => {
      reason = b.dataset.reason;
      $$("[data-reason]", modalRoot).forEach((x) => x.classList.toggle("active", x === b));
    }));
    $("#rsend").addEventListener("click", async () => {
      if (!reason) return ($("#rerr").textContent = "Choose a reason.");
      try {
        await DB.report({ about: uid, chatId: chatId || null, reason, detail: $("#rdetail").value.trim() });
        closeModal();
        toast(`Thanks — ${name} has been reported. Our safety team will review it.`);
      } catch (e) { $("#rerr").textContent = DB.friendlyError(e); }
    });
  }

  // ---------- Chat ----------
  const chatById = (id) => DB.cache.chats.find((c) => c.id === id);
  const latestMeetup = (chatId) => DB.cache.meetups.filter((m) => m.chatId === chatId).sort((a, b) => DB.ms(b.createdAt) - DB.ms(a.createdAt))[0];

  function messagesPage(user, root, id) {
    const chat = id ? chatById(id) : null;
    if (id && !chat) return go("#/messages");
    root.innerHTML = `
      <div class="messages ${chat ? "has-thread" : ""}">
        <aside class="convos">
          <div class="convos-head"><h2>Messages</h2>
            <div class="search">${I.search}<input class="input" id="q" placeholder="Search chats" value="${esc(state.chatSearch)}"/></div></div>
          <div class="convo-list" id="convos"></div>
        </aside>
        <section class="pane" id="pane"></section>
      </div>`;
    refreshConvos(id);
    $("#q").addEventListener("input", (e) => { state.chatSearch = e.target.value; refreshConvos(id); });
    const pane = $("#pane");
    if (!chat) {
      const hint = user.mode === "local"
        ? `No chats yet.<br/>When a traveller requests a meetup, your conversation starts here.<br/><br/><a class="btn btn-primary" href="#/discover">Go to dashboard</a>`
        : `No chats yet.<br/>Request a meetup with a local or buddy to start one.<br/><br/><a class="btn btn-primary" href="#/discover">Find people</a>`;
      pane.innerHTML = `<div class="pane-empty"><div><div class="art">💬</div>${DB.cache.chats.length ? "Pick a conversation to keep chatting." : hint}</div></div>`;
      return;
    }
    renderThread(user, chat, pane);
  }

  function refreshConvos(activeId) {
    const box = $("#convos");
    if (!box) return;
    const all = DB.cache.chats.slice().sort((a, b) => DB.ms(b.updatedAt) - DB.ms(a.updatedAt));
    const q = state.chatSearch.toLowerCase();
    const list = q ? all.filter((c) => otherPerson(c).name.toLowerCase().includes(q)) : all;
    box.innerHTML = list.length ? list.map((c) => {
      const p = otherPerson(c), lm = c.lastMessage;
      return `
        <a class="convo ${c.id === activeId ? "on" : ""}" href="#/messages/${encodeURIComponent(c.id)}">
          ${face(p, 48)}
          <div class="mid">
            <div class="name">${esc(p.name)} ${labelBadge(p.label)}</div>
            <div class="last">${lm ? (lm.from === DB.cache.uid && lm.type !== "sys" ? "You: " : "") + esc(lm.text) : ""}</div>
          </div>
          <div class="right">${c.updatedAt ? shortTime(DB.ms(c.updatedAt)) : ""}${unreadChat(c) && c.id !== activeId ? `<span class="unread">1</span>` : ""}</div>
        </a>`;
    }).join("") : `<p class="hint center" style="padding:30px 10px">${all.length ? "No chats match your search." : "Your conversations will appear here."}</p>`;
  }

  function meetupBar(chatId) {
    const m = latestMeetup(chatId);
    if (!m) return "";
    const [label, cls] = STATUS[m.status] || ["", ""];
    const mine = myReviewOf(m);
    return `<div class="meetup-bar" data-id="${esc(m.id)}">📅 <b>${slotLabel(m.slot)}</b> <span class="badge ${cls}">${label}</span><span class="grow"></span>
      ${meetupActions(m, { chat: false })}${mine ? `<span class="muted">You rated ${stars(mine.rating)}</span>` : ""}</div>`;
  }
  const refreshMeetupBar = (chatId) => { const bar = $("#mbar"); if (bar) { bar.innerHTML = meetupBar(chatId); } };

  function renderThread(user, chat, pane) {
    const p = otherPerson(chat);
    const blocked = (chat.blockedBy || []).length > 0;
    const quick = p.label === "Local"
      ? ["Where should we meet?", "What's your favourite spot?", "Any food recommendations?", "See you then!"]
      : p.label === "Traveller"
        ? ["Let's meet at the main square.", "Any food you want to try?", "What are you most excited to see?", "See you then!"]
        : ["Where should we meet?", "What are you up to today?", "Want to grab food?", "See you then!"];
    pane.innerHTML = `
      <div class="thread-head">
        <a class="icon-btn back" href="#/messages" aria-label="Back">${I.back}</a>
        <span id="who-photo" style="cursor:pointer">${face(p, 44)}</span>
        <div class="who" id="who"><strong>${esc(p.name)} ${labelBadge(p.label)}</strong><small>${p.from ? `From ${esc(p.from)}` : "Tap to view profile"}</small></div>
        <button class="icon-btn" id="more" aria-label="More options">${I.more}</button>
      </div>
      <div id="mbar">${meetupBar(chat.id)}</div>
      <div class="thread" id="thread"><p class="hint center">Loading messages…</p></div>
      ${blocked
        ? `<div class="blocked-bar">${chat.blockedBy.includes(user.uid) ? `You blocked ${esc(p.name)}. Unblock from the ⋮ menu to chat again.` : "This conversation has been closed."}</div>`
        : `<div class="quick">${quick.map((q) => `<button data-q="${esc(q)}">${esc(q)}</button>`).join("")}</div>
           <form class="composer" id="composer">
             <div class="box">${I.smile}<input id="msg" placeholder="Type a message…" autocomplete="off" maxlength="2000"/></div>
             <button class="send" aria-label="Send">${I.plane}</button>
           </form>`}`;

    // Live messages for the open conversation only.
    if (!state.thread || state.thread.id !== chat.id) {
      state.thread?.unsub();
      state.thread = { id: chat.id, msgs: null, unsub: DB.watchMessages(chat.id, (msgs) => { if (state.thread?.id === chat.id) { state.thread.msgs = msgs; refreshThread(); } }) };
    } else refreshThread();

    const showProfile = () => openProfileById(p.uid, p.label);
    $("#who-photo").addEventListener("click", showProfile);
    $("#who").addEventListener("click", showProfile);
    $("#more").addEventListener("click", (e) => { e.stopPropagation(); toggleThreadMenu(chat); });
    $("#mbar").addEventListener("click", (e) => {
      const act = e.target.closest("[data-act]")?.dataset.act;
      const m = latestMeetup(chat.id);
      if (act && m) meetupAct(m, act);
    });
    const send = (text) => {
      text = text.trim();
      if (!text) return;
      DB.sendMessage(chat.id, text).catch(fail);
    };
    $("#composer")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const inp = $("#msg");
      send(inp.value);
      inp.value = "";
      inp.focus();
    });
    $$("[data-q]", pane).forEach((b) => b.addEventListener("click", () => send(b.dataset.q)));
    if (window.innerWidth > 760) $("#msg")?.focus();
  }

  function refreshThread() {
    const box = $("#thread");
    const t = state.thread;
    if (!box || !t?.msgs) return;
    const uid = DB.cache.uid;
    box.innerHTML = t.msgs.length ? t.msgs.map((m) => m.type === "sys"
      ? `<div class="sys">${esc(m.text)}</div>`
      : `<div class="bubble ${m.from === uid ? "me" : "them"}">${esc(m.text)}<time>${clock(m.ts)}</time></div>`).join("")
      : `<p class="hint center">No messages yet.</p>`;
    box.scrollTop = box.scrollHeight;
    const chat = chatById(t.id);
    if (chat && unreadChat(chat)) DB.markRead(t.id).catch(() => {});
  }

  function toggleThreadMenu(chat) {
    const existing = $(".menu");
    if (existing) return existing.remove();
    const p = otherPerson(chat);
    const iBlocked = (chat.blockedBy || []).includes(DB.cache.uid);
    const cancellable = DB.cache.meetups.filter((m) => m.chatId === chat.id && notStarted(m)
      && (m.status === "confirmed" || (m.status === "requested" && m.from === DB.cache.uid)))
      .sort((a, b) => DB.ms(a.slotStart) - DB.ms(b.slotStart))[0];
    const menu = document.createElement("div");
    menu.className = "menu";
    menu.innerHTML = `
      <button data-act="share">📍 Share meetup details</button>
      <button data-act="profile">👤 View profile</button>
      ${cancellable ? `<button data-act="cancel">✖️ Cancel ${cancellable.status === "confirmed" ? "meetup" : "request"}</button>` : ""}
      <button data-act="report">🚩 Report ${esc(p.name)}</button>
      <button data-act="block" class="danger">⛔ ${iBlocked ? "Unblock" : "Block"} ${esc(p.name)}</button>`;
    $(".thread-head").appendChild(menu);
    const close = () => { menu.remove(); document.removeEventListener("click", close); };
    setTimeout(() => document.addEventListener("click", close));
    menu.addEventListener("click", async (e) => {
      const act = e.target.closest("[data-act]")?.dataset.act;
      if (!act) return;
      close();
      if (act === "share") return shareMeetup(chat, p);
      if (act === "profile") return openProfileById(p.uid, p.label);
      if (act === "cancel") return openCancel(cancellable);
      if (act === "report") return openReport(p.uid, p.name, chat.id);
      if (act === "block") {
        DB.setBlocked(chat.id, !iBlocked).catch(fail);
        toast(iBlocked ? `You unblocked ${p.name}.` : `You blocked ${p.name}. They can't message you.`);
        await settle();
        render();
      }
    });
  }

  // Send the meetup details to someone you trust via the phone's share sheet (or clipboard).
  async function shareMeetup(chat, p) {
    const m = latestMeetup(chat.id);
    const u = me();
    const text = `buddyup safety: I'm meeting ${p.name}${m ? ` on ${slotLabel(m.slot)}` : ""}${p.city ? ` in ${p.city}` : ""}.${u.trustedContact ? "" : ""} I'll check in afterwards.`;
    try {
      if (navigator.share) await navigator.share({ title: "My buddyup meetup", text });
      else { await navigator.clipboard.writeText(text); toast("Meetup details copied — paste them to a friend."); }
    } catch { /* share sheet dismissed */ }
  }

  // ---------- Safety ----------
  function safetyPage(user, root) {
    const blocked = DB.cache.chats.filter((c) => (c.blockedBy || []).includes(user.uid)).length;
    root.innerHTML = `
      <div class="page" style="padding-top:0">
        <div class="two-col">
          <div class="panel center fade">
            <h3>Emergency</h3>
            <a class="sos-big" href="tel:112">SOS</a>
            <p class="hint">In immediate danger? Tap SOS to call local emergency services (112 / 911).</p>
            <div style="margin-top:22px;text-align:left">
              <button class="list-item" id="contact"><span class="li-ico">👥</span><span class="grow">Trusted contact<small>${user.trustedContact ? esc(user.trustedContact) : "Not set — add someone"}</small></span><span class="chev">${I.chev}</span></button>
              <a class="list-item" href="#/messages"><span class="li-ico">⛔</span><span class="grow">Blocked users<small>${plural(blocked, "person").replace("persons", "people")} blocked · manage from the chat menu</small></span><span class="chev">${I.chev}</span></a>
            </div>
          </div>
          <div class="panel fade" style="animation-delay:.05s">
            <h3>Meet-up tips</h3>
            <div class="tips-grid">
              ${[["☕", "Meet in public", "Busy cafés, squares and landmarks for first meetups."],
                 ["📲", "Tell someone", "Share who you're meeting, where and when (chat menu → Share meetup details)."],
                 ["💬", "Stay on buddyup", "Keep chatting in-app until you trust each other."],
                 ["💸", "No pressure to pay", "buddyup is free. Tips to locals are always optional."],
                 ["🔋", "Stay charged", "Keep your phone charged and know your way back."],
                 ["🚩", "Trust your gut", "It's always OK to leave. Report anything that feels off."]]
                .map(([e, t, s]) => `<div class="list-item"><span class="li-ico">${e}</span><span class="grow">${t}<small>${s}</small></span></div>`).join("")}
            </div>
            <h3 style="margin-top:28px">How we verify locals</h3>
            <div class="tips-grid">
              ${[["🏠", "Residency", "At least 6 months in the city; postcode checked against their neighbourhood."],
                 ["🧭", "Local knowledge", "Questions about hidden spots, food and getting around."],
                 ["📱", "Phone check", "A one-time SMS code sent by Firebase."],
                 ["🪪", "ID & selfie", "Stored privately and reviewed by our team before approval."]]
                .map(([e, t, s]) => `<div class="list-item"><span class="li-ico">${e}</span><span class="grow">${t}<small>${s}</small></span></div>`).join("")}
            </div>
          </div>
        </div>
      </div>`;
    $("#contact").addEventListener("click", () => {
      openModal(`
        <button class="modal-close" data-close aria-label="Close">${I.close}</button>
        <div class="modal-body plain">
          <h3>Trusted contact</h3>
          <p class="hint" style="margin:6px 0 18px">Only you can see this. Share your meetup details with them from the chat menu.</p>
          <form id="tc"><div class="field"><input class="input" name="c" value="${esc(user.trustedContact || "")}" placeholder="Name and phone number"/></div>
          <button class="btn btn-primary btn-block">Save contact</button></form>
        </div>`);
      $("#tc").addEventListener("submit", async (e) => {
        e.preventDefault();
        DB.savePrivate({ trustedContact: e.target.c.value.trim() }).catch(fail);
        closeModal();
        toast("Trusted contact saved.");
        await settle();
        render();
      });
    });
  }

  // ---------- Profile ----------
  function profilePage(user, root) {
    const v = user.verification;
    const localStatus = !v ? "Not set up yet" : user.approved ? `✓ Verified in ${esc(user.localCity)}` : v.completed ? `In review · ${esc(user.localCity)}` : `Verification in progress · ${esc(user.localCity)}`;
    const travellerStatus = user.trip?.city ? `Exploring ${esc(user.trip.city)}${tripDates(user.trip) ? ` · ${tripDates(user.trip)}` : ""}` : "No trip planned";
    const modeRow = (key, ico, title, status) => {
      const on = user.mode === key;
      const label = key === "local" && !v ? "Become a local" : "Switch";
      return `<div class="list-item"><span class="li-ico">${ico}</span><span class="grow">${title}<small>${status}</small></span>
        ${on ? `<span class="badge ${key === "local" ? "badge-local" : "badge-buddy"}">Active</span>` : `<button class="btn ${key === "local" && !v ? "btn-coral" : "btn-outline"} btn-sm" data-switch="${key}">${label}</button>`}</div>`;
    };
    root.innerHTML = `
      <div class="page" style="padding-top:0">
        <div class="two-col">
          <div class="panel profile-card fade">
            <label class="avatar-upload" title="Change photo">
              ${userAvatar(user, 104)}
              <span class="cam">📷</span>
              <input type="file" id="photo" accept="image/*" hidden/>
            </label>
            <h2>${esc(user.name)}</h2>
            <div class="stats" style="justify-content:center;margin-top:6px">${ratingText(DB.cache.reviewsToMe)}</div>
            <div class="muted" style="font-size:13.5px;margin-top:4px">${user.from ? `From ${esc(user.from)}` : user.localCity ? `Lives in ${esc(user.localCity)}` : ""}</div>
            ${user.bio ? `<p class="bio-text">${esc(user.bio)}</p>` : ""}
            <div class="chips">${(user.interests || []).map((t) => `<span class="chip tag">${esc(t)}</span>`).join("") || '<span class="hint">No interests added yet</span>'}</div>
            ${v?.completed ? `
              <div class="trust">
                <div class="ring" style="--p:${v.trustScore || 0}"><span>${v.trustScore || 0}</span></div>
                <div><strong>${user.approved ? "Verified local ✓" : "Local verification in review"}</strong>
                <p>${user.approved ? "Travellers can see your verified tick." : "Our team reviews new locals within 24 hours."}</p></div>
              </div>` : ""}
          </div>
          <div class="panel fade" style="animation-delay:.05s">
            <h3>How you use buddyup</h3>
            ${modeRow("traveller", "🎒", "Traveller", travellerStatus)}
            ${modeRow("local", "🏠", "Local", localStatus)}
            ${user.mode === "traveller" ? `<a class="list-item" href="#/discover"><span class="li-ico">📍</span><span class="grow">Change destination &amp; times<small>${travellerStatus}</small></span><span class="chev">${I.chev}</span></a>` : ""}
            ${user.mode === "local" && user.approved ? `<a class="list-item" href="#/availability"><span class="li-ico">📅</span><span class="grow">Availability<small>${user.availability ? `Set until ${fmtYmd(user.availability.horizon)}` : "Not set yet"}</small></span><span class="chev">${I.chev}</span></a>` : ""}
            <h3 style="margin-top:26px">Settings</h3>
            <button class="list-item" id="edit"><span class="li-ico">✏️</span><span class="grow">Edit profile<small>Photo, name, bio and interests</small></span><span class="chev">${I.chev}</span></button>
            <div class="list-item"><span class="li-ico">🔐</span><span class="grow">Account<small>${esc(user.email || "")}${DB.currentAuthUser()?.providerData?.some((x) => x.providerId === "google.com") ? " · Google sign-in" : ""}</small></span></div>
            <button class="list-item" id="invite"><span class="li-ico">🔗</span><span class="grow">Invite friends</span><span class="chev">${I.chev}</span></button>
            <button class="list-item danger" id="logout"><span class="li-ico">↩️</span><span class="grow">Log out</span></button>
          </div>
        </div>
        <section class="panel fade" style="margin-top:28px">
          <h3>Reviews about you</h3>
          ${reviewsBlock(DB.cache.reviewsToMe, "No reviews yet — after each meetup, the people you meet can rate and review you here.")}
        </section>
      </div>`;
    $$("[data-switch]", root).forEach((b) => b.addEventListener("click", () => switchMode(me(), b.dataset.switch)));
    $("#photo").addEventListener("change", (e) => uploadPhoto(e.target.files[0]));
    $("#edit").addEventListener("click", () => openEditProfile(me()));
    $("#invite").addEventListener("click", async () => {
      const text = `Join me on buddyup — find a local or a travel buddy wherever you go: ${location.origin}${location.pathname}`;
      try { if (navigator.share) await navigator.share({ title: "buddyup", text }); else { await navigator.clipboard.writeText(text); toast("Invite link copied!"); } } catch { /* dismissed */ }
    });
    $("#logout").addEventListener("click", () => {
      state.thread?.unsub();
      state.thread = null;
      state.results = null;
      state.authTab = "login";
      DB.signOut();
      go("#/");
    });
  }

  async function uploadPhoto(file) {
    if (!file) return;
    toast("Uploading photo…");
    try {
      await DB.uploadAvatar(file);
      toast("Profile photo updated.");
      await settle();
      render();
    } catch (e) { fail(e); }
  }

  function openEditProfile(user) {
    let interests = [...(user.interests || [])];
    openModal(`
      <button class="modal-close" data-close aria-label="Close">${I.close}</button>
      <div class="modal-body plain">
        <h3>Edit profile</h3>
        <form id="editform" novalidate style="margin-top:16px">
          <div class="edit-photo">
            ${userAvatar(user, 72)}
            <label class="btn btn-outline btn-sm">📷 Change photo<input type="file" id="ephoto" accept="image/*" hidden/></label>
          </div>
          <div class="field"><label>Name</label><input class="input" name="name" value="${esc(user.name)}" maxlength="60"/></div>
          ${user.role === "traveller" || user.from ? `<div class="field"><label>Where are you from?</label><input class="input" name="from" value="${esc(user.from || "")}" placeholder="City or country"/></div>` : ""}
          <div class="field"><label>About you</label><textarea class="textarea" name="bio" maxlength="400" placeholder="A line or two about you — what you love doing, what you'd like to see.">${esc(user.bio || "")}</textarea></div>
          <div class="field"><label>Interests</label>
            <div class="chips">${INTERESTS.map((t) => `<button type="button" class="chip ${interests.includes(t) ? "active" : ""}" data-interest="${esc(t)}">${esc(t)}</button>`).join("")}</div></div>
          <div class="error" id="eerr"></div>
          <button class="btn btn-primary btn-block">Save changes</button>
        </form>
      </div>`);
    const form = $("#editform");
    suggestCities(form.from, false);
    $("#ephoto").addEventListener("change", (e) => { closeModal(); uploadPhoto(e.target.files[0]); });
    $$("[data-interest]", form).forEach((c) => c.addEventListener("click", () => {
      const t = c.dataset.interest;
      interests = interests.includes(t) ? interests.filter((x) => x !== t) : [...interests, t];
      c.classList.toggle("active");
    }));
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = form.name.value.trim();
      if (!name) return ($("#eerr").textContent = "Please add your name.");
      const patch = { name, bio: form.bio.value.trim(), interests };
      if (form.from) patch.from = titleCase(form.from.value);
      DB.saveProfile(patch).catch(fail);
      closeModal();
      toast("Profile updated.");
      await settle();
      render();
    });
  }

  // ---------- Modal ----------
  function openModal(html) {
    modalRoot.innerHTML = `<div class="modal-backdrop"><div class="modal">${html}</div></div>`;
    $$("[data-close]", modalRoot).forEach((b) => b.addEventListener("click", closeModal));
    $(".modal-backdrop", modalRoot).addEventListener("click", (e) => { if (e.target.classList.contains("modal-backdrop")) closeModal(); });
  }
  function closeModal() { modalRoot.innerHTML = ""; }
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });

  // ---------- Boot ----------
  DB.finishRedirect().catch(fail); // completes a Google sign-in that fell back to a redirect
  render();
})();
