import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { McpServer as Server } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'

/** Create the bare MCP server instance */
export function createServer(options: { name: string, version: string }): McpServer {
  const { name, version } = options
  return new Server({ name, version })
}

export async function startServer(server: McpServer): Promise<void> {
  await server.connect(new StdioServerTransport())
}

export async function stopServer(server: McpServer) {
  try {
    await server.close()
  }
  catch (error) {
    console.error('Error occurred during server stop:', error)
  }
  finally {
    process.exit(0)
  }
}
