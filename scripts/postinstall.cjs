const { arch, platform } = process
const { execSync } = require('node:child_process')
const { existsSync, mkdirSync, chmodSync } = require('node:fs')
const { join } = require('node:path')

// Directory that will contain the binary
const BIN_DIR = join(__dirname, '..', 'bin')
if (!existsSync(BIN_DIR)) {
    mkdirSync(BIN_DIR, { recursive: true })
}

const base = 'https://github.com/lightpanda-io/browser/releases/download/nightly'

let name
if (platform === 'darwin') {
    name = 'lightpanda-aarch64-macos'
}
else if (platform === 'linux' && arch === 'x64') {
    name = 'lightpanda-x86_64-linux'
}
else {
    console.error(`[postinstall] Unsupported platform: ${platform} ${arch}`)
    process.exit(0) // Do not fail install for unsupported targets
}

const dest = join(BIN_DIR, 'lightpanda')

try {
    console.log(`[postinstall] Downloading Lightpanda binary → ${dest}`)
    execSync(`curl -L -o ${dest} ${base}/${name}`, { stdio: 'inherit' })
    chmodSync(dest, 0o755)
    console.log('[postinstall] Lightpanda download complete.')
}
catch (err) {
    console.error('[postinstall] Failed to download Lightpanda binary:', err)
    console.error('You can set LIGHTPANDA_PATH to point to an existing binary.')
}