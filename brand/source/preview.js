const puppeteer = require("puppeteer-core"); const path = require("path");
(async () => {
  const b = await puppeteer.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: "new", args: ["--hide-scrollbars"] });
  const p = await b.newPage(); await p.setViewport({ width: 1080, height: 1920 });
  await p.goto("file://" + path.resolve(__dirname, "reel.html"), { waitUntil: "networkidle0" }); await p.evaluate(() => document.fonts.ready);
  for (const t of [1.8, 3.8, 6.3, 8.6, 9.8, 13.3, 15.6]) { await p.evaluate((t) => seek(t), t); await p.screenshot({ path: `prev_${t}.png` }); }
  await b.close(); console.log("ok");
})();
