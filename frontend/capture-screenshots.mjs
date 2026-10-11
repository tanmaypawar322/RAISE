import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const APP_URL = 'http://localhost:3000';
const MARKETING_URL = 'http://localhost:3001';

const repoDir = path.resolve('..', 'docs', 'screenshots', 'auth');
const artifactDir = path.resolve('C:\\Users\\PAWAR\\.gemini\\antigravity\\brain\\0b51ea66-4155-41ad-bffd-ef8e2202c0eb');

if (!fs.existsSync(repoDir)) {
  fs.mkdirSync(repoDir, { recursive: true });
}

async function capture() {
  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });

  const tasks = [
    // Desktop 1366x768
    { route: '/sign-in', lang: 'en', viewport: { width: 1366, height: 768 }, name: 'desktop-sign-in-en' },
    { route: '/sign-in', lang: 'mr', viewport: { width: 1366, height: 768 }, name: 'desktop-sign-in-mr' },
    { route: '/sign-in', lang: 'hi', viewport: { width: 1366, height: 768 }, name: 'desktop-sign-in-hi' },

    { route: '/sign-up', lang: 'en', viewport: { width: 1366, height: 768 }, name: 'desktop-sign-up-en' },
    { route: '/sign-up', lang: 'mr', viewport: { width: 1366, height: 768 }, name: 'desktop-sign-up-mr' },
    { route: '/sign-up', lang: 'hi', viewport: { width: 1366, height: 768 }, name: 'desktop-sign-up-hi' },

    { route: '/onboarding', lang: 'en', viewport: { width: 1366, height: 768 }, name: 'desktop-onboarding-en' },

    { route: '/office/sign-in', lang: 'en', viewport: { width: 1366, height: 768 }, name: 'desktop-office-signin-en' },
    { route: '/office/sign-in', lang: 'mr', viewport: { width: 1366, height: 768 }, name: 'desktop-office-signin-mr' },
    { route: '/office/sign-in', lang: 'hi', viewport: { width: 1366, height: 768 }, name: 'desktop-office-signin-hi' },

    { route: '/office/request-access', lang: 'en', viewport: { width: 1366, height: 768 }, name: 'desktop-office-request-access-en' },
    { route: '/office/request-status', lang: 'en', viewport: { width: 1366, height: 768 }, name: 'desktop-office-request-status-en' },
    { route: '/unauthorized', lang: 'en', viewport: { width: 1366, height: 768 }, name: 'desktop-unauthorized-en' },

    // Mobile 360x740
    { route: '/sign-in', lang: 'en', viewport: { width: 360, height: 740 }, name: 'mobile-sign-in-en' },
    { route: '/sign-in', lang: 'mr', viewport: { width: 360, height: 740 }, name: 'mobile-sign-in-mr' },
    { route: '/sign-in', lang: 'hi', viewport: { width: 360, height: 740 }, name: 'mobile-sign-in-hi' },

    { route: '/sign-up', lang: 'en', viewport: { width: 360, height: 740 }, name: 'mobile-sign-up-en' },
    { route: '/onboarding', lang: 'en', viewport: { width: 360, height: 740 }, name: 'mobile-onboarding-en' },
    { route: '/office/sign-in', lang: 'en', viewport: { width: 360, height: 740 }, name: 'mobile-office-signin-en' },
    { route: '/office/request-access', lang: 'en', viewport: { width: 360, height: 740 }, name: 'mobile-office-request-access-en' },

    // Marketing Page Desktop
    { url: MARKETING_URL, viewport: { width: 1366, height: 768 }, name: 'desktop-marketing-en' },
  ];

  for (const t of tasks) {
    const context = await browser.newContext({
      viewport: t.viewport,
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();

    const targetUrl = t.url || `${APP_URL}${t.route}`;
    console.log(`Navigating to ${targetUrl} [${t.name}]...`);

    if (t.lang) {
      // Set localStorage before loading
      await page.addInitScript((lang) => {
        window.localStorage.setItem('raise_lang', lang);
      }, t.lang);
    }

    await page.goto(targetUrl, { waitUntil: 'networkidle' });
    // Brief pause for fonts and animations to settle
    await page.waitForTimeout(500);

    const repoPath = path.join(repoDir, `${t.name}.png`);
    await page.screenshot({ path: repoPath, fullPage: false });
    console.log(`Saved screenshot: ${repoPath}`);

    if (fs.existsSync(artifactDir)) {
      const artPath = path.join(artifactDir, `${t.name}.png`);
      fs.copyFileSync(repoPath, artPath);
    }

    await context.close();
  }

  await browser.close();
  console.log('All screenshots captured successfully!');
}

capture().catch((err) => {
  console.error('Screenshot capture failed:', err);
  process.exit(1);
});
