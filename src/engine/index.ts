import { render as lpRender } from './lightpanda'
import { renderHeavy as pwRender } from './playwright'

export interface RenderOptions {
    /** Whether to attempt a Playwright retry when Lightpanda returns empty */
    heavyRetry?: boolean
}

/**
 * Render a URL to HTML using Lightpanda. If the returned HTML appears empty or
 * contains only a generic loading screen, optionally retry with Playwright.
 */
export async function render(
    url: string,
    opts: RenderOptions = { heavyRetry: true },
): Promise<string> {
    let html = ''
    try {
        html = await lpRender(url)
    }
    catch {
        html = ''
    }

    const looksEmpty = !html || /Loading…|Loading\.{3}/i.test(html)
    if (!looksEmpty) return html

    if (!opts.heavyRetry) {
        throw new Error('Lightpanda failed and heavyRetry == false')
    }
    return pwRender(url)
}