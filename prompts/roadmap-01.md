AI-Optimized Development Roadmap Generator

<PRD_PATH>
# Deepwiki-to-Markdown MCP Server

## 1. Title and Overview

### 1.1 Document Title & Version
* Document: Deepwiki-to-Markdown MCP Server – Product Requirements Document
* Version: 1.0
* Status: Draft
* Last updated: 26 Apr 2025

### 1.2 Product Summary
The Deepwiki-to-Markdown MCP Server is a standalone TypeScript service that receives a Deepwiki repository URL through Model Context Protocol (MCP) standard input/output, crawls every in-scope page, converts the sanitized HTML to Markdown, and returns either a single aggregated document or a page-structured array. The server is intended for local and containerized use, ships with robust logging, testing, and CI, and must process a medium-sized repo (<100 pages, <5 MB HTML) in under ten seconds on a typical 2025 laptop with a warm cache.

## 2. User Personas

### 2.1 Key User Types
1. CLI Developer
2. Desktop Host Integrator
3. DevOps / CI Engineer
4. Documentation Consumer

### 2.2 Basic Persona Details
* **CLI Developer**
  * Background: Full-stack or tooling engineer comfortable with Node, TypeScript, and container workflows.
  * Goal: Run the server locally or in Docker, test conversions, and debug crawls.
  * Pain points: Slow crawls, noisy output, missing code blocks.

* **Desktop Host Integrator**
  * Background: Maintains an MCP-compatible desktop application (e.g., Claude Desktop) and installs MCP tools.
  * Goal: Register deepwiki.fetch, show progress bars, and surface Markdown content to end users.
  * Pain points: Unreliable schemas, lack of streaming progress, inconsistent error handling.

* **DevOps / CI Engineer**
  * Background: Owns build pipelines and documentation portals.
  * Goal: Automate repo conversion in GitHub Actions, fail builds on HTML sanitization issues, and pin versions.
  * Pain points: Flaky network fetches, race conditions, and un-cached Docker layers.

* **Documentation Consumer**
  * Background: Engineer or reader who ultimately views or searches the Markdown output in another tool.
  * Goal: Receive clean Markdown without Deepwiki chrome or broken links.
  * Pain points: Image placeholders, malformed headings, missing mermaid diagrams.

### 2.3 Role-based Access
| Role | How the role initiates work | Main permissions/features |
| --- | --- | --- |
| Operator (CLI Developer) | `npx deepwiki-mcp fetch` or `docker run deepwiki-mcp` | Full flags (`--verbose`, `--max-depth`, mode selection), local logging |
| Integrator (Desktop Host) | Sends JSON request on stdio | Can invoke only deepwiki.fetch, receives progress events, no direct FS access |
| Guest / Consumer | Reads downstream Markdown | No access to the server itself; benefits indirectly from sanitized output |

## 3. User Stories

The following user stories cover primary, alternative, and edge-case interactions. Each story is uniquely traceable and testable.

### US-001 Happy-path aggregate fetch
*Description*
As an Operator I want to pass a Deepwiki repo URL with default settings so that I receive one concatenated Markdown document.
*Acceptance Criteria*
- Given a reachable Deepwiki repo when I send an action deepwiki.fetch with mode "aggregate" then the response is status "ok" and data is a Markdown string.
- The response contains level-1 headings separating each page.
- Conversion completes within the performance budget.

### US-002 Happy-path pages mode
*Description*
As an Operator I want to request mode "pages" so that I receive an array of page objects.
*Acceptance Criteria*
- The server returns data as an array of objects with path and markdown keys.
- Each path matches the original Deepwiki URL path relative to the repo root.
- Array length equals the number of crawled pages.

### US-003 Max depth limiting
*Description*
As an Operator I can set maxDepth to restrict recursion so that only the first N link levels are included.
*Acceptance Criteria*
- Pages deeper than the specified depth are not fetched.
- The crawl report shows skipped links when --verbose is on.
- If maxDepth is 0 only the root page is converted.

### US-005 Link scope restriction
*Description*
As a Server I follow only links that begin with the original <user>/<repo> prefix so that external sites are never crawled.
*Acceptance Criteria*
- External links are ignored.
- Internal links to sibling repos on Deepwiki are ignored.
- A test fixture proves only in-namespace pages are queued.

