import { z } from 'zod'

/* ---------- enums ---------- */

export const ModeEnum = z.enum(['aggregate', 'pages'])

/* ---------- request ---------- */

export const FetchRequest = z.object({
  /** Deepwiki repo URL, eg https://deepwiki.com/user/repo */
  url: z.string().describe('should be a URL, owner/repo name (e.g. "vercel/ai"), a two-word "owner repo" form (e.g. "vercel ai"), or a single library keyword'),
  /** Crawl depth limit: 0 means only the root page */
  maxDepth: z.number().int().min(0).max(1).default(1).describe('Can fetch a single site => maxDepth 0 or multiple/all sites => maxDepth 1'),
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