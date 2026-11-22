import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { McpTestClient } from './McpClient.js'

// Resolve the CLI entry point path dynamically
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
// Go up three levels from test/ -> test-utils/ -> packages/ -> mcpn/
// Then down to packages/cli/bin/mcpn.mjs
const cliEntryPointPath = path.resolve(__dirname, '../bin/cli.mjs')

describe('cli transport selection', () => {
  it.each([
    ['--http', '--port', '0', '--endpoint', '/mcp'],
    ['--sse', '--port', '0'],
    ['--stdio', '--http', '--sse'],
  ])('rejects network transport flags (%s)', (...args) => {
    const result = spawnSync(process.execPath, [cliEntryPointPath, ...args], {
      encoding: 'utf8',
      timeout: 3000,
    })

    expect(result.error).toBeUndefined()
    expect(result.status).toBe(1)
    expect(result.stdout).toBe('')
    expect(result.stderr).toContain('https://docs.devin.ai/work-with-devin/deepwiki-mcp')
  })
})

describe('stdio client', () => {
  it.each([
    { mode: 'default', args: [] },
    { mode: 'explicit', args: ['--stdio'] },
  ])('lists tools over $mode stdio', async ({ args }) => {
    const client = new McpTestClient({ cliEntryPoint: cliEntryPointPath })

    try {
      await client.connect(args)
      const tools = await client.listTools()
      expect(tools.tools).toContainEqual(expect.objectContaining({ name: 'deepwiki_fetch' }))
    }
    finally {
      await client.close()
    }
  })
})

describe('deepWiki Tool Tests', () => {
  let client: McpTestClient

  beforeEach(() => {
    // Resolve the CLI entry point path dynamically
    const __filename = fileURLToPath(import.meta.url)
    const __dirname = path.dirname(__filename)

    client = new McpTestClient({
      cliEntryPoint: cliEntryPointPath,
    })
  })

  afterEach(async () => {
    try {
      await client.close()
    }
    catch (error) {
      console.error('Error closing client:', error)
    }
  })

  it('should fetch content from a deepwiki.com URL', async () => {
    await client.connectServer() // Connect with default settings

    // Verify deepwiki.fetch tool is available
    const tools = await client.listTools()
    const toolNames = tools.tools.map((t: any) => t.name)
    expect(toolNames).toContain('deepwiki.fetch')

    // Call the deepwiki.fetch tool
    const result = await client.callTool('deepwiki.fetch', {
      url: 'https://deepwiki.com/antiwork/gumroad/3.1-navigation-components',
      maxDepth: 1,
      mode: 'pages',
    })

    console.log('deepwiki.fetch result:', JSON.stringify(result, null, 2))

    expect(result.content[0].text).toMatch(/Navigation Components/)
  }, 30000) // Increase timeout for network request

  it('should return error for non-deepwiki.com URL', async () => {
    await client.connectServer()

    // Expect the call to reject with a specific error structure
    await expect(client.callTool('deepwiki.fetch', {
      url: 'https://example.com/some/path', // Use a non-deepwiki URL
      maxDepth: 0,
      // mode: 'pages' // Mode is irrelevant here, but keep it valid if needed
    })).rejects.toMatchObject({
      // Adjust based on the actual error structure returned by MCP client/server
      // It might be a generic RPC error code like -32602 for invalid params
      // or a custom error code if the tool handles it specifically.
      // Based on the logs, it seems to be -32602
      code: -32602,
      message: expect.stringContaining('Invalid arguments'), // Or a more specific message if available
    })
  })

  it('should return validation error for missing URL', async () => {
    await client.connectServer()

    // Expect the call to reject because validation fails
    await expect(client.callTool('deepwiki.fetch', {
      // url is missing
      maxDepth: 1,
      mode: 'pages',
    })).rejects.toMatchObject({
      code: -32602, // MCP error code for invalid parameters
      message: expect.stringContaining('Invalid arguments'), // Check for a part of the error message
      // Optionally, check for more details if the error object provides them
      // data: expect.objectContaining({ /* ... details ... */ })
    })
  })
})
