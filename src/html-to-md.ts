import { htmlToMarkdown as convert } from './converter/htmlToMarkdown.js';
import { ModeEnum } from './schemas/deepwiki.js';

export async function toMarkdown(html: string, mode: string = 'standard'): Promise<string> {
    // Validate mode
    const validMode = mode === 'aggregate' || mode === 'pages' ? mode : 'standard';

    return convert(html, validMode as typeof ModeEnum._type);
}