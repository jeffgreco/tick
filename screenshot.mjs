import puppeteer from 'puppeteer';

const url = process.argv[2] || 'http://localhost:3000';
const faceIndex = parseInt(process.argv[3] || '0', 10);
const out = process.argv[4] || '/tmp/tick-screenshot.png';

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 480, height: 480, deviceScaleFactor: 2 });
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });

  // Wait for font load + first render
  await page.waitForFunction(() => document.fonts.ready, { timeout: 8000 });
  await new Promise(r => setTimeout(r, 1500));

  // Navigate to desired face
  for (let i = 0; i < faceIndex; i++) {
    await page.evaluate(() => window.tick.nextFace());
    await new Promise(r => setTimeout(r, 600));
  }
  await new Promise(r => setTimeout(r, 1000));

  await page.screenshot({ path: out, type: 'png' });
  console.log(`Screenshot saved to ${out}`);
  await browser.close();
})();
