import type { ModeEnum } from '../schemas/deepwiki'
import { parseHTML } from 'linkedom'
import rehypeParse from 'rehype-parse'
import rehypeRemark from 'rehype-remark'
import rehypeSanitize from 'rehype-sanitize'
import remarkGfm from 'remark-gfm'
import remarkStringify from 'remark-stringify'
import { unified } from 'unified'
import { rehypeRewriteLinks } from '../lib/linkRewrite'
import { sanitizeSchema } from '../lib/sanitizeSchema'

export async function htmlToMarkdown(
  html: string,
  mode: typeof ModeEnum._type,
): Promise<string> {
  // Ensure a DOM is available for rehype-parse with LinkeDOM
  const { document } = parseHTML('<!doctype html>')
  globalThis.document = document

  const file = await unified()
    .use(rehypeParse, { fragment: true })
    .use(rehypeSanitize, sanitizeSchema)
    .use(rehypeRewriteLinks, { mode })
    .use(rehypeRemark)
    .use(remarkGfm)
    .use(remarkStringify, { fences: true, bullet: '-', rule: '-' })
    .process(html)

  return String(file)
}
