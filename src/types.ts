import type { McpServer } from '@modelcontextprotocol/sdk'

export interface McpToolContext {
  mcp: McpServer
}

// Define the options type
export interface McpServerOptions {
  name: string
  version: string
}

export type Tools = (context: McpToolContext) => void

// -----------------------------
// StdIO microservice protocol
// -----------------------------

export interface StdioRequest {
  id: string | number
  url: string
  as?: 'html' | 'markdown'
  heavyRetry?: boolean
}

export interface StdioResponseSuccess {
  id: string | number
  ok: true
  payload: string
}

export interface StdioResponseError {
  id?: string | number
  ok: false
  error: string
}

export type StdioResponse = StdioResponseSuccess | StdioResponseError