### US-006 HTML sanitation
*Description*
As a Converter I strip header, footer, nav, ads, scripts, and images so that output is clean Markdown.
*Acceptance Criteria*
- No `<img>` tags appear in the final Markdown.
- Code fences and mermaid fences are preserved with language tags.
- Heading hierarchy matches original content (h1‒h6).
- HTML entities are decoded.

### US-007 Internal link rewrite
*Description*
As a Converter I rewrite in-repo hyperlinks to local Markdown anchors so that resulting links work offline.
*Acceptance Criteria*
- Intra-page links become `#anchor` references.
- Cross-page links become `path.md#anchor` when mode is pages and remain intact in aggregate mode.
- Unit test validates rewriting logic.

### US-008 Input schema validation
*Description*
As a Server I validate incoming JSON against Zod schemas before processing so that malformed requests are rejected early.
*Acceptance Criteria*
- Requests missing the url field return status "error" with code "VALIDATION".
- An invalid enum for mode triggers the same path.
- Validation never blocks progress events when invalid data is detected.

### US-009 Streaming progress events
*Description*
As an Integrator I want progress events during long crawls so that I can display a progress bar.
*Acceptance Criteria*
- The server emits a JSON line for each fetched page that includes url, bytes, and elapsed ms.
- At least one event is sent every three seconds while crawl is active.
- Final response includes total pages and total bytes.

### US-011 Request throttling
*Description*
As a Server I queue outbound HTTP requests so that I avoid hammering Deepwiki.
*Acceptance Criteria*
- Concurrency defaults to 5 concurrent requests.
- Queue can be overridden via an environment variable.
- Tests simulate 20 URLs and verify no more than 5 are in flight.

### US-013 Domain whitelist
*Description*
As a Security measure the server must only fetch domains ending in deepwiki.com so that phishing is impossible.
*Acceptance Criteria*
- Any request whose host is not exactly deepwiki.com returns "error" with code "DOMAIN_NOT_ALLOWED".
- Unit test covers subdomain edge cases.

### US-014 Retry policy
*Description*
As a Server I retry transient network failures up to three times so that sporadic outages do not fail a crawl.
*Acceptance Criteria*
- Retries respect exponential backoff starting at 250 ms.
- After final failure the response status is "error" with code "FETCH_FAIL" and details list failed URLs.
- Progress events show retry counts.

### US-015 Partial failure surfacing
*Description*
As an Integrator I need to know which pages failed when some fetches succeed so that I can alert the user.
*Acceptance Criteria*
- When at least one page fails but others succeed the final status is "partial".
- Data contains succeeded pages; an "errors" array lists paths and reasons.
- Schema distinguishes "ok", "partial", and "error".

### US-016 Logging verbosity flag
*Description*
As an Operator I can pass --verbose so that each fetched URL and timing is printed to stderr.
*Acceptance Criteria*
- Without the flag only warnings and errors appear.
- With the flag every URL shows start time, status code, bytes, and ms.
- Flag can be combined with Docker run.

### US-017 Docker image usage
*Description*
As a DevOps Engineer I want an official Docker image so that I can run the server in CI.
*Acceptance Criteria*
- `docker build .` succeeds on default context.
- `docker run deepwiki-mcp --help` prints CLI help.
- Image size is ≤150 MB uncompressed.

### US-018 GitHub Actions CI
*Description*
As a Maintainer I want lint and test workflows on every push so that regressions are caught early.
*Acceptance Criteria*
- CI runs ESLint, Vitest unit tests, and integration tests with a small sample repo.
- A failing test blocks merge.
- Workflow completes in under 4 minutes.

### US-019 Secure code quality
*Description*
As a Maintainer I need ESLint with Vitest plugin to enforce style and avoid common bugs.
*Acceptance Criteria*
- `npm run lint` exits with code 0 when rules pass.
- At least the recommended and Vitest rulesets are enabled.
- Lint runs in CI.

---

### Final Checklist
* Every user story above includes explicit, measurable acceptance criteria that can be unit or integration tested.
* Stories US-012, US-013, and US-020 cover security and access concerns.
* Primary, alternative, and edge-case scenarios (validation failures, partial fetch, retry, size limit) are represented.
* Combined, these stories enable a fully functional first release of the Deepwiki-to-Markdown MCP Server.

 </PRD_PATH>

<TECH_STACK_PATH>
# Tech Stack
_Last updated: April 26 2025_

