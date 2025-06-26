import { describe, it, expect } from 'vitest';
import { render } from '../src/engine/index';
import { toMarkdown } from '../src/html-to-md';

const TEST_REPOS = [
    'https://deepwiki.com/vercel/ai',
    'https://deepwiki.com/facebook/react',
    'https://deepwiki.com/microsoft/typescript',
    'https://deepwiki.com/vuejs/vue',
    'https://deepwiki.com/angular/angular',
    'https://deepwiki.com/nodejs/node',
    'https://deepwiki.com/webpack/webpack',
    'https://deepwiki.com/babel/babel',
    'https://deepwiki.com/expressjs/express',
    'https://deepwiki.com/nestjs/nest'
];

describe('Smoke Tests', () => {
    it.each(TEST_REPOS)('should render %s in under 2 seconds', async (url) => {
        const start = Date.now();
        const html = await render(url);
        const elapsed = Date.now() - start;

        expect(html).toBeTruthy();
        expect(html.length).toBeGreaterThan(100);
        expect(elapsed).toBeLessThan(2000);
    }, 10000); // 10s timeout per test

    it('should convert HTML to markdown', async () => {
        const url = TEST_REPOS[0];
        const html = await render(url);
        const markdown = await toMarkdown(html);

        expect(markdown).toBeTruthy();
        expect(markdown).toContain('#'); // Should have headers
        expect(markdown.length).toBeGreaterThan(50);
    });
});