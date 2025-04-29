import type { McpToolContext } from '../types'
import { z } from 'zod'
import { htmlToMarkdown } from '../converter/htmlToMarkdown'
import { crawl } from '../lib/httpCrawler'
import { FetchRequest } from '../schemas/deepwiki'

/* ------------------------------------------------------------------ */
/*  Schema                                   */
/* ------------------------------------------------------------------ */

const SearchRequest = FetchRequest.extend({
  /** Case-insensitive literal search term */
  query: z.string().min(1, 'query cannot be empty'),
  /** Hard cap on number of snippets to return (default 10) */
  maxMatches: z.number().int().positive().max(100).default(10),
})

/* ------------------------------------------------------------------ */
/*  Tool registration                                                 */
/* ------------------------------------------------------------------ */

export function deepwikiSearchTool({ mcp }: McpToolContext) {
  mcp.tool(
    'deepwiki_search',
    `Download pages from a deepwiki.com, look for a case-insensitive
substring, and return up to maxMatches short snippets with the match
wrapped in **bold**.

Required:
  • url      – root Deepwiki repo
  • query    – plain text (literal string)

Optional:
  • maxDepth – crawl depth (default 1, like deepwiki.fetch)
  • maxMatches – limit on snippets (default 10)
  • mode     – "aggregate" | "pages" (affects link rewriting only)
  • verbose  – log progress to stderr`,
    SearchRequest.shape,
    async (raw) => {
      /* Helper to wrap everything into the MCP chat-message envelope */
      const toMsg = (body: unknown) => ({
        content: [{ type: 'text', text: JSON.stringify(body) }],
      })

      /* ---------- validate input ---------- */
      const parsed = SearchRequest.safeParse(raw)
      if (!parsed.success) {
        return toMsg({
          status: 'error',
          code: 'VALIDATION',
          details: parsed.error.flatten(),
        })
      }

      const req = parsed.data
      const root = new URL(req.url)

      /* ---------- crawl ---------- */
      const { html } = await crawl({
        root,
        maxDepth: req.maxDepth,
        emit: () => {},
        verbose: req.verbose,
      })

      /* ---------- build regex ---------- */
      const safe = req.query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const re = new RegExp(safe, 'i')
      const matches: { path: string, snippet: string }[] = []

      /* ---------- convert + search ---------- */
      for (const [path, sourceHtml] of Object.entries(html)) {
        if (matches.length >= req.maxMatches)
          break

        const md = await htmlToMarkdown(sourceHtml, req.mode)
        let m: RegExpExecArray | null
        while ((m = re.exec(md)) !== null) {
          const start = Math.max(0, m.index - 80)
          const end = Math.min(md.length, m.index + m[0].length + 80)
          const rawSnippet = md.slice(start, end)
          const snippet = rawSnippet.replace(re, s => `**${s}**`)
          matches.push({ path, snippet })
          if (matches.length >= req.maxMatches)
            break
        }
      }

      /* ---------- reply ---------- */
      return toMsg({
        status: 'ok',
        query: req.query,
        matches,
        totalSearchedPages: Object.keys(html).length,
      })
    },
  )
}
