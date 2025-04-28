import { z } from 'zod'

/* ---------- enums ---------- */

export const ModeEnum = z.enum(['aggregate', 'pages'])

/* ---------- request ---------- */

export const FetchRequest = z.object({
  /**
   * Deepwiki repo URL, eg https://deepwiki.com/user/repo
   *
   * Accepts shorthands like "user/repo" or variants such as
   * "www.deepwiki.com/…" and adds/normalises them to
   * "https://deepwiki.com/…".
   */
  url: z.preprocess((raw) => {
    if (typeof raw !== 'string')
      return raw

    let str = raw.trim()

    // Shorthand "user/repo"
    const repoPattern = /^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/
    if (repoPattern.test(str))
      str = `https://deepwiki.com/${str}`

    // www → bare domain, keep https
    if (str.startsWith('http://www.deepwiki.com'))
      str = str.replace('http://www.deepwiki.com', 'https://deepwiki.com')
    else if (str.startsWith('https://www.deepwiki.com'))
      str = str.replace('https://www.deepwiki.com', 'https://deepwiki.com')
    else if (str.startsWith('www.deepwiki.com'))
      str = `https://${str.replace(/^www\./, '')}`

    // Missing protocol but starts with deepwiki.com
    if (!str.startsWith('http') && str.startsWith('deepwiki.com'))
      str = `https://${str}`

    return str
  }, z.string().url()),
  /** Crawl depth limit: 0 means only the root page */
  maxDepth: z.number().int().min(0).default(1),
  /** Conversion mode */
  mode: ModeEnum.default('aggregate'),
  /** Verbose logging flag */
  verbose: z.boolean().default(false),
})

/* ---------- progress event ---------- */

export const ProgressEvent = z.object({
  type: z.literal('progress'),
  url: z.string(),
  bytes: z.number().int().nonnegative(),
  elapsedMs: z.number().int().nonnegative(),
  fetched: z.number().int().nonnegative(),
  queued: z.number().int().nonnegative(),
  retries: z.number().int().nonnegative(),
})

/* ---------- success / error envelopes ---------- */

export const PageObject = z.object({
  path: z.string(),
  markdown: z.string(),
})

export const FetchSuccess = z.object({
  status: z.enum(['ok', 'partial']),
  mode: ModeEnum,
  pages: z.array(PageObject),
  totalBytes: z.number().int().nonnegative(),
  totalElapsedMs: z.number().int().nonnegative(),
  errors: z
    .array(
      z.object({
        path: z.string(),
        reason: z.string(),
      }),
    )
    .optional(),
})

export const ErrorEnvelope = z.object({
  status: z.literal('error'),
  code: z.enum([
    'VALIDATION',
    'DOMAIN_NOT_ALLOWED',
    'FETCH_FAIL',
  ]),
  message: z.string(),
  details: z.unknown().optional(),
})

export type TFetchRequest = z.infer<typeof FetchRequest>
export type TProgressEvent = z.infer<typeof ProgressEvent>
export type TFetchSuccess = z.infer<typeof FetchSuccess>
export type TErrorEnvelope = z.infer<typeof ErrorEnvelope>