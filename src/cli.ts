#!/usr/bin/env node
import readline from 'node:readline';
import { cpus } from 'node:os';
import pLimit from 'p-limit';
import { render } from './engine/index.js';
import { toMarkdown } from './html-to-md.js';

// Parse command line arguments
const args = process.argv.slice(2);
const concurrency = args.includes('--concurrency')
    ? parseInt(args[args.indexOf('--concurrency') + 1])
    : Math.max(1, Math.floor(cpus().length / 2));

const heavyMode = args.includes('--heavy')
    ? args[args.indexOf('--heavy') + 1]
    : 'auto';

// Create concurrency limiter
const limit = pLimit(concurrency);

const rl = readline.createInterface({
    input: process.stdin,
    crlfDelay: Infinity
});

// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.error('Received SIGINT, shutting down gracefully...');
    const { shutdown } = await import('./engine/lightpanda.js');
    await shutdown();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.error('Received SIGTERM, shutting down gracefully...');
    const { shutdown } = await import('./engine/lightpanda.js');
    await shutdown();
    process.exit(0);
});

// Track active requests
const activeRequests = new Map();

rl.on('line', async (line) => {
    // Use the limiter to control concurrency
    limit(async () => {
        try {
            const { id, url, as = 'html', mode = 'standard' } = JSON.parse(line);

            // Validate input
            if (!url || typeof url !== 'string') {
                throw new Error('Invalid URL provided');
            }

            // Track this request
            activeRequests.set(id, { url, start: Date.now() });

            // Determine heavy retry mode
            const heavyRetry = heavyMode === 'always' ? true
                : heavyMode === 'never' ? false
                    : true; // auto

            // Render the page
            const html = await render(url, { heavyRetry });

            // Convert to markdown if requested
            let payload = html;
            if (as === 'markdown') {
                payload = await toMarkdown(html, mode);
            }

            // Send success response
            process.stdout.write(JSON.stringify({
                id,
                ok: true,
                payload,
                elapsed: Date.now() - activeRequests.get(id).start
            }) + '\n');

            activeRequests.delete(id);
        } catch (err) {
            // Send error response
            const request = activeRequests.get(id);
            process.stdout.write(JSON.stringify({
                ok: false,
                error: String(err),
                stack: process.env.DEBUG ? (err as Error).stack : undefined,
                elapsed: request ? Date.now() - request.start : 0
            }) + '\n');

            if (request) activeRequests.delete(id);
        }
    });
});

// Log startup message to stderr (not stdout)
console.error(`DeepWiki MCP service ready.`);
console.error(`Concurrency: ${concurrency} parallel requests`);
console.error(`Heavy mode: ${heavyMode}`);
console.error(`Send JSON lines to stdin.`);