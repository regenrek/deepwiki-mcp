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
