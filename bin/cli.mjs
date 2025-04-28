#!/usr/bin/env node

import { fileURLToPath } from 'node:url'
import { runMain } from '../dist/index.mjs'

globalThis.__mcp_starter_cli__ = {
  startTime: Date.now(),
  entry: fileURLToPath(import.meta.url),
}

runMain()
