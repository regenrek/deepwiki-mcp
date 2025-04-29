#!/usr/bin/env node

import type { McpToolContext } from './types'
import { runMain as _runMain, defineCommand } from 'citty'
import { version } from '../package.json'
import { createServer, startServer, stopServer } from './server'
import { deepwikiTool } from './tools/deepwiki'
import { deepwikiSearchTool } from './tools/deepwikiSearch'

const cli = defineCommand({
  meta: {
    name: 'mcp-instruct',
    version,
    description: 'Run the MCP starter with stdio, http, or sse transport',
  },
  args: {
    http: { type: 'boolean', description: 'Run with HTTP transport' },
    sse: { type: 'boolean', description: 'Run with SSE transport' },
    stdio: { type: 'boolean', description: 'Run with stdio transport (default)' },
    port: { type: 'string', description: 'Port for http/sse (default 3000)', default: '3000' },
    endpoint: { type: 'string', description: 'HTTP endpoint (default /mcp)', default: '/mcp' },
  },
  async run({ args }) {
    const mode = args.http ? 'http' : args.sse ? 'sse' : 'stdio'
    const mcp = createServer({ name: 'my-mcp-server', version })

    process.on('SIGTERM', () => stopServer(mcp))
    process.on('SIGINT', () => stopServer(mcp))

    deepwikiTool({ mcp } as McpToolContext)
    // deepwikiSearchTool({ mcp } as McpToolContext)

    if (mode === 'http') {
      await startServer(mcp, { type: 'http', port: Number(args.port), endpoint: args.endpoint })
    }
    else if (mode === 'sse') {
      console.log('Starting SSE server...')
      await startServer(mcp, { type: 'sse', port: Number(args.port) })
    }
    else if (mode === 'stdio') {
      await startServer(mcp, { type: 'stdio' })
    }
  },
})

export const runMain = () => _runMain(cli)
