import { once } from 'node:events'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { join } from 'node:path'
import { beforeAll, describe, expect, it } from 'vitest'
import { htmlToMarkdown } from '../src/converter/htmlToMarkdown'
import { crawl } from '../src/lib/httpCrawler'

const OUTPUT_DIR = join(__dirname, 'output')
const TARGET_URL = 'https://deepwiki.com/regenrek/codefetch'
const ROOT_URL = new URL(TARGET_URL)
const ROOT_PATH = ROOT_URL.pathname

function saveMarkdown(filename: string, content: string) {
  writeFileSync(join(OUTPUT_DIR, filename), content)
}

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
  beforeAll(() => {
    mkdirSync(OUTPUT_DIR, { recursive: true })
  })

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

  it('crawls deepwiki.com (pages mode) and converts to markdown', async () => {
    try {
      const { html, errors } = await crawl({
        root: ROOT_URL,
        maxDepth: 0,
        emit: () => {},
      })

      expect(errors).toEqual([])
      expect(Object.keys(html)).toContain(ROOT_PATH)
      expect(html[ROOT_PATH]).toBeTypeOf('string')
      expect(html[ROOT_PATH]).not.toBe('')

      const markdown = await htmlToMarkdown(html[ROOT_PATH], 'pages')
      expect(markdown).toBeTypeOf('string')
      expect(markdown.length).toBeGreaterThan(50)
      saveMarkdown('crawl-pages.result.md', markdown)
    }
    catch (error) {
      expect.fail(`Test threw an error: ${error}`)
    }
  }, 30000)

  it('crawls deepwiki.com (aggregate mode) and converts to markdown', async () => {
    try {
      const { html, errors } = await crawl({
        root: ROOT_URL,
        maxDepth: 0,
        emit: () => {},
      })

      expect(errors).toEqual([])
      expect(Object.keys(html)).toContain(ROOT_PATH)
      expect(html[ROOT_PATH]).toBeTypeOf('string')
      expect(html[ROOT_PATH]).not.toBe('')

      const markdown = await htmlToMarkdown(html[ROOT_PATH], 'aggregate')
      expect(markdown).toBeTypeOf('string')
      expect(markdown.length).toBeGreaterThan(50)
      saveMarkdown('crawl-aggregate.result.md', markdown)
    }
    catch (error) {
      expect.fail(`Test threw an error: ${error}`)
    }
  }, 30000)
})

describe('crawl depth', () => {
  beforeAll(() => {
    mkdirSync(OUTPUT_DIR, { recursive: true })
  })

  // it.each([0, 1, 2])('crawls deepwiki.com with maxDepth %i', async (maxDepth) => {
  //   try {
  //     const { html, errors } = await crawl({
  //       root: ROOT_URL,
  //       maxDepth,
  //       emit: () => {},
  //     })

  //     expect(errors).toEqual([])
  //     expect(Object.keys(html).length).toBeGreaterThan(0)
  //     expect(html).toHaveProperty(ROOT_PATH)
  //     expect(html[ROOT_PATH]).toBeTypeOf('string')

  //     const markdown = await htmlToMarkdown(html[ROOT_PATH], 'pages')
  //     expect(markdown).toBeTypeOf('string')
  //     saveMarkdown(`crawl-depth-${maxDepth}.result.md`, markdown)
  //   }
  //   catch (error) {
  //     expect.fail(`Test (depth ${maxDepth}) threw an error: ${error}`)
  //   }
  // }, 30000 * 5)
  it.each([0, 1, 2])('crawls deepwiki.com with maxDepth %i', async (maxDepth) => {
    try {
      const { html, errors } = await crawl({
        root: ROOT_URL,
        maxDepth,
        emit: () => {},
      })

      expect(errors).toEqual([])
      expect(Object.keys(html).length).toBeGreaterThan(0)
      // expect(html).toHaveProperty(ROOT_PATH)
      expect(html).toBeTypeOf('string')

      const markdown = await htmlToMarkdown(html, 'pages')
      expect(markdown).toBeTypeOf('string')
      saveMarkdown(`crawl-depth-${maxDepth}.result.md`, markdown)
    }
    catch (error) {
      expect.fail(`Test (depth ${maxDepth}) threw an error: ${error}`)
    }
  }, 30000 * 5)
})
