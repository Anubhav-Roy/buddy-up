// buddyup data layer: Firebase Auth + Cloud Firestore (no Cloud Storage — everything fits the free tier).
//
// The signed-in user's own data (profile, private details, meetups, chats, reviews) is
// kept in an in-memory cache that Firestore listeners keep in sync, so the UI can render
// synchronously and re-render when something changes. Other people's profiles are
// fetched on demand. Access control lives in firestore.rules.
//
// Data model
//   users/{uid}               public profile — readable by any signed-in user
//   users/{uid}/private/info  email, phone, verification answers, trusted contact — owner only
//   meetups/{id}              a meetup request between two users (participants = [from, to])
//   chats/{uidA_uidB}         one conversation per pair; messages in chats/{id}/messages
//   reviews/{meetupId_uid}    one review per person per completed meetup
//   users/{uid}/verification/{id|selfie}  compressed ID / selfie photos — write-only from the
//                             app; reviewers view them in the Firebase console
//   reports/{id}              safety reports — write-only for users
//   Profile photos are small JPEG data URLs stored in users/{uid}.photoURL.
window.BuddyDB = (function () {
  const cfg = window.BUDDY_FIREBASE_CONFIG || {};
  const ready = !!(window.firebase?.firestore && cfg.apiKey && cfg.authDomain && cfg.projectId);
  let auth = null, db = null;
  if (ready) {
    if (!firebase.apps.some((a) => a.name === "[DEFAULT]")) firebase.initializeApp(cfg);
    auth = firebase.auth();
    db = firebase.firestore();
  }
  const FV = () => firebase.firestore.FieldValue;
  const now = () => FV().serverTimestamp();
  const ms = (t) => (t?.toMillis ? t.toMillis() : typeof t === "number" ? t : Date.now());
  const SNAP = { serverTimestamps: "estimate" };

  const cache = { authKnown: false, uid: null, authUser: null, profile: undefined, private: undefined, meetups: [], chats: [], reviewsToMe: [], reviewsByMe: [], loaded: false };
  const subs = new Set();
  const emit = (kind) => subs.forEach((fn) => fn(kind));
  let unsubs = [];

  // Firestore can't store nested arrays, so time ranges are kept as "10:00-14:00" strings.
  const packWindows = (w = {}) => Object.fromEntries(Object.entries(w).map(([d, list]) => [d, list.map(([a, b]) => `${a}-${b}`)]));
  const unpackWindows = (w = {}) => Object.fromEntries(Object.entries(w || {}).map(([d, list]) => [d, list.map((s) => s.split("-"))]));

  // A user document as the UI expects it (time ranges unpacked, timestamps as millis).
  function toUser(uid, data) {
    if (!data) return null;
    return {
      ...data, uid, id: uid,
      trip: data.trip ? { ...data.trip, windows: unpackWindows(data.trip.windows) } : null,
      availability: data.availability ? { ...data.availability, windows: unpackWindows(data.availability.windows), booked: data.availability.booked || [] } : null,
      createdAt: ms(data.createdAt),
    };
  }
  const withId = (d) => ({ id: d.id, ...d.data(SNAP) });

  function stopListeners() { unsubs.forEach((u) => u()); unsubs = []; }

  function startListeners(uid) {
    stopListeners();
    const seen = new Set();
    const loaded = (k) => {
      seen.add(k);
      if (!cache.loaded && ["profile", "private", "meetups", "chats"].every((x) => seen.has(x))) { cache.loaded = true; emit("loaded"); }
    };
    const fail = (e) => { console.error(e); if (!cache.loaded) { cache.loaded = true; emit("loaded"); } emit({ error: e }); };
    unsubs.push(db.doc(`users/${uid}`).onSnapshot((s) => { cache.profile = s.exists ? s.data(SNAP) : null; loaded("profile"); emit("profile"); }, fail));
    unsubs.push(db.doc(`users/${uid}/private/info`).onSnapshot((s) => { cache.private = s.exists ? s.data(SNAP) : {}; loaded("private"); emit("profile"); }, fail));
    unsubs.push(db.collection("meetups").where("participants", "array-contains", uid).onSnapshot((q) => { cache.meetups = q.docs.map(withId); loaded("meetups"); emit("meetups"); }, fail));
    unsubs.push(db.collection("chats").where("participants", "array-contains", uid).onSnapshot((q) => { cache.chats = q.docs.map(withId); loaded("chats"); emit("chats"); }, fail));
    unsubs.push(db.collection("reviews").where("to", "==", uid).onSnapshot((q) => { cache.reviewsToMe = q.docs.map(withId); emit("reviews"); }, fail));
    unsubs.push(db.collection("reviews").where("from", "==", uid).onSnapshot((q) => { cache.reviewsByMe = q.docs.map(withId); emit("reviews"); }, fail));
  }

  if (auth) {
    auth.onAuthStateChanged((u) => {
      Object.assign(cache, { authKnown: true, authUser: u, uid: u?.uid || null, profile: undefined, private: undefined, meetups: [], chats: [], reviewsToMe: [], reviewsByMe: [], loaded: false });
      if (u) startListeners(u.uid); else stopListeners();
      emit("auth");
    });
  }

  // The signed-in user: public profile merged with their private details.
  function me() {
    if (!cache.uid || !cache.profile) return null;
    const p = cache.private || {};
    return { ...toUser(cache.uid, cache.profile), email: p.email || cache.authUser?.email || "", phone: p.phone || "", verification: p.verification || null, trustedContact: p.trustedContact || "" };
  }

  // ---------- Errors ----------
  function friendlyError(e) {
    const code = e?.code || "";
    return ({
      "auth/invalid-credential": "Email or password is incorrect.",
      "auth/wrong-password": "Email or password is incorrect.",
      "auth/user-not-found": "Email or password is incorrect.",
      "auth/invalid-email": "That email doesn't look right.",
      "auth/email-already-in-use": "An account with this email already exists — try logging in.",
      "auth/weak-password": "Please choose a stronger password (at least 8 characters).",
      "auth/too-many-requests": "Too many attempts. Please wait a few minutes and try again.",
      "auth/popup-closed-by-user": "Sign-in was cancelled.",
      "auth/cancelled-popup-request": "Sign-in was cancelled.",
      "auth/account-exists-with-different-credential": "You already have a buddyup account with this email using a different sign-in method.",
      "auth/unauthorized-domain": "This website's address isn't authorised in Firebase yet (Authentication → Settings → Authorized domains).",
      "auth/operation-not-allowed": "This sign-in method isn't switched on in Firebase yet.",
      "auth/network-request-failed": "Network error — check your connection and try again.",
      "permission-denied": "buddyup couldn't access the database. Make sure the Firestore rules from firestore.rules are published.",
      "failed-precondition": "Firestore needs an index or setup step for this — check the browser console for a link.",
      unavailable: "You're offline — changes will sync when you're back online.",
    })[code] || "Something went wrong. Please try again.";
  }

  // ---------- Auth ----------
  const signUpEmail = (email, password) => auth.createUserWithEmailAndPassword(email, password);
  const signInEmail = (email, password) => auth.signInWithEmailAndPassword(email, password);
  const resetPassword = (email) => auth.sendPasswordResetEmail(email);
  async function signInGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    try {
      return await auth.signInWithPopup(provider);
    } catch (e) {
      if (e.code === "auth/popup-blocked") return auth.signInWithRedirect(provider); // some browsers block popups
      throw e;
    }
  }
  const signOut = () => auth.signOut();
  const finishRedirect = () => (auth ? auth.getRedirectResult() : Promise.resolve(null));

  // ---------- Profile ----------
  function prepare(patch) {
    const out = { ...patch };
    if (patch.trip) {
      out.trip = { ...patch.trip, windows: packWindows(patch.trip.windows) };
      out.tripCity = patch.trip.city;
      out.tripEnd = patch.trip.end;
    }
    if (patch.availability) out.availability = { ...patch.availability, windows: packWindows(patch.availability.windows), booked: patch.availability.booked || [] };
    return out;
  }

  // `uid` is passed explicitly: right after sign-up the auth listener may not have fired yet.
  function createProfile(uid, publicData, privateData) {
    const batch = db.batch();
    batch.set(db.doc(`users/${uid}`), { ...prepare(publicData), approved: false, createdAt: now(), updatedAt: now() });
    batch.set(db.doc(`users/${uid}/private/info`), { ...privateData, createdAt: now() });
    return batch.commit();
  }
  // update() replaces each top-level field wholesale (so removed dates/times really disappear).
  const saveProfile = (patch) => db.doc(`users/${cache.uid}`).update({ ...prepare(patch), updatedAt: now() });
  const savePrivate = (patch) => db.doc(`users/${cache.uid}/private/info`).set(patch, { merge: true });

  // ---------- People ----------
  const getProfile = async (uid) => { const s = await db.doc(`users/${uid}`).get(); return s.exists ? toUser(uid, s.data()) : null; };
  const findLocals = async (city) => (await db.collection("users").where("localCity", "==", city).where("approved", "==", true).limit(200).get()).docs.map((d) => toUser(d.id, d.data()));
  const findTravellers = async (city) => (await db.collection("users").where("tripCity", "==", city).limit(200).get()).docs.map((d) => toUser(d.id, d.data()));

  async function reviewsFor(uids) {
    const list = [...new Set(uids)].filter(Boolean);
    const out = [];
    for (let i = 0; i < list.length; i += 30) { // "in" queries accept up to 30 values
      const q = await db.collection("reviews").where("to", "in", list.slice(i, i + 30)).get();
      q.docs.forEach((d) => out.push(withId(d)));
    }
    return out.map((r) => ({ ...r, ts: ms(r.ts) }));
  }

  // ---------- Meetups & chat ----------
  const pairId = (a, b) => [a, b].sort().join("_");
  const ts = (millis) => firebase.firestore.Timestamp.fromMillis(millis);

  // Creates (if needed) the pair's chat, the meetup request and the first message in one batch.
  async function requestMeetup({ to, kind, slot, slotStart, slotEnd, message, people }) {
    const from = cache.uid;
    const chatId = pairId(from, to);
    const chatRef = db.doc(`chats/${chatId}`);
    const exists = cache.chats.some((c) => c.id === chatId);
    const meetupRef = db.collection("meetups").doc();
    const batch = db.batch();
    const last = { lastMessage: { from, text: message, ts: now() }, updatedAt: now() };
    // One write per document in the batch, so security rules see a single create or update.
    if (exists) batch.set(chatRef, last, { merge: true });
    else batch.set(chatRef, { participants: [from, to], people, blockedBy: [], readAt: {}, createdAt: now(), ...last });
    batch.set(meetupRef, { from, to, participants: [from, to], kind, slot, slotStart: ts(slotStart), slotEnd: ts(slotEnd), status: "requested", message, people, chatId, reviewed: {}, createdAt: now() });
    batch.set(chatRef.collection("messages").doc(), { from, text: message, meetupId: meetupRef.id, ts: now() });
    await batch.commit();
    return { chatId, meetupId: meetupRef.id };
  }

  async function setMeetupStatus(meetup, status, note) {
    const batch = db.batch();
    batch.update(db.doc(`meetups/${meetup.id}`), { status, [`${status}At`]: now() });
    if (note) {
      const chatRef = db.doc(`chats/${meetup.chatId}`);
      batch.set(chatRef.collection("messages").doc(), { from: cache.uid, type: "sys", text: note, ts: now() });
      batch.set(chatRef, { lastMessage: { from: cache.uid, text: note, ts: now(), type: "sys" }, updatedAt: now() }, { merge: true });
    }
    return batch.commit();
  }

  // Either side can cancel with a reason; it's saved on the meetup and posted in the chat
  // (unless the chat is blocked, where no new messages are allowed).
  async function cancelMeetup(meetup, reason, note) {
    const batch = db.batch();
    batch.update(db.doc(`meetups/${meetup.id}`), { status: "cancelled", cancelledAt: now(), cancelledBy: cache.uid, cancelReason: reason });
    const chat = cache.chats.find((c) => c.id === meetup.chatId);
    if (note && !(chat?.blockedBy || []).length) {
      const chatRef = db.doc(`chats/${meetup.chatId}`);
      batch.set(chatRef.collection("messages").doc(), { from: cache.uid, type: "sys", text: note, ts: now() });
      batch.set(chatRef, { lastMessage: { from: cache.uid, text: note, ts: now(), type: "sys" }, updatedAt: now() }, { merge: true });
    }
    return batch.commit();
  }

  const watchMessages =(chatId, cb) => db.collection(`chats/${chatId}/messages`).orderBy("ts").limitToLast(300)
    .onSnapshot((q) => cb(q.docs.map((d) => { const m = withId(d); return { ...m, ts: ms(m.ts) }; })), (e) => emit({ error: e }));

  function sendMessage(chatId, text) {
    const chatRef = db.doc(`chats/${chatId}`);
    const batch = db.batch();
    batch.set(chatRef.collection("messages").doc(), { from: cache.uid, text, ts: now() });
    batch.set(chatRef, { lastMessage: { from: cache.uid, text, ts: now() }, updatedAt: now() }, { merge: true });
    return batch.commit();
  }
  const markRead = (chatId) => db.doc(`chats/${chatId}`).update({ [`readAt.${cache.uid}`]: now() });
  const setBlocked = (chatId, on) => db.doc(`chats/${chatId}`).update({ blockedBy: on ? FV().arrayUnion(cache.uid) : FV().arrayRemove(cache.uid) });

  // ---------- Reviews & reports ----------
  function addReview(meetup, { rating, text, fromName, fromRole }) {
    const to = meetup.participants.find((p) => p !== cache.uid);
    const batch = db.batch();
    batch.set(db.doc(`reviews/${meetup.id}_${cache.uid}`), { meetupId: meetup.id, from: cache.uid, to, fromName, fromRole, rating, text, ts: now() });
    batch.update(db.doc(`meetups/${meetup.id}`), { [`reviewed.${cache.uid}`]: rating });
    return batch.commit();
  }
  const report = (data) => db.collection("reports").add({ ...data, from: cache.uid, ts: now() });

  // ---------- Photos (stored in Firestore, no Cloud Storage) ----------
  // Images are resized and re-encoded as JPEG in the browser, then saved as data URLs.
  // Firestore documents are capped at 1 MB, so quality steps down until the image fits.
  async function toJpegDataUrl(file, maxSide, maxBytes) {
    if (!/^image\//.test(file.type)) throw { message: "Please choose a photo (JPG, PNG or HEIC)." };
    const img = await new Promise((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject({ message: "We couldn't read that image — try a JPG or PNG." });
      i.src = URL.createObjectURL(file);
    });
    const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(img.width * scale));
    canvas.height = Math.max(1, Math.round(img.height * scale));
    canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
    URL.revokeObjectURL(img.src);
    for (const q of [0.85, 0.7, 0.55, 0.4]) {
      const url = canvas.toDataURL("image/jpeg", q);
      if (url.length <= maxBytes) return url;
    }
    throw { message: "That photo is too detailed to save — try a smaller one." };
  }

  async function uploadAvatar(file) {
    const url = await toJpegDataUrl(file, 256, 150 * 1024);
    await saveProfile({ photoURL: url });
    return url;
  }

  // ID documents and selfies are write-only from the app; only reviewers can open them.
  async function uploadVerificationFile(kind, file) {
    const image = await toJpegDataUrl(file, 1280, 800 * 1024);
    const path = `users/${cache.uid}/verification/${kind}`;
    await db.doc(path).set({ image, uploadedAt: now() });
    return path;
  }

  return {
    ready, cache, me, onChange: (fn) => subs.add(fn), friendlyError, ms,
    signUpEmail, signInEmail, resetPassword, signInGoogle, signOut, finishRedirect, currentAuthUser: () => cache.authUser,
    createProfile, saveProfile, savePrivate, getProfile, findLocals, findTravellers, reviewsFor,
    pairId, requestMeetup, setMeetupStatus, cancelMeetup, watchMessages, sendMessage, markRead, setBlocked,
    addReview, report, uploadAvatar, uploadVerificationFile,
  };
})();
