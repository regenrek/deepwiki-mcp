import type { McpToolContext, Tools } from './types' // Assuming McpToolContext is defined in types.ts
import fs from 'node:fs'
import path from 'node:path'

interface PackageJson {
  name?: string
  version: string
  [key: string]: any
}

export function getPackageJson(): PackageJson | null {
  try {
    const packageJsonPath = path.resolve(process.cwd(), 'package.json')
    if (!fs.existsSync(packageJsonPath)) {
      console.error('Error: package.json not found at', packageJsonPath)
      return null
    }
    const packageJsonContent = fs.readFileSync(packageJsonPath, 'utf-8')
    const packageJson: PackageJson = JSON.parse(packageJsonContent)

    if (!packageJson.version) {
      console.error('Error: package.json is missing the required \'version\' field.')
      return null
    }

    return packageJson
  }
  catch (error) {
    console.error('Error reading or parsing package.json:', error)
    return null // Return null on error
  }
}

export function registerTools(context: McpToolContext, tools: Tools[]): void {
  tools.forEach(register => register(context))
}
