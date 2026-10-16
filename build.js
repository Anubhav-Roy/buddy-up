// Bundles the site into one self-contained file: `node build.js` → dist/buddy.html
// (Google sign-in and SMS verification still need the site served over http(s), not opened as a file.)
const fs = require("fs");
const path = require("path");

const read = (f) => fs.readFileSync(path.join(__dirname, f), "utf8");
const inline = (tag, body) => `<${tag}>\n${body}\n</${tag}>`;

let html = read("index.html")
  .replace('<link rel="stylesheet" href="styles.css" />', inline("style", read("styles.css")))
  .replace('<link rel="stylesheet" href="autocomplete.css" />', inline("style", read("autocomplete.css")));
for (const file of ["firebase-config.js", "db.js", "phone.js", "cities.js", "data.js", "app.js"]) {
  html = html.replace(`<script src="${file}"></script>`, inline("script", read(file)));
}
fs.mkdirSync(path.join(__dirname, "dist"), { recursive: true });
fs.writeFileSync(path.join(__dirname, "dist", "buddy.html"), html);
console.log(`dist/buddy.html written (${Math.round(html.length / 1024)} KB)`);
