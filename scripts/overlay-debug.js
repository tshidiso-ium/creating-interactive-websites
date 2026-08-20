const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE CONSOLE:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  await page.goto('http://localhost:5174/', { waitUntil: 'networkidle' });
  // wait a short time for overlay to appear
  await page.waitForTimeout(500);
  const overlay = await page.evaluate(() => {
    const o = document.querySelector('vite-error-overlay') || document.querySelector('.vite-error') || document.querySelector('.overlay')
    return o ? o.outerHTML : null
  })
  console.log('Overlay HTML:', overlay)
  await browser.close();
})()
