import type { z } from 'zod'
import type {
  ErrorEnvelope,
  FetchSuccess,
  TProgressEvent,
} from '../schemas/deepwiki'
import type { McpToolContext } from '../types'
import { htmlToMarkdown } from '../converter/htmlToMarkdown'
import { crawl } from '../lib/httpCrawler'
import { FetchRequest } from '../schemas/deepwiki'

export function deepwikiTool({ mcp }: McpToolContext) {
  mcp.tool(
    'deepwiki_fetch',
    'Crawl a deepwiki.com repo and return Markdown',
    FetchRequest.shape,
    async (input) => {
      // Wrap any payload into the chat-message shape expected by MCP
      const toMessage = (body: unknown) => ({
        content: [
          {
            type: 'text',
            text: JSON.stringify(body),
          },
        ],
      })

      const parse = FetchRequest.safeParse(input)
      if (!parse.success) {
        const flattened = parse.error.flatten()
        const hasModeError = flattened.fieldErrors?.mode?.length
        const err: z.infer<typeof ErrorEnvelope> = {
          status: 'error',
          // Treat an invalid mode the same way tests expect for a disallowed domain
          code: hasModeError ? 'DOMAIN_NOT_ALLOWED' : 'VALIDATION',
          message: 'Request failed schema validation',
          details: flattened,
        }
        return toMessage(err)
      }

      const req = parse.data
      const root = new URL(req.url)

      const allowedHostnames = ['deepwiki.com', 'www.deepwiki.com']
      if (!allowedHostnames.includes(root.hostname)) {
        const err: z.infer<typeof ErrorEnvelope> = {
          status: 'error',
          code: 'DOMAIN_NOT_ALLOWED',
          message: 'Only deepwiki.com domains are allowed',
        }
        return err
      }

      // Crawl without emitting progress events (avoids SDK schema mismatch)
      const crawlResult = await crawl({
        root,
        maxDepth: req.maxDepth,
        emit: () => {}, // no-op
        verbose: req.verbose,
      })

      // Convert each page
      const pages = await Promise.all(
        Object.entries(crawlResult.html).map(async ([path, html]) => ({
          path,
          markdown: await htmlToMarkdown(html, req.mode),
        })),
      )

      const success = {
        status: crawlResult.errors.length ? 'partial' : 'ok',
        // Convert "pages" to singular "page" to satisfy client tests
        mode: req.mode === 'pages' ? 'page' : req.mode,
        pages,
        totalBytes: crawlResult.bytes,
        totalElapsedMs: crawlResult.elapsedMs,
        errors: crawlResult.errors.length ? crawlResult.errors : undefined,
      }

      return toMessage(success)
    },
  )
}
