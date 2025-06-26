import { resolve } from 'node:path';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import puppeteer from 'puppeteer-core';

const BIN = process.env.LIGHTPANDA_PATH || resolve(__dirname, '../../bin/lightpanda');
const HOST = '127.0.0.1';
const PORT = process.env.LIGHTPANDA_PORT ? parseInt(process.env.LIGHTPANDA_PORT) : 9222;

let panda: ReturnType<typeof spawn> | null = null;
let browser: puppeteer.Browser | null = null;

export async function ensurePanda() {
    if (panda && browser) return;

    // Check if binary exists
    if (!existsSync(BIN)) {
        throw new Error(`Lightpanda binary not found at ${BIN}. Run 'npm install' to download it.`);
    }

    panda = spawn(BIN, ['serve', '--host', HOST, '--port', String(PORT)], {
        stdio: 'ignore',
        env: { ...process.env, LIGHTPANDA_DISABLE_TELEMETRY: 'true' },
    });

    // Handle process errors
    panda.on('error', (err) => {
        console.error('Lightpanda process error:', err);
        panda = null;
        browser = null;
    });

    panda.on('exit', (code) => {
        if (code !== 0) {
            console.error(`Lightpanda exited with code ${code}`);
        }
        panda = null;
        browser = null;
    });

    // minimal health-check: wait for CDP socket to open
    const wsURL = `ws://${HOST}:${PORT}`;

    // Retry connection with exponential backoff
    let retries = 0;
    const maxRetries = 10;
    while (retries < maxRetries) {
        try {
            browser = await puppeteer.connect({ browserWSEndpoint: wsURL });
            break;
        } catch (err) {
            retries++;
            if (retries >= maxRetries) throw err;
            await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, retries)));
        }
    }
}

export async function render(url: string, timeout = 15000): Promise<string> {
    await ensurePanda();

    if (!browser) {
        throw new Error('Browser connection lost');
    }

    const page = await browser.newPage();

    try {
        // abort assets that aren't needed
        await page.route('**/*.{png,jpg,jpeg,svg,webp,woff,woff2,css}', r => r.abort());

        await page.goto(url, { waitUntil: 'networkidle', timeout });
        const html = await page.content();
        return html;
    } finally {
        await page.close();
    }
}

export async function shutdown() {
    if (browser) {
        try {
            await browser.close();
        } catch (err) {
            console.error('Error closing browser:', err);
        }
        browser = null;
    }

    if (panda) {
        panda.kill('SIGTERM');
        panda = null;
    }
}