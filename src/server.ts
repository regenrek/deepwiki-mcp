import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { createServer as createNodeServer } from 'node:http'
import { RestServerTransport } from '@chatmcp/sdk/server/rest.js'
import { McpServer as Server } from '@modelcontextprotocol/sdk/server/mcp.js'
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { createApp, createRouter, defineEventHandler, getQuery, setResponseStatus, toNodeListener } from 'h3'

/** Create the bare MCP server instance */
export function createServer(options: { name: string, version: string }): McpServer {
  const { name, version } = options
  return new Server({ name, version })
}

interface StdioOptions { type: 'stdio' }
interface HttpOptions { type: 'http', port?: number, endpoint?: string }
interface SseOptions { type: 'sse', port?: number }

export type StartOptions = StdioOptions | HttpOptions | SseOptions

/**
 * Starts the given MCP server with the selected transport.
 *  Defaults to stdio when no options are provided.
 */
export async function startServer(
  server: McpServer,
  options: StartOptions = { type: 'stdio' },
): Promise<void> {
  if (options.type === 'stdio') {
    const transport = new StdioServerTransport()
    await server.connect(transport)
    return
  }

  if (options.type === 'http') {
    const port = options.port ?? 3000
    const endpoint = options.endpoint ?? '/mcp'
    const transport = new RestServerTransport({ port, endpoint })
    await server.connect(transport)
    await transport.startServer()
    console.log(`HTTP server listening → http://localhost:${port}${endpoint}`)
    return
  }

  // SSE
  const port = options.port ?? 3000
  const transports = new Map<string, SSEServerTransport>()

  // Create h3 app and router
  const app = createApp()
  const router = createRouter()

  // SSE endpoint
  router.get('/sse', defineEventHandler(async (event) => {
    const res = event.node.res
    const transport = new SSEServerTransport('/messages', res)
    transports.set(transport.sessionId, transport)
    res.on('close', () => transports.delete(transport.sessionId))
    await server.connect(transport)
  }))

  // Messages endpoint
  router.post('/messages', defineEventHandler(async (event) => {
    const { sessionId } = getQuery(event) as { sessionId?: string }
    const transport = sessionId ? transports.get(sessionId) : undefined
    if (transport) {
      await transport.handlePostMessage(event.node.req, event.node.res)
    }
    else {
      setResponseStatus(event, 400)
      return 'No transport found for sessionId'
    }
  }))

  app.use(router)

  // Start Node server using h3's Node adapter
  const nodeServer = createNodeServer(toNodeListener(app))
  nodeServer.listen(port)
  console.log(`SSE server listening → http://localhost:${port}/sse`)
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
