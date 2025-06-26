import { chromium, type Browser } from 'playwright-core'

/**
 * Render a page using Playwright (Chromium) and return its HTML.
 *
 * The function launches a headless Chromium instance. The executable can be
 * overridden by providing an absolute path via the CHROMIUM_PATH environment
 * variable. The browser is closed before returning.
 */
export async function renderHeavy(url: string): Promise<string> {
    const browser: Browser = await chromium.launch({
        headless: true,
        executablePath: process.env.CHROMIUM_PATH,
        args: ['--disable-gpu', '--no-sandbox'],
    })

    const page = await browser.newPage()
    await page.route('**/*.{png,jpg,jpeg,svg,webp,woff,woff2}', r => r.abort())
    await page.goto(url, { waitUntil: 'networkidle' })
    const html = await page.content()
    await browser.close()
    return html
}