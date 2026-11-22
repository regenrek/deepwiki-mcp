import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createServer, startServer } from '../src/server'

const { createSpy } = vi.hoisted(() => ({ createSpy: vi.fn() }))

vi.mock('@modelcontextprotocol/sdk/server/mcp.js', () => ({
  McpServer: class {
    constructor(options: unknown) {
      createSpy(options)
    }

    connect = vi.fn().mockResolvedValue(undefined)
  },
}))

vi.mock('@modelcontextprotocol/sdk/server/stdio.js', () => ({
  StdioServerTransport: class {},
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('createServer', () => {
  it('constructs the MCP server with the given options', () => {
    const options = { name: 'test-server', version: '1.2.3' }

    expect(createServer(options)).toBeInstanceOf(McpServer)
    expect(createSpy).toHaveBeenCalledWith(options)
  })
})

describe('startServer', () => {
  it('connects over stdio by default', async () => {
    const server = createServer({ name: 'test', version: '1.0.0' })

    await startServer(server)

    expect(server.connect).toHaveBeenCalledExactlyOnceWith(expect.any(StdioServerTransport))
  })
})
