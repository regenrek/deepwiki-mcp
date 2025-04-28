import { once } from 'node:events'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { describe, expect, it } from 'vitest'
import { htmlToMarkdown } from '../src/converter/htmlToMarkdown'
import { crawl } from '../src/lib/httpCrawler'

function serve(html: string) {
  return new Promise<{ url: string, close: () => void }>((resolve) => {
    const srv = createServer((_, res) => {
      res.setHeader('content-type', 'text/html')
      res.end(html)
    }).listen(0, () => {
      const { port } = srv.address() as any
      resolve({
        url: `http://localhost:${port}/index.html`,
        close: () => srv.close(),
      })
    })
  })
}

describe('crawl', () => {
  it('fetches one page and respects depth 0', async () => {
    const { url, close } = await serve('<h1>Hello</h1>')
    try {
      const { html } = await crawl({
        root: new URL(url),
        maxDepth: 0,
        emit: () => {},
      })
      expect(Object.keys(html)).toEqual(['/index.html'])
    }
    finally {
      close()
    }
  })

  it('crawls deepwiki.com and converts to markdown', async () => {
    const targetUrl = 'https://deepwiki.com/expressjs/express/2-core-architecture'
    const root = new URL(targetUrl)
    const path = root.pathname

    try {
      const { html, errors } = await crawl({
        root,
        maxDepth: 0,
        emit: () => {},
      })

      expect(errors).toEqual([])
      expect(Object.keys(html)).toContain(path)
      expect(html[path]).toBeTypeOf('string')
      expect(html[path]).not.toBe('')

      const markdown = await htmlToMarkdown(html[path], 'pages')

      expect(markdown).toBeTypeOf('string')
      expect(markdown.length).toBeGreaterThan(50)
      expect(markdown).toMatch(/Core Architecture/)
    }
    catch (error) {
      expect.fail(`Test threw an error: ${error}`)
    }
  }, 30000)
})
