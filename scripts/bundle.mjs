import { build } from 'esbuild'
import { resolve } from 'node:path'

const entry = resolve('src/cli.ts')
const outfile = resolve('dist/cli.js')

await build({
    entryPoints: [entry],
    outfile,
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    external: ['puppeteer-core', 'playwright-core'],
})

console.log(`[bundle] ✓  ${outfile}`)