#!/usr/bin/env node
// Downloads correct Lightpanda build (~17 MB) into ./bin

const { execSync } = require('child_process');
const { mkdirSync, chmodSync, existsSync } = require('fs');
const { join } = require('path');

const { arch, platform } = process;
const base = 'https://github.com/lightpanda-io/browser/releases/download/nightly';

// Determine the correct binary name based on platform
let name;
if (platform === 'darwin') {
    name = 'lightpanda-aarch64-macos';
} else if (platform === 'linux' && arch === 'x64') {
    name = 'lightpanda-x86_64-linux';
} else {
    throw new Error(`Unsupported platform: ${platform} ${arch}`);
}

// Create bin directory if it doesn't exist
const binDir = join(__dirname, '..', 'bin');
if (!existsSync(binDir)) {
    mkdirSync(binDir, { recursive: true });
}

const binPath = join(binDir, 'lightpanda');

// Skip download if LIGHTPANDA_PATH is set or binary already exists
if (process.env.LIGHTPANDA_PATH) {
    console.log('LIGHTPANDA_PATH is set, skipping download');
    process.exit(0);
}

if (existsSync(binPath)) {
    console.log('Lightpanda binary already exists, skipping download');
    process.exit(0);
}

console.log(`Downloading Lightpanda for ${platform} ${arch}...`);

try {
    execSync(`curl -L -o "${binPath}" "${base}/${name}"`, { stdio: 'inherit' });
    chmodSync(binPath, 0o755);
    console.log('Lightpanda downloaded successfully');
} catch (error) {
    console.error('Failed to download Lightpanda:', error.message);
    console.error('You can manually download it from:', `${base}/${name}`);
    console.error('And place it at:', binPath);
    process.exit(1);
}