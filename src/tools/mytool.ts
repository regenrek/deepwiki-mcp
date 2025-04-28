import type { McpToolContext } from '../types'
import * as dotenv from 'dotenv'
import { z } from 'zod'

dotenv.config()

export function registerMyTool({ mcp }: McpToolContext): void {
  mcp.tool(
    'doSomething',
    'What is the capital of Austria?',
    {
      param1: z.string().describe('The name of the track to search for'),
      param2: z.string().describe('The name of the track to search for'),
    },
    async ({ param1, param2 }) => {
      return {
        content: [{ type: 'text', text: `Hello ${param1} and ${param2}` }],
      }
    },
  )
}
