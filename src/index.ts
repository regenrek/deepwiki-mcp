#!/usr/bin/env node

import type { McpToolContext } from './types'
import { runMain as _runMain, defineCommand } from 'citty'
import { version } from '../package.json'
import { createServer, startServer, stopServer } from './server'
import { deepwikiTool } from './tools/deepwiki'

const cli = defineCommand({
  meta: {
    name: 'mcp-instruct',
    version,
    description: 'Run the DeepWiki MCP server over stdio',
  },
  args: {
    http: { type: 'boolean', description: 'Unsupported legacy transport' },
    sse: { type: 'boolean', description: 'Unsupported legacy transport' },
    stdio: { type: 'boolean', description: 'Run with stdio transport (default)' },
  },
  async run({ args }) {
    if (args.http || args.sse) {
      process.stderr.write('HTTP and SSE transports are disabled. Remove --http or --sse to use local stdio, or migrate to the official DeepWiki MCP server: https://docs.devin.ai/work-with-devin/deepwiki-mcp\n')
      process.exitCode = 1
      return
    }

    const mcp = createServer({ name: 'my-mcp-server', version })

    process.on('SIGTERM', () => stopServer(mcp))
    process.on('SIGINT', () => stopServer(mcp))

    deepwikiTool({ mcp } as McpToolContext)
    await startServer(mcp)
  },
})

export const runMain = () => _runMain(cli)
