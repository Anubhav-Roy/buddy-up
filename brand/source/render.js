// Renders reel.html frame by frame with headless Chrome: node render.js <outdir> [fps]
const puppeteer = require("puppeteer-core");
const path = require("path");
const fs = require("fs");
(async () => {
  const out = process.argv[2], fps = +(process.argv[3] || 30);
  fs.mkdirSync(out, { recursive: true });
  const browser = await puppeteer.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: "new", args: ["--hide-scrollbars", "--force-color-profile=srgb"] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1920, deviceScaleFactor: 1 });
  await page.goto("file://" + path.resolve(__dirname, "reel.html"), { waitUntil: "networkidle0" });
  await page.evaluate(() => document.fonts.ready);
  const duration = await page.evaluate(() => window.DURATION);
  const frames = Math.round(duration * fps);
  for (let i = 0; i < frames; i++) {
    await page.evaluate((t) => window.seek(t), i / fps);
    await page.screenshot({ path: path.join(out, `f${String(i).padStart(4, "0")}.png`) });
  }
  await browser.close();
  console.log(`${frames} frames`);
})().catch((e) => { console.error(e); process.exit(1); });