## Framework reference table

| Framework / Library | Latest Stable Version | Short Description | npm Package | Installed | GitHub | Docs |
| --- | --- | --- | --- | --- | --- | --- |
| Undici | 7.8.0 | Modern fetch-compatible HTTP/1.1+2 client | `undici` | ✅ | nodejs/undici | <https://undici.nodejs.org>  ([nodejs/undici: An HTTP/1.1 client, written from scratch for Node.js](https://github.com/nodejs/undici?utm_source=chatgpt.com)) |
| p-queue | 8.1.0 | Promise queue with concurrency and rate-limits | `p-queue` | ✅ | sindresorhus/p-queue | <https://github.com/sindresorhus/p-queue#readme>  ([sindresorhus/p-queue: Promise queue with concurrency control](https://github.com/sindresorhus/p-queue?utm_source=chatgpt.com)) |
| robots-parser | 3.0.1 | Helper to respect robots.txt rules | `robots-parser` | ✅ | samclarke/robots-parser | <https://github.com/samclarke/robots-parser#readme>  ([NodeJS robots.txt parser with support for wildcard (*) matching.](https://github.com/samclarke/robots-parser?utm_source=chatgpt.com)) |
| LinkeDOM | 0.18.9 | Fast server-side DOM implementation | `linkedom` | ✅ | WebReflection/linkedom | <https://github.com/WebReflection/linkedom#readme>  ([WebReflection/linkedom: A triple-linked lists based DOM ... - GitHub](https://github.com/WebReflection/linkedom?utm_source=chatgpt.com)) |
| unified | 11.0.5 | AST processing core | `unified` | ✅ | unifiedjs/unified | <https://unifiedjs.com>  ([unifiedjs/unified: Parse, inspect, transform, and serialize content with ...](https://github.com/unifiedjs/unified?utm_source=chatgpt.com)) |
| rehype-parse | 9.0.1 | HTML-to-HAST parser | `rehype-parse` | ✅ | rehypejs/rehype | <https://github.com/rehypejs/rehype/tree/main/packages/rehype-parse#readme>  ([rehypejs/rehype: HTML processor powered by plugins part ... - GitHub](https://github.com/rehypejs/rehype?utm_source=chatgpt.com)) |
| rehype-sanitize | 6.0.0 | Whitelist-based HTML sanitizer | `rehype-sanitize` | ✅ | rehypejs/rehype-sanitize | <https://github.com/rehypejs/rehype-sanitize#readme>  ([rehypejs/rehype-sanitize: plugin to sanitize HTML - GitHub](https://github.com/rehypejs/rehype-sanitize?utm_source=chatgpt.com)) |
| rehype-remark | 10.0.1 | HAST-to-MDAST converter | `rehype-remark` | ✅ | rehypejs/rehype-remark | <https://github.com/rehypejs/rehype-remark#readme>  ([rehypejs/rehype-remark: plugin to transform from HTML ... - GitHub](https://github.com/rehypejs/rehype-remark?utm_source=chatgpt.com)) |
| remark-stringify | 10.0.0 | Markdown emitter | `remark-stringify` | ✅ | remarkjs/remark | <https://github.com/remarkjs/remark/tree/main/packages/remark-stringify#readme>  ([remark/packages/remark-stringify/readme.md at main - GitHub](https://github.com/remarkjs/remark/blob/main/packages/remark-stringify/readme.md?utm_source=chatgpt.com)) |
| Zod | 3.24.3 | Type-safe schema validation | `zod` | ✅ | colinhacks/zod | <https://zod.dev>  ([colinhacks/zod: TypeScript-first schema validation with ... - GitHub](https://github.com/colinhacks/zod?utm_source=chatgpt.com)) |
| Vitest | 3.1.2 | Fast Vite-powered test runner | `vitest` | ✅ | vitest-dev/vitest | <https://vitest.dev>  ([vitest-dev/vitest: Next generation testing framework powered by Vite.](https://github.com/vitest-dev/vitest?utm_source=chatgpt.com)) |
| TypeScript | 5.5.2 | Typed superset of JavaScript | `typescript` | ✅ | microsoft/TypeScript | <https://www.typescriptlang.org>  ([TypeScript is a superset of JavaScript that compiles to ... - GitHub](https://github.com/microsoft/TypeScript?utm_source=chatgpt.com)) |
| ESLint | 9.4.0 | Pluggable JavaScript linter | `eslint` | ✅ | eslint/eslint | <https://eslint.org>  ([eslint/eslint: Find and fix problems in your JavaScript code. - GitHub](https://github.com/eslint/eslint?utm_source=chatgpt.com)) |
| eslint-plugin-vitest | 1.1.42 | ESLint rules for Vitest | `@vitest/eslint-plugin` | ✅ | vitest-dev/eslint-plugin-vitest | <https://github.com/vitest-dev/eslint-plugin-vitest#readme>  ([eslint plugin for vitest - GitHub](https://github.com/vitest-dev/eslint-plugin-vitest?utm_source=chatgpt.com)) |
| MCP TypeScript SDK | 1.6.0 | Model Context Protocol SDK and transport helpers | `@modelcontextprotocol/sdk` | ✅ | modelcontextprotocol/typescript-sdk | <https://github.com/modelcontextprotocol/typescript-sdk#readme>  ([The official Typescript SDK for Model Context Protocol servers and ...](https://github.com/modelcontextprotocol/typescript-sdk?utm_source=chatgpt.com)) |

