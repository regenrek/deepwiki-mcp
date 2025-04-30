import { fetch } from 'undici'

/**
 * Resolve a single-word keyword (library or project name) to "owner/repo"
 * by querying the GitHub Search API and returning the top match.
 *
 * @param keyword The library or project name to search for.
 * @throws If the GitHub request fails or no repository matches.
 */
export async function resolveRepo(keyword: string): Promise<string> {
  const url =
    `https://api.github.com/search/repositories?q=${encodeURIComponent(
      `${keyword} in:name`,
    )}&per_page=1`

  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
  }

  // Optional authentication to lift the unauthenticated rate limit (10 req/min)
  if (process.env.GITHUB_TOKEN)
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`

  const res = await fetch(url, { headers })
  if (!res.ok)
    throw new Error(`GitHub error: ${res.status}`)

  const { items } = (await res.json()) as {
    items: { full_name: string }[]
  }

  if (!items?.length)
    throw new Error('no match')

  // "full_name" is "owner/repo"
  return items[0].full_name
}