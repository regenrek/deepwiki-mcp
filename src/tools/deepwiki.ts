import type { z } from 'zod'
import type {
  ErrorEnvelope,
  FetchSuccess,
  TProgressEvent,
} from '../schemas/deepwiki'
import type { McpToolContext } from '../types'
import { htmlToMarkdown } from '../converter/htmlToMarkdown'
import { resolveRepo } from '../utils/resolveRepoFetch'
import { extractKeyword } from '../utils/extractKeyword'
import { crawl } from '../lib/httpCrawler'
import { FetchRequest } from '../schemas/deepwiki'

export function deepwikiTool({ mcp }: McpToolContext) {
  mcp.tool(
    'deepwiki_fetch',
    'Fetch a deepwiki.com repo and return Markdown',
    FetchRequest.shape,
    async (input) => {
      // Normalize the URL to support short forms
      const normalizedInput = { ...input }
      if (typeof normalizedInput.url === 'string') {
        let url = normalizedInput.url.trim()

        // Only transform when it is not already an explicit HTTP(S) URL
        if (!/^https?:\/\//.test(url)) {
          // Check if the URL is already in the owner/repo format
          if (/^[^/]+\/[^/]+$/.test(url)) {
            // Already in owner/repo format, keep it as is
            // Just prefix with deepwiki.com
          }
          // Single word/term with no slash - process differently
          else if (/^[^/]+$/.test(url)) {
            // For single words, first try to extract a meaningful keyword if the input has spaces
            if (url.includes(' ')) {
              const extracted = extractKeyword(url)
              if (extracted) {
                url = extracted
              }
            }

            // Try to resolve the single term against GitHub
            try {
              const repo = await resolveRepo(url) // "owner/repo"
              url = repo
            }
            catch {
              // Fallback to previous behaviour for backward compatibility
              url = `defaultuser/${url}` // TODO: replace defaultuser logic
            }
          }
          // Other formats (phrases with slashes that don't match owner/repo)
          else {
            // Try to extract a library keyword from a free form phrase
            const extracted = extractKeyword(url)
            if (extracted) {
              // Resolve the extracted keyword
              try {
                const repo = await resolveRepo(extracted)
                url = repo
              } catch {
                url = `defaultuser/${extracted}`
              }
            }
          }

          // At this point url should be "owner/repo"
          url = `https://deepwiki.com/${url}`
        }

        normalizedInput.url = url
      }
      const parse = FetchRequest.safeParse(normalizedInput)
      if (!parse.success) {
        const err: z.infer<typeof ErrorEnvelope> = {
          status: 'error',
          code: 'VALIDATION',
          message: 'Request failed schema validation',
          details: parse.error.flatten(),
        }
        return err
      }

      const req = parse.data
      const root = new URL(req.url)

      if (req.maxDepth > 1) {
        const err: z.infer<typeof ErrorEnvelope> = {
          status: 'error',
          code: 'VALIDATION',
          message: 'maxDepth > 1 is not allowed',
        }
        return err
      }

      if (root.hostname !== 'deepwiki.com') {
        const err: z.infer<typeof ErrorEnvelope> = {
          status: 'error',
          code: 'DOMAIN_NOT_ALLOWED',
          message: 'Only deepwiki.com domains are allowed',
        }
        return err
      }

      // Progress emitter
      function emitProgress(e: any) {
        // Progress reporting is not supported in this context because McpServer does not have a sendEvent method.
      }

      const crawlResult = await crawl({
        root,
        maxDepth: req.maxDepth,
        emit: emitProgress,
        verbose: req.verbose,
      })

      // Convert each page
      const pages = await Promise.all(
        Object.entries(crawlResult.html).map(async ([path, html]) => ({
          path,
          markdown: await htmlToMarkdown(html, req.mode),
        })),
      )

      return {
        content: pages.map(page => ({
          type: 'text',
          text: `# ${page.path}\n\n${page.markdown}`,
        })),
      }
    },
  )
}