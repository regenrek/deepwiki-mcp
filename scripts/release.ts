#!/usr/bin/env tsx
/**
 * Release Script
 *
 * This script automates the process of creating and publishing releases
 * for the current package.
 *
 * Usage:
 *   pnpm tsx scripts/release.ts [version-type] [--alpha] [--no-git]
 *
 * version-type: 'major', 'minor', 'patch', or specific version (default: 'patch')
 * --alpha: Create an alpha release
 * --no-git: Skip git commit and tag
 */

import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

// Parse command line arguments
const args = process.argv.slice(2)
const versionBumpArg = args.find(arg => !arg.startsWith('--')) || 'patch'
const isAlpha = args.includes('--alpha')
const skipGit = args.includes('--no-git')

const rootPath = path.resolve('.')

function run(command: string, cwd: string) {
  console.log(`Executing: ${command} in ${cwd}`)
  execSync(command, { stdio: 'inherit', cwd })
}

/**
 * Bump version in package.json
 * @param pkgPath Path to the package directory (project root)
 * @param type Version bump type: 'major', 'minor', 'patch', or specific version
 * @param isAlpha Whether to create an alpha version
 * @returns The new version
 */
function bumpVersion(pkgPath: string, type: 'major' | 'minor' | 'patch' | string, isAlpha: boolean = false): string {
  const pkgJsonPath = path.join(pkgPath, 'package.json')
  const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf-8'))
  const currentVersion = pkgJson.version
  let newVersion: string

  // Parse current version to check if it's already an alpha version
  const versionRegex = /^(\d+\.\d+\.\d+)(?:-alpha\.(\d+))?$/
  const match = currentVersion.match(versionRegex)

  if (!match) {
    throw new Error(`Invalid version format: ${currentVersion}`)
  }

  let baseVersion = match[1]
  const currentAlphaVersion = match[2] ? Number.parseInt(match[2], 10) : -1

  // Handle version bumping
  if (type === 'major' || type === 'minor' || type === 'patch') {
    const [major, minor, patch] = baseVersion.split('.').map(Number)

    // Bump version according to type
    if (type === 'major') {
      baseVersion = `${major + 1}.0.0`
    }
    else if (type === 'minor') {
      baseVersion = `${major}.${minor + 1}.0`
    }
    else { // patch
      baseVersion = `${major}.${minor}.${patch + 1}`
    }
  }
  else if (type.match(/^\d+\.\d+\.\d+$/)) {
    // Use the provided version string directly as base version
    baseVersion = type
  }
  else {
    throw new Error(`Invalid version bump type: ${type}. Use 'major', 'minor', 'patch', or a specific version like '1.2.3'.`)
  }

  // Create final version string
  if (isAlpha) {
    // For alpha releases, always start at alpha.0 when base version changes
    // If the base version is the same, increment the alpha number.
    const alphaVersion = baseVersion === match[1] ? currentAlphaVersion + 1 : 0
    if (alphaVersion < 0) {
      throw new Error(`Cannot create alpha version from non-alpha version ${currentVersion} without bumping base version (major, minor, patch, or specific).`)
    }
    newVersion = `${baseVersion}-alpha.${alphaVersion}`
  }
  else {
    // If bumping from an alpha version to a stable version, use the current or bumped baseVersion
    newVersion = baseVersion
  }

  // Update package.json
  pkgJson.version = newVersion
  fs.writeFileSync(pkgJsonPath, `${JSON.stringify(pkgJson, null, 2)}\n`)

  console.log(`Bumped version from ${currentVersion} to ${newVersion} in ${pkgJsonPath}`)
  return newVersion
}

/**
 * Create a git commit and tag for the release
 * @param version The version to tag
 * @param isAlpha Whether this is an alpha release
 */
function createGitCommitAndTag(version: string, isAlpha: boolean = false) {
  console.log('Creating git commit and tag...')

  try {
    // Stage package.json and any other changes
    run('git add package.json', rootPath) // Specifically add package.json
    // Optional: Add other specific files if needed, or 'git add .' if all changes should be included

    // Create commit with version message
    const commitMsg = isAlpha
      ? `chore: alpha release v${version}`
      : `chore: release v${version}`
    run(`git commit -m "${commitMsg}"`, rootPath)

    // Create tag
    const tagMsg = isAlpha
      ? `Alpha Release v${version}`
      : `Release v${version}`
    run(`git tag -a v${version} -m "${tagMsg}"`, rootPath)

    // Push commit and tag to remote
    console.log('Pushing commit and tag to remote...')
    run('git push', rootPath)
    run('git push --tags', rootPath)

    console.log(`Successfully created and pushed git tag v${version}`)
  }
  catch (error) {
    console.error('Failed to create git commit and tag:', error)
    // Decide if we should proceed with publishing even if git fails
    // For now, let's throw to stop the process.
    throw error
  }
}

async function publishPackage() {
  console.log(`🚀 Starting ${isAlpha ? 'alpha' : ''} release process...`)
  console.log(`📝 Version bump: ${versionBumpArg}`)

  // Build package first (assuming a build script exists in package.json)
  console.log('🔨 Building package...')
  run('pnpm build', rootPath) // Use the build script from package.json

  // Bump the version in the root package.json
  const newVersion = bumpVersion(rootPath, versionBumpArg, isAlpha)

  // Create git commit and tag if not skipped
  if (!skipGit) {
    createGitCommitAndTag(newVersion, isAlpha)
  }

  // Publish the package to npm
  console.log(`📤 Publishing package@${newVersion} to npm...`)

  const publishCmd = isAlpha
    ? 'pnpm publish --tag alpha --no-git-checks --access public'
    : 'pnpm publish --no-git-checks --access public' // --no-git-checks is often needed if git tagging is manual or separate

  run(publishCmd, rootPath)

  console.log(`✅ Successfully completed ${isAlpha ? 'alpha' : ''} release v${newVersion}!`)
}

// Run the publish process
publishPackage().catch((error) => {
  console.error('❌ Error during release process:', error)
  process.exit(1)
})