</TECH_STACK_PATH>

<DATE>
April 2025 capabilities
</DATE>

<MAX_CONTEXT_TOKENS>
Context Window: 200k
Max Output Tokens: 100k
</MAX_CONTEXT_TOKENS>

## Context for the Agent
You are an autonomous AI developer with a large-context LLM. Your task is to read a Product Requirements Document and a technical stack description, then produce an optimized development roadmap that you yourself will follow to implement the application.

## Inputs
- PRD file: <PRD_PATH>
- Tech-Stack file: <TECH_STACK_PATH>
- LLM context window (tokens): <MAX_CONTEXT_TOKENS>
- Story-point definition: 1 story point ≈ 1 day human effort ≈ 1 second AI effort

## Output Required
Return a roadmap in Markdown (no code fences, no bold) containing:
1. Phase 1 – Requirements Ingestion
2. Phase 2 – Development Planning (with batch list and story-point totals)
3. Phase 3 – Iterative Build steps for each batch
4. Phase 4 – Final Integration and Deployment readiness

## Operating Rules for the Agent
1. Load both input files fully before any planning.
2. Parse all user stories and record each with its story-point estimate.
3. Calculate total story points and compare to the capacity implied by <MAX_CONTEXT_TOKENS>.
   - If the full set fits, plan a single holistic build.
   - If not, create batches whose cumulative story points stay within capacity, grouping related or dependent stories together.
4. For every batch, plan the complete stack work: schema, backend, frontend, UX refinement, integration tests.
5. After finishing one batch, merge its code with the existing codebase and update internal context before starting the next.
6. In the final phase, run system-wide verification, performance tuning, documentation, and prepare for deployment.
7. Keep the roadmap concise yet traceable: show which user stories appear in which batch and the cumulative story-point counts.
8. Do not use bold formatting and do not wrap the result in code fences.

---

## Template Starts Here

Project: <PROJECT_NAME>

Phase 1 – Requirements Ingestion
- Load <PRD_PATH> and <TECH_STACK_PATH>.
- Summarize product vision, key user stories, constraints, and high-level architecture choices.

Phase 2 – Development Planning
- Total story points: <TOTAL_STORY_POINTS>
- Context window capacity: <MAX_CONTEXT_TOKENS> tokens
- Batching decision: <HOLISTIC_OR_BATCHED>
- Planned Batches:

| Batch | Story IDs | Cumulative Story Points |
|-------|-----------|-------------------------|
| 1 | <IDs> | <N> |
| 2 | <IDs> | <N> |
| … | … | … |

Phase 3 – Iterative Build
For each batch:
1. Load batch requirements and current codebase.
2. Design or update database schema.
3. Implement backend services and API endpoints.
4. Build or adjust frontend components.
5. Refine UX details and run batch-level tests.
6. Merge with main branch and update internal context.

Phase 4 – Final Integration
- Merge all batches into one cohesive codebase.
- Perform end-to-end verification against all PRD requirements.
- Optimize performance and resolve residual issues.
- Update documentation and deployment instructions.
- Declare the application deployment ready.

End of roadmap.

Save the generated roadmap to `.planr/roadmap.md`
