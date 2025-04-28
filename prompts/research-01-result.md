## Research and implementation brief for the “Deepwiki → Markdown” MCP server

### 1. Objectives
- Build a standalone MCP server in TypeScript that accepts a Deepwiki repository URL and returns the repository’s content as clean Markdown.
- Default behavior: fetch every page that belongs to the given repo namespace. A `depth` or `mode` parameter lets the caller restrict the crawl to only the root page if desired.
- Expose the capability over MCP’s stdio transport so any compliant host (Claude Desktop, IDE plug-ins, shell scripts) can stream requests and responses.

### 2. Functional requirements
1. **Crawl / scrape**
   - Pull HTML from `https://deepwiki.com/<user>/<repo>` and every internal link that keeps the same `<user>/<repo>` prefix.
   - Respect robots.txt if Deepwiki publishes one and add a modest delay or concurrency cap to avoid overloading the site.

2. **Convert to Markdown**
   - Strip header, footer, nav menus, ads, or search bars.
   - Retain:
     - Headings and text hierarchy
     - Fenced code blocks (language tags preserved)
     - Mermaid diagrams exactly as they appear in code fences
     - Internal anchor links (rewrite to local Markdown anchors)
   - Discard:
     - All `<img>` tags – text only
     - External scripts, tracking pixels, and unrelated stylesheets

3. **Output**
   - Two modes:
     - `aggregate` (default): single Markdown string concatenating pages in crawl order, separated by level-1 headings or a page marker comment
     - `pages`: array of objects `{ path, markdown }` exposed as multiple MCP resources
   - Embed simple metadata: original URL, fetch timestamp, crawl mode.

4. **Interface contract (stdio transport)**
   - JSON request:
     ```json
     {
       "action": "deepwiki.fetch",
       "url": "https://deepwiki.com/colinhacks/zod",
       "mode": "aggregate" | "pages",
       "maxDepth": 0 | 1 | 2 | ...   // optional
     }
     ```
   - JSON response:
     ```json
     {
       "status": "ok",
       "data": { ... }               // aggregate string or pages array
     }
     ```
   - Stream progress events (`status: "progress"`, `percent`) to let hosts show live feedback for long crawls.

### 3. Non-functional requirements
- **Environment**: runs locally first; supply a Dockerfile so users can `docker run deepwiki-mcp ...`.
- **Dependencies**:
  - Fetch: `undici` or `node-fetch`
  - HTML→Markdown: `turndown` with custom rules, or `unified` with `rehype-remark`.
  - Link routing and crawl control: `cheerio` plus a queue.
- **Performance**: handle a medium-sized repo (~100 pages, ~5 MB HTML) in under 10 s on a laptop with network cache hits.
- **Security**: whitelist Deepwiki domain, enforce max total download size, and sanitize HTML input before conversion.
- **Testing**: Jest or Vitest covering crawl breadth, conversion fidelity, and error paths (network failure, malformed HTML).
- **Logging and diagnostics**: optional `--verbose` flag prints each URL fetched.

### 4. MCP tool manifest snippet
```jsonc
{
  "tools": [
    {
      "name": "deepwiki.fetch",
      "description": "Fetch Deepwiki repo content and return Markdown",
      "input_schema": {
        "type": "object",
        "properties": {
          "url": { "type": "string" },
          "mode": { "type": "string", "enum": ["aggregate", "pages"], "default": "aggregate" },
          "maxDepth": { "type": "integer", "minimum": 0 }
        },
        "required": ["url"]
      },
      "output_schema": { /* see Interface contract */ }
    }
  ],
  "transport": "stdio"
}
```

### 5. Deliverables
- TypeScript source code with clear module boundaries (`crawler`, `converter`, `server`, `cli`).
- Dockerfile and usage docs.
- README describing MCP registration steps for popular hosts.
- Example transcript showing a client invoking `deepwiki.fetch` and receiving Markdown.
- Automated test suite plus GitHub Actions workflow.

### 6. Open items and next steps
- **Authentication/rate limits**: Deepwiki appears publicly readable; confirm no API key is required.
- **Error strategy**: Decide on retry policy and how to indicate partial success to the client.
- **Incremental updates**: Future enhancement—store ETag or Last-Modified headers to fetch only changed pages.
- **Mermaid rendering**: Leave diagrams as code fences; consider optional server-side SVG generation later.

With these requirements frozen we can proceed to choose libraries, sketch module interfaces, and prototype the crawler.
