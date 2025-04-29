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

describe('mCP Client Tests', () => {
  let client: McpTestClient

  beforeEach(() => {
    console.log('cliEntryPointPath', cliEntryPointPath)

    client = new McpTestClient({
      cliEntryPoint: cliEntryPointPath, // Use the dynamically resolved path
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

  it('should connect to server with default configuration', async () => {
    await client.connectServer()
    const tools = await client.listTools()

    // When no args provided, default preset is "thinking", so it should include generate_thought
    expect(Array.isArray(tools.tools)).toBe(true)
    const toolNames = tools.tools.map((t: any) => t.name)
    console.log('Available tools:', toolNames)
    expect(toolNames).toContain('deepwiki.fetch')
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
