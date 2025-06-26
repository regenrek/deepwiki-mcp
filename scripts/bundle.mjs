#!/usr/bin/env node
import { build } from 'esbuild';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

async function bundle() {
    try {
        await build({
            entryPoints: [join(__dirname, '..', 'src', 'cli.ts')],
            bundle: true,
            platform: 'node',
            format: 'cjs',
            outfile: join(__dirname, '..', 'dist', 'cli.js'),
            external: ['puppeteer-core', 'playwright-core'],
            minify: process.env.NODE_ENV === 'production',
            sourcemap: process.env.NODE_ENV !== 'production',
            target: 'node18',
            banner: {
                js: '#!/usr/bin/env node',
            },
        });

        console.log('Bundle created successfully at dist/cli.js');
    } catch (error) {
        console.error('Bundle failed:', error);
        process.exit(1);
    }
}

bundle();