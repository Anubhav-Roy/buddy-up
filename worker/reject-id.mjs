// Asks a local for a new ID photo (see README → "Asking for a new ID photo"). Run from your
// machine, not the Worker. Uses the same Firebase service account as verify-reminder.mjs:
//   ~/.secrets/buddyup-service-account.json, or FIREBASE_SERVICE_ACCOUNT if set.
//
//   node reject-id.mjs them@mail.com                    # dry run: shows the user, changes nothing
//   node reject-id.mjs them@mail.com --apply "reason"   # sets verification.idRejected = "reason"
//                                                       # and deletes their old ID photo
//
// The reason is shown to the local on the "Please upload your ID again" screen. Leave it out
// (just --apply) to set idRejected = true with no note. Doesn't send any email.

import { webcrypto } from "node:crypto";
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
if (!globalThis.crypto) globalThis.crypto = webcrypto;

const args = process.argv.slice(2);
const target = (args[0] || "").toLowerCase();
const apply = args.includes("--apply");
const reasonArg = apply ? args[args.indexOf("--apply") + 1] : undefined;
const reason = reasonArg && !reasonArg.startsWith("--") ? reasonArg.trim() : "";
if (!/^[^@\s]+@[^@\s]+$/.test(target)) throw new Error("usage: node reject-id.mjs <email> [--apply \"reason\"]");
if (reason.length > 300) throw new Error("keep the reason under 300 characters");

const SERVICE_ACCOUNT = process.env.FIREBASE_SERVICE_ACCOUNT?.trim()
  || (() => { try { return readFileSync(`${homedir()}/.secrets/buddyup-service-account.json`, "utf8"); } catch { return ""; } })();
if (!SERVICE_ACCOUNT) throw new Error("missing ~/.secrets/buddyup-service-account.json");
const sa = JSON.parse(SERVICE_ACCOUNT);
const db = `https://firestore.googleapis.com/v1/projects/${sa.project_id}/databases/(default)/documents`;
const auth = { Authorization: `Bearer ${await googleAccessToken(sa)}` };

// Find the user by the email in their private/info.
let found = null, page = "";
outer: do {
  const res = await fetch(`${db}/users?pageSize=300${page ? `&pageToken=${page}` : ""}`, { headers: auth });
  if (!res.ok) throw new Error(`firestore list ${res.status}`);
  const j = await res.json();
  for (const d of j.documents || []) {
    const uid = d.name.split("/").pop();
    const info = await fetch(`${db}/users/${uid}/private/info`, { headers: auth });
    if (!info.ok) continue;
    const p = (await info.json()).fields || {};
    if ((p.email?.stringValue || "").toLowerCase() === target) { found = { uid, f: d.fields || {}, p }; break outer; }
  }
  page = j.nextPageToken;
} while (page);
if (!found) throw new Error(`no user with email ${target}`);

const { uid, f, p } = found;
const v = p.verification?.mapValue?.fields || {};
const idDoc = await fetch(`${db}/users/${uid}/verification/id?mask.fieldPaths=uploadedAt`, { headers: auth });
console.log({
  uid,
  name: f.name?.stringValue,
  mode: f.mode?.stringValue,
  localCity: f.localCity?.stringValue,
  approved: !!f.approved?.booleanValue,
  verificationCompleted: !!v.completed?.booleanValue,
  idRejected: v.idRejected ? (v.idRejected.stringValue ?? v.idRejected.booleanValue) : undefined,
  idPhotoOnFile: idDoc.ok,
});

if (!apply) { console.log("\nDry run — nothing changed. Add --apply \"reason\" to ask for a new ID photo."); process.exit(0); }
if (f.approved?.booleanValue) throw new Error("this local is already approved; set approved to false first if you really mean to reject them");

const value = reason ? { stringValue: reason } : { booleanValue: true };
const patch = await fetch(`${db}/users/${uid}/private/info?updateMask.fieldPaths=verification.idRejected`, {
  method: "PATCH", headers: { ...auth, "Content-Type": "application/json" },
  body: JSON.stringify({ fields: { verification: { mapValue: { fields: { idRejected: value } } } } }),
});
if (!patch.ok) throw new Error(`setting idRejected failed: ${patch.status} ${await patch.text()}`);
console.log(`\nSet verification.idRejected = ${JSON.stringify(reason || true)}`);

if (idDoc.ok) {
  const del = await fetch(`${db}/users/${uid}/verification/id`, { method: "DELETE", headers: auth });
  if (!del.ok) throw new Error(`deleting the old ID photo failed: ${del.status} ${await del.text()}`);
  console.log("Deleted the old ID photo (users/" + uid + "/verification/id)");
}

async function googleAccessToken(sa) {
  const b64url = (data) => btoa(typeof data === "string" ? data : String.fromCharCode(...new Uint8Array(data))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = b64url(JSON.stringify({ iss: sa.client_email, scope: "https://www.googleapis.com/auth/datastore", aud: sa.token_uri || "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600 }));
  const der = Uint8Array.from(atob(sa.private_key.replace(/-----[^-]+-----/g, "").replace(/\s+/g, "")), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey("pkcs8", der, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(`${header}.${claims}`));
  const res = await fetch(sa.token_uri || "https://oauth2.googleapis.com/token", {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${header}.${claims}.${b64url(sig)}` }),
  });
  if (!res.ok) throw new Error(`google token ${res.status}`);
  return (await res.json()).access_token;
}
