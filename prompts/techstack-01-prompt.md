Act as markdown formatter. your goal is to create a formatted markdown document for my tech stack

<date>
latest april 26 2025
</date>

<tech_stack>
### Updated tech-stack recommendation (Cheerio replaced with LinkeDOM)

**Fetcher and network guard**

* **undici @ 7.8.0** – modern fetch-compatible HTTP/1.1+2 client, published 16 days ago  ([undici - npm](https://www.npmjs.com/package/undici))
* **p-queue @ 8.1.0** – promise queue with concurrency and rate-limit controls for polite crawling  ([p-queue - npm](https://www.npmjs.com/package/p-queue))
* **robots-parser @ 3.0.1** – simple helper to respect robots.txt rules before scheduling each request  ([robots-parser - npm](https://www.npmjs.com/package/robots-parser))

**DOM parse and traversal**

* **linkedom @ 0.18.9** – fast, server-side DOM implementation with `parseHTML`, CSS selectors and an optional cached mode; published 3 months ago  ([linkedom - npm](https://www.npmjs.com/package/linkedom))

**HTML ➜ Markdown pipeline**

* **unified @ 11.0.5** – AST processor core  ([unified - npm](https://www.npmjs.com/package/unified))
* **rehype-parse @ 9.0.1** – HTML to HAST parser  ([rehype-parse - npm](https://www.npmjs.com/package/rehype-parse))
* **rehype-sanitize @ 6.x** – whitelist-based sanitiser (drops scripts, ads, imgs)
* **rehype-remark @ 10.0.1** – HAST to MDAST converter  ([rehype-remark - npm](https://www.npmjs.com/package/rehype-remark))
* **remark-stringify @ 10.x** – final Markdown emitter

This chain keeps headings, code fences and Mermaid blocks intact while letting you plug in a tiny plugin that rewrites internal anchors and strips header/footer nodes.

**Validation, testing, tooling**

* **zod @ 3.x** – JSON schema validation for request and response objects.
* **vitest @ 3.x** – fast ESM-native test runner (shares Vite config).
* **typescript @ 5.x**, **eslint @ 9.x**, **eslint-plugin-vitest @ 1.x** for linting and types.

**MCP plumbing**

* **@modelcontextprotocol/sdk @ 1.6** – provides `StdioServerTransport`, request typing and streaming helpers.

---

#### Minimal `package.json` snippet

```jsonc
{
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.6.0",
    "undici": "^7.8.0",
    "p-queue": "^8.1.0",
    "linkedom": "^0.18.9",
    "robots-parser": "^3.0.1",
    "unified": "^11.0.5",
    "rehype-parse": "^9.0.1",
    "rehype-sanitize": "^6.0.0",
    "rehype-remark": "^10.0.1",
    "remark-stringify": "^10.0.0",
    "zod": "^3.24.3"
  },
  "devDependencies": {
    "vitest": "^3.1.2",
    "typescript": "^5.5.2",
    "eslint": "^9.4.0",
    "eslint-plugin-vitest": "^1.1.42",
    "@types/node": "^22.3.0"
  }
}
```

This list gives you a lean, fully-typed stack that meets the performance, security and conversion rules you specified while swapping in LinkeDOM for DOM handling.

</tech_stack>

<tech_stack_table>
- Framework: Include name of framework, library, or API
- Latest Stable Version
- Short Description
- package name
- github repository url <name>/<repo>
- docs url
</tech_stack_table>

STEPS:

Now output my tech stack document in markdown code output.

1. Read the <tech_stack_table> to understand the format
2. research online latest <date /> if some column data is missing like (package name, github repo url, docs e.g.)
2. Output only the final markdown.
