import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const BASE_URL = 'http://localhost:3001';
const repoScreenshotsDir = path.join(rootDir, 'docs', 'screenshots');
const artifactDir = path.resolve('C:\\Users\\PAWAR\\.gemini\\antigravity\\brain\\0b51ea66-4155-41ad-bffd-ef8e2202c0eb');

if (!fs.existsSync(repoScreenshotsDir)) {
  fs.mkdirSync(repoScreenshotsDir, { recursive: true });
}

async function capture() {
  console.log('Launching Playwright Chromium browser...');
  const browser = await chromium.launch({ headless: true });

  const pages = [
    { path: '', name: 'home' },
    { path: '/how-it-works', name: 'how-it-works' },
    { path: '/for-citizens', name: 'for-citizens' },
    { path: '/for-offices', name: 'for-offices' },
    { path: '/privacy-and-safety', name: 'privacy' },
    { path: '/faq', name: 'faq' },
    { path: '/about', name: 'about' },
    { path: '/contact', name: 'contact' },
  ];

  const langs = ['en', 'mr', 'hi'];

  const viewports = [
    { type: 'desktop', width: 1440, height: 900 },
    { type: 'mobile', width: 360, height: 740 },
  ];

  for (const vp of viewports) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();

    for (const l of langs) {
      for (const p of pages) {
        const url = `${BASE_URL}/${l}${p.path}`;
        const fileName = `${vp.type}-${p.name}-${l}.png`;
        const repoPath = path.join(repoScreenshotsDir, fileName);

        console.log(`[${vp.type}] Navigating to: ${url} ...`);
        try {
          await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
          await page.waitForTimeout(400); // Allow fonts to settle

          // If on FAQ page, expand the first accordion item for visual verification
          if (p.name === 'faq') {
            const firstAccordion = await page.$('button[id^="accordion-btn-faq-0"]');
            if (firstAccordion) {
              await firstAccordion.click();
              await page.waitForTimeout(200);
            }
          }

          await page.screenshot({ path: repoPath, fullPage: false });
          console.log(`Saved screenshot: ${fileName}`);

          if (fs.existsSync(artifactDir)) {
            const artPath = path.join(artifactDir, fileName);
            fs.copyFileSync(repoPath, artPath);
          }
        } catch (err) {
          console.error(`Error capturing ${url}:`, err.message);
        }
      }
    }

    await context.close();
  }

  // Also capture 404 page
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const p404 = await ctx.newPage();
  await p404.goto(`${BASE_URL}/non-existent-page`, { waitUntil: 'networkidle' });
  const p404File = path.join(repoScreenshotsDir, 'desktop-404-en.png');
  await p404.screenshot({ path: p404File });
  if (fs.existsSync(artifactDir)) {
    fs.copyFileSync(p404File, path.join(artifactDir, 'desktop-404-en.png'));
  }
  await ctx.close();

  await browser.close();
  console.log('\n✅ All desktop and mobile screenshots across en, mr, and hi captured successfully!');
}

capture().catch((err) => {
  console.error('Screenshot capture failed:', err);
  process.exit(1);
});
