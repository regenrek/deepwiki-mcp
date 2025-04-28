import type { Options as SanitizeOptions } from 'rehype-sanitize'
import { defaultSchema } from 'hast-util-sanitize'

// Custom schema: drop img, script, style, header, footer, nav, ads
export const sanitizeSchema: SanitizeOptions = {
  ...defaultSchema,
  tagNames: (defaultSchema.tagNames ?? []).filter(
    t =>
      !['img', 'script', 'style', 'header', 'footer', 'nav'].includes(t),
  ),
  attributes: {
    ...defaultSchema.attributes,
    '*': (defaultSchema.attributes?.['*'] ?? []).filter(
      attr => !['style', 'onload', 'onclick'].includes(attr),
    ),
  },
}
