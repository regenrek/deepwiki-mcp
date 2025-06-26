import { resolve } from 'node:path'
import { spawn, type ChildProcess } from 'node:child_process'
import puppeteer, { type Browser } from 'puppeteer-core'

// Resolve binary location. Allow env override.
const BIN = process.env.LIGHTPANDA_PATH
    ? resolve(process.env.LIGHTPANDA_PATH)
    : resolve(__dirname, '../../bin/lightpanda')

const HOST = '127.0.0.1'
const PORT = 9222

let panda: ChildProcess | null = null
let browser: Browser | null = null

/* ------------------------------------------------------------------ */
/*  Helpers                                                          */
/* ------------------------------------------------------------------ */

async function waitForWebSocket(endpoint: string, timeoutMs = 8000) {
    const started = Date.now()
    // Attempt to connect until success or timeout
    while (Date.now() - started < timeoutMs) {
        try {
            const b = await puppeteer.connect({ browserWSEndpoint: endpoint })
            return b
        }
        catch {
            // Sleep 200ms then retry
            await new Promise(r => setTimeout(r, 200))
            continue
        }
    }
    throw new Error('Timed out waiting for Lightpanda CDP socket')
}

/* ------------------------------------------------------------------ */
/*  Public API                                                       */
/* ------------------------------------------------------------------ */

export async function ensurePanda(): Promise<void> {
    if (panda && browser) return

    panda = spawn(BIN, ['serve', '--host', HOST, '--port', String(PORT)], {
        stdio: 'ignore',
        env: {
            ...process.env,
            LIGHTPANDA_DISABLE_TELEMETRY: 'true',
        },
    })

    const wsURL = `ws://${HOST}:${PORT}`
    browser = await waitForWebSocket(wsURL)
}

export async function render(url: string, timeout = 15000): Promise<string> {
    await ensurePanda()
    if (!browser) throw new Error('Lightpanda browser not available')
    const page = await browser.newPage()

    // Abort images and fonts etc.
    await page.route('**/*.{png,jpg,jpeg,svg,webp,woff,woff2}', r => r.abort())

    await page.goto(url, { waitUntil: 'networkidle', timeout })
    const html = await page.content()
    await page.close()
    return html
}

export async function shutdown(): Promise<void> {
    await browser?.close()
    panda?.kill('SIGTERM')
    browser = null
    panda = null
}