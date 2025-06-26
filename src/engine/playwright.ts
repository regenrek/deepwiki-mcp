import { chromium } from 'playwright-core';

export async function renderHeavy(url: string): Promise<string> {
    // user may supply a pre-installed chrome build via env
    const browser = await chromium.launch({
        headless: true,
        executablePath: process.env.CHROMIUM_PATH,
        args: ['--disable-gpu', '--no-sandbox'],
    });

    const page = await browser.newPage();
    await page.route('**/*.{png,jpg,jpeg,svg,webp,woff,woff2}', r => r.abort());
    await page.goto(url, { waitUntil: 'networkidle' });
    const html = await page.content();
    await browser.close();
    return html;
}