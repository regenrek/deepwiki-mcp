import { describe, it, expect } from 'vitest';
import { render } from '../src/engine/index';
import { shutdown } from '../src/engine/lightpanda';

const TRICKY_REPOS = [
    {
        url: 'https://deepwiki.com/vercel/next.js',
        reason: 'Complex React Server Components'
    },
    {
        url: 'https://deepwiki.com/remix-run/remix',
        reason: 'Heavy client-side hydration'
    },
    {
        url: 'https://deepwiki.com/sveltejs/kit',
        reason: 'Custom build system'
    }
];

describe('Regression Tests', () => {
    afterAll(async () => {
        await shutdown();
    });

    it.each(TRICKY_REPOS)('should handle $reason - $url', async ({ url }) => {
        const html = await render(url);

        // Should get meaningful content
        expect(html).toBeTruthy();
        expect(html.length).toBeGreaterThan(1000);

        // Should not be loading state
        expect(html).not.toMatch(/Loading…|Loading\.\.\./i);

        // Should have actual content
        expect(html).toMatch(/<h[1-6]/i); // Has headers
        expect(html).toMatch(/<p|<div/i); // Has content
    }, 30000); // 30s timeout for tricky pages

    it('should fallback to Playwright when Lightpanda fails', async () => {
        // Mock a page that uses performanceObserver or other unsupported APIs
        const url = 'https://deepwiki.com/facebook/react'; // Known to use advanced features

        const html = await render(url, { heavyRetry: true });
        expect(html).toBeTruthy();
        expect(html.length).toBeGreaterThan(1000);
    });

    it('should respect heavyRetry=false option', async () => {
        const url = 'https://deepwiki.com/some/nonexistent/repo';

        await expect(
            render(url, { heavyRetry: false })
        ).rejects.toThrow();
    });
});