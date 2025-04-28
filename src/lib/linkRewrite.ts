import type { ModeEnum } from '../schemas/deepwiki'
import { fromHtml } from 'hast-util-from-html'
import { visit } from 'unist-util-visit'

interface Opts {
  mode: typeof ModeEnum._type
}

/** rehype plugin to rewrite internal links to anchors or markdown files */
export function rehypeRewriteLinks(opts: Opts) {
  return function transformer(tree: any, file: any) {
    visit(tree, 'element', (node: any) => {
      if (node.tagName !== 'a')
        return
      const href: string | undefined = node.properties?.href
      if (!href || href.startsWith('http'))
        return
      if (opts.mode === 'aggregate') {
        node.properties.href = `#${href.replace(/^\//, '')}`
      }
      else {
        node.properties.href = `${href.replace(/^\//, '')}.md`
      }
    })
  }
}
