import { htmlToMarkdown } from './converter/htmlToMarkdown'
import { ModeEnum } from './schemas/deepwiki'

/**
 * Thin wrapper expected by the stdio CLI blueprint.
 * Converts the provided HTML string to Markdown using the default
 * conversion mode ("aggregate").
 */
export async function toMarkdown(html: string): Promise<string> {
    return htmlToMarkdown(html, ModeEnum.enum.aggregate)
}

// Keep named export to allow existing imports
export { htmlToMarkdown }