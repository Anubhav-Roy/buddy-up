// `node build.js` → public/ (the files the website serves, deployed with `npx wrangler deploy`)
// and dist/buddy.html (the whole site bundled into one self-contained file).
// (Google sign-in and SMS verification still need the site served over http(s), not opened as a file.)
const fs = require("fs");
const path = require("path");

const read = (f) => fs.readFileSync(path.join(__dirname, f), "utf8");
const inline = (tag, body) => `<${tag}>\n${body}\n</${tag}>`;

// Only these files are published, so nothing else in the repo (.git, rules, README…) is public.
const SITE = ["index.html", "styles.css", "autocomplete.css", "firebase-config.js", "db.js", "cities.js", "data.js", "legal.js", "app.js"];
// Fonts and the Firebase SDK are served from our own domain (no requests to Google's CDNs).
const DIRS = ["fonts", "vendor"];
const pub = path.join(__dirname, "public");
fs.rmSync(pub, { recursive: true, force: true });
fs.mkdirSync(pub);
SITE.forEach((f) => fs.copyFileSync(path.join(__dirname, f), path.join(pub, f)));
DIRS.forEach((d) => fs.cpSync(path.join(__dirname, d), path.join(pub, d), { recursive: true }));
console.log(`public/ written (${SITE.length} files + ${DIRS.join("/, ")}/)`);

let html = read("index.html")
  .replace('<link rel="stylesheet" href="styles.css" />', inline("style", read("styles.css")))
  .replace('<link rel="stylesheet" href="autocomplete.css" />', inline("style", read("autocomplete.css")));
for (const file of ["vendor/firebase-app-compat.js", "vendor/firebase-auth-compat.js", "vendor/firebase-firestore-compat.js", "firebase-config.js", "db.js", "cities.js", "data.js", "legal.js", "app.js"]) {
  html = html.replace(`<script src="${file}"></script>`, inline("script", read(file)));
}
fs.mkdirSync(path.join(__dirname, "dist"), { recursive: true });
fs.writeFileSync(path.join(__dirname, "dist", "buddy.html"), html);
console.log(`dist/buddy.html written (${Math.round(html.length / 1024)} KB)`);
