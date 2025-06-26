import { describe, it, expect } from 'vitest'
import { toMarkdown } from '../src/html-to-md'

describe('htmlToMarkdown regression', () => {
    it('handles anchor & strong tags', async () => {
        const html = '<p>This is <strong>bold</strong> and <a href="https://example.com">link</a>.</p>'
        const md = await toMarkdown(html)
        // Ensure bold and link are preserved in output markdown
        expect(md).toContain('**bold**')
        expect(md).toContain('[link](https://example.com)')
    })
})