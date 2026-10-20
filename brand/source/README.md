# Brand asset sources

Everything in `brand/` is generated from these files with headless Chrome (fonts come from the repo's `fonts/` folder). Edit the HTML, then regenerate.

| Asset | Source | How to regenerate |
|---|---|---|
| Flyers (`buddyup-flyer-A5*.pdf/.png`) | `flyer-en-luxembourg.html`, `flyer-en-general.html`, `flyer-de.html` (`{{QR}}` is replaced with `qr-buddyup.svg`) | `brand/source/make-flyers.sh` |
| Instagram Reel (`buddyup-reel-15s.mp4`) | `reel.html` (each frame is drawn by `seek(t)`), `render.js` | see below |
| Facebook post (`buddyup-facebook-post.png`) | `facebook-post.html` | open in Chrome headless at 1080x1080 and screenshot |
| Share image (`og.png` in the repo root) | `share-image.html` | screenshot at 1200x630 |
| Logo PNGs | `logo-icon.html`, `logo-wordmark.html` | screenshot with a transparent background |

The QR code points to https://buddyup.fyi. To make a new one: `npx qrcode -t svg -e H -m 0 -o qr-buddyup.svg "https://buddyup.fyi"`.

## Reel

Needs Node 22 and ffmpeg (`brew install ffmpeg`).

```
cd brand/source
npm install puppeteer-core@23
node preview.js                 # a few stills, to check before rendering everything
node render.js frames 30        # 480 PNG frames
ffmpeg -framerate 30 -i frames/f%04d.png -c:v libx264 -profile:v high -pix_fmt yuv420p -crf 18 -preset slow -movflags +faststart ../buddyup-reel-15s.mp4
```

Keep text between 260px and 1480px from the top: Instagram covers the top and bottom of a Reel with its own UI.
