#!/bin/bash
# Regenerates the flyers (PDF for print + PNG for sharing) from the HTML templates.
# Usage: brand/source/make-flyers.sh   (OUT=/some/dir to write elsewhere; default: brand/)
set -euo pipefail
cd "$(dirname "$0")"
OUT="${OUT:-..}"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
for pair in "flyer-en-luxembourg:buddyup-flyer-A5" "flyer-en-general:buddyup-flyer-A5-general" "flyer-de:buddyup-flyer-A5-de"; do
  src="${pair%%:*}" out="${pair##*:}"
  node -e 'const fs = require("fs"); fs.writeFileSync(process.argv[2], fs.readFileSync(process.argv[1], "utf8").replace("{{QR}}", fs.readFileSync("qr-buddyup.svg", "utf8")))' "$src.html" "$src.tmp.html"
  "$CHROME" --headless=new --disable-gpu --user-data-dir=/tmp/buddyup-flyer-pdf --no-pdf-header-footer --print-to-pdf="$OUT/$out.pdf" "file://$PWD/$src.tmp.html" >/dev/null 2>&1
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars --user-data-dir=/tmp/buddyup-flyer-png --force-device-scale-factor=3 --window-size=560,794 --screenshot="$OUT/$out.png" "file://$PWD/$src.tmp.html" >/dev/null 2>&1
  rm "$src.tmp.html"
  echo "wrote $out.pdf and $out.png"
done
