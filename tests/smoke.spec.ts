import { describe, it, expect } from 'vitest'
import { toMarkdown } from '../src/html-to-md'

describe('htmlToMarkdown smoke', () => {
    it('converts simple HTML to markdown', async () => {
        const md = await toMarkdown('<h1>Hello</h1><p>World</p>')
        expect(md).toContain('# Hello')
        expect(md).toContain('World')
    })
})