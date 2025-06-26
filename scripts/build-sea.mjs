#!/usr/bin/env node
import { execSync } from 'child_process';
import { copyFileSync, existsSync } from 'fs';
import { platform } from 'os';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const projectRoot = join(__dirname, '..');

// Check if sea-prep.blob exists
const blobPath = join(projectRoot, 'sea-prep.blob');
if (!existsSync(blobPath)) {
    console.error('sea-prep.blob not found. Run "npm run sea:prepare" first.');
    process.exit(1);
}

// Get node executable path
const nodeExe = process.execPath;
const outputName = platform() === 'win32' ? 'deepwiki-mcp.exe' : 'deepwiki-mcp';
const outputPath = join(projectRoot, outputName);

console.log('Building single executable application...');

try {
    // Copy node executable
    console.log(`Copying ${nodeExe} to ${outputPath}`);
    copyFileSync(nodeExe, outputPath);

    // Inject the blob
    console.log('Injecting SEA blob...');

    if (platform() === 'darwin') {
        // macOS
        execSync(`npx postject "${outputPath}" NODE_SEA_BLOB "${blobPath}" --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2 --macho-segment-name NODE_SEA`, { stdio: 'inherit' });
        execSync(`codesign --remove-signature "${outputPath}"`, { stdio: 'inherit' });
    } else if (platform() === 'win32') {
        // Windows
        execSync(`npx postject "${outputPath}" NODE_SEA_BLOB "${blobPath}" --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2`, { stdio: 'inherit' });
    } else {
        // Linux
        execSync(`npx postject "${outputPath}" NODE_SEA_BLOB "${blobPath}" --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2`, { stdio: 'inherit' });
    }

    // Make executable on Unix
    if (platform() !== 'win32') {
        execSync(`chmod +x "${outputPath}"`, { stdio: 'inherit' });
    }

    console.log(`\n✅ Single executable created: ${outputPath}`);
    console.log(`Size: ${(existsSync(outputPath) ? require('fs').statSync(outputPath).size / 1024 / 1024 : 0).toFixed(1)} MB`);

} catch (error) {
    console.error('Failed to build single executable:', error.message);
    process.exit(1);
}