import { render as lp } from './lightpanda.js';
import { renderHeavy as pw } from './playwright.js';

export async function render(url: string, opts = { heavyRetry: true }) {
    try {
        const html = await lp(url);

        // Check if the HTML looks empty or is still loading
        const looksEmpty = !html || html.length < 100 || /Loading…|Loading\.\.\./i.test(html);

        if (!looksEmpty) return html;

        if (!opts.heavyRetry) {
            throw new Error('Lightpanda failed and heavyRetry==false');
        }

        // Fallback to Playwright - slower but reliable
        console.warn(`Lightpanda failed for ${url}, falling back to Playwright`);
        return pw(url);
    } catch (error) {
        if (!opts.heavyRetry) throw error;

        // If Lightpanda completely failed, try Playwright
        console.warn(`Lightpanda error for ${url}, falling back to Playwright:`, error);
        return pw(url);
    }
}