#!/usr/bin/env node
import readline from 'node:readline'
import { render } from './engine/index'
import { toMarkdown } from './html-to-md'

interface StdioRequest {
    id: string | number
    url: string
    as?: 'html' | 'markdown'
    heavyRetry?: boolean
}

interface StdioResponseOK {
    id: string | number
    ok: true
    payload: string
}

interface StdioResponseErr {
    id?: string | number
    ok: false
    error: string
}

type StdioResponse = StdioResponseOK | StdioResponseErr

const rl = readline.createInterface({ input: process.stdin, crlfDelay: Infinity })

rl.on('line', async (line) => {
    if (!line.trim()) return

    let req: StdioRequest
    try {
        req = JSON.parse(line)
    }
    catch {
        write({ ok: false, error: 'INVALID_JSON' })
        return
    }

    const { id, url, as = 'html', heavyRetry } = req

    try {
        const html = await render(url, { heavyRetry: heavyRetry !== false })
        const payload = as === 'markdown' ? await toMarkdown(html) : html
        write({ id, ok: true, payload })
    }
    catch (err) {
        write({ id, ok: false, error: String(err) })
    }
})

function write(obj: StdioResponse) {
    process.stdout.write(JSON.stringify(obj) + '\n')
}