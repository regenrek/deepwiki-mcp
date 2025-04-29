import type { ProgressEvent } from '../schemas/deepwiki'
import { Buffer } from 'node:buffer'
import { performance } from 'node:perf_hooks'
import { setTimeout } from 'node:timers/promises'
import { URL } from 'node:url'
import PQueue from 'p-queue'
import robotsParser from 'robots-parser'
import { Agent, fetch } from 'undici'

const MAX_CONCURRENCY = Number(process.env.DEEPWIKI_CONCURRENCY ?? 5)
const RETRY_LIMIT = 3
const BACKOFF_BASE_MS = 250

export interface CrawlOptions {
  root: URL
  maxDepth: number
  emit: (e: ProgressEvent) => void
  verbose?: boolean
}

export interface CrawlResult {
  html: Record<string, string> // key = path
  errors: { path: string, reason: string }[]
  bytes: number
  elapsedMs: number
}

/**
 * Breadth-first crawler with depth limiting, domain whitelist,
 * robots.txt respect, request throttling and retries.
 */
export async function crawl(options: CrawlOptions): Promise<CrawlResult> {
  const { root, maxDepth, emit, verbose } = options
  const queue = new PQueue({ concurrency: MAX_CONCURRENCY })
  const agent = new Agent({ keepAliveTimeout: 5_000 })
  const crawled = new Set<string>()
  const html: Record<string, string> = {}
  const errors: { path: string, reason: string }[] = []
  let totalBytes = 0
  const t0 = performance.now()

  // Pre-fetch robots.txt and build allowlist
  const robotsUrl = new URL('/robots.txt', root)
  let robots: ReturnType<typeof robotsParser> | undefined
  try {
    const res = await fetch(robotsUrl)
    const body = await res.text()
    robots = robotsParser(robotsUrl.href, body)
  }
  catch {
    robots = undefined
  }

  async function enqueue(url: URL, depth: number) {
    // Skip non-HTML file extensions
    const nonHtmlExt = [
      '.css',
      '.js',
      '.mjs',
      '.json',
      '.png',
      '.jpg',
      '.jpeg',
      '.gif',
      '.svg',
      '.webp',
      '.ico',
      '.woff',
      '.woff2',
      '.ttf',
      '.eot',
      '.otf',
      '.pdf',
      '.zip',
      '.tar',
      '.gz',
      '.mp4',
      '.mp3',
      '.avi',
      '.mov',
      '.wmv',
      '.flv',
      '.m4a',
      '.ogg',
      '.wav',
      '.bmp',
      '.tiff',
      '.psd',
      '.exe',
      '.dmg',
      '.apk',
      '.bin',
      '.7z',
      '.rar',
      '.xml',
      '.rss',
      '.atom',
      '.map',
      '.txt',
      '.csv',
      '.md',
      '.yml',
      '.yaml',
      '.log',
      '.rtf',
      '.doc',
      '.docx',
      '.ppt',
      '.pptx',
      '.xls',
      '.xlsx',
      '.db',
      '.sqlite',
      '.bak',
      '.swf',
      '.dat',
      '.bak',
      '.bak1',
      '.bak2',
      '.bak3',
      '.bak4',
      '.bak5',
      '.bak6',
      '.bak7',
      '.bak8',
      '.bak9',
      '.bak10',
      '.bak11',
      '.bak12',
      '.bak13',
      '.bak14',
      '.bak15',
      '.bak16',
      '.bak17',
      '.bak18',
      '.bak19',
      '.bak20',
      '.bak21',
      '.bak22',
      '.bak23',
      '.bak24',
      '.bak25',
      '.bak26',
      '.bak27',
      '.bak28',
      '.bak29',
      '.bak30',
      '.bak31',
      '.bak32',
      '.bak33',
      '.bak34',
      '.bak35',
      '.bak36',
      '.bak37',
      '.bak38',
      '.bak39',
      '.bak40',
      '.bak41',
      '.bak42',
      '.bak43',
      '.bak44',
      '.bak45',
      '.bak46',
      '.bak47',
      '.bak48',
      '.bak49',
      '.bak50',
      '.bak51',
      '.bak52',
      '.bak53',
      '.bak54',
      '.bak55',
      '.bak56',
      '.bak57',
      '.bak58',
      '.bak59',
      '.bak60',
      '.bak61',
      '.bak62',
      '.bak63',
      '.bak64',
      '.bak65',
      '.bak66',
      '.bak67',
      '.bak68',
      '.bak69',
      '.bak70',
      '.bak71',
      '.bak72',
      '.bak73',
      '.bak74',
      '.bak75',
      '.bak76',
      '.bak77',
      '.bak78',
      '.bak79',
      '.bak80',
      '.bak81',
      '.bak82',
      '.bak83',
      '.bak84',
      '.bak85',
      '.bak86',
      '.bak87',
      '.bak88',
      '.bak89',
      '.bak90',
      '.bak91',
      '.bak92',
      '.bak93',
      '.bak94',
      '.bak95',
      '.bak96',
      '.bak97',
      '.bak98',
      '.bak99',
      '.bak100',
    ]
    const lowerPath = url.pathname.toLowerCase()
    if (nonHtmlExt.some(ext => lowerPath.endsWith(ext))) {
      return
    }
    if (depth > maxDepth)
      return
    if (url.hostname !== root.hostname || url.pathname === '/robots.txt')
      return
    const key = url.pathname
    if (crawled.has(key))
      return
    if (robots && !robots.isAllowed(url.href, '*'))
      return
    crawled.add(key)

    queue.add(async () => {
      const start = performance.now()
      let retries = 0
      while (true) {
        try {
          const res = await fetch(url, { dispatcher: agent })
          // Check Content-Type header for HTML
          const contentType = res.headers.get('content-type') || ''
          if (!contentType.includes('text/html')) {
            return
          }
          const buf = await res.arrayBuffer()
          const bytes = buf.byteLength
          totalBytes += bytes
          const htmlStr = Buffer.from(buf).toString('utf8')
          html[key] = htmlStr

          const elapsedMs = Math.round(performance.now() - start)
          emit({
            type: 'progress',
            url: url.href,
            bytes,
            elapsedMs,
            fetched: Object.keys(html).length,
            queued: queue.size + queue.pending,
            retries,
          } as any)

          // naïve link extraction via regex, replaced by DOM parse later
          const linkRe
            = /href="([^"#]+)(?:#[^"#]*)?"/gi
          let match: RegExpExecArray | null
          while (true) {
            match = linkRe.exec(htmlStr)
            if (!match)
              break
            try {
              const child = new URL(match[1], url)
              await enqueue(child, depth + 1)
            }
            catch {}
          }
          return
        }
        catch (err: any) {
          if (retries < RETRY_LIMIT) {
            retries++
            await setTimeout(BACKOFF_BASE_MS * 2 ** (retries - 1))
            continue
          }
          errors.push({ path: key, reason: String(err) })
          return
        }
      }
    })
  }

  await enqueue(new URL(root.href), 0)
  await queue.onIdle()

  const elapsedMs = Math.round(performance.now() - t0)
  if (verbose) {
    console.error(
      `Crawl finished: ${Object.keys(html).length} ok, ${errors.length} failed, ${totalBytes} B, ${elapsedMs} ms`,
    )
  }
  return { html, errors, bytes: totalBytes, elapsedMs }
}
