Project: Deepwiki-to-Markdown MCP Server

Phase 1 – Requirements Ingestion
- Load <PRD_PATH> and <TECH_STACK_PATH>.
- Product vision: a TypeScript MCP server that crawls a Deepwiki repo, converts sanitized HTML to Markdown, and returns either one aggregated document or a page-structured array. It must be fast (≤10 s for 100 pages on a 2025 laptop), secure (Deepwiki-only scope, domain whitelist, retries, throttling), and CI-friendly (Docker image, GitHub Actions, lint). Four user personas drive requirements: CLI Developer, Desktop Host Integrator, DevOps/CI Engineer, and Documentation Consumer.
- Key constraints: CPU-bound conversion, network throttling, streaming progress, strict Zod validation, HTML sanitation, robustness under flaky networks, performance budget, image size ≤150 MB.
- High-level architecture: fetch layer built on Undici and p-queue, DOM parsing with LinkeDOM and rehype-parse, sanitation via rehype-sanitize, conversion pipeline rehype-remark → remark-stringify, request/response schemas with Zod and MCP SDK, concurrency and retry controls, logging and progress via stdout JSON lines, tests with Vitest, lint with ESLint, containerization with Docker, CI on GitHub Actions.

Phase 2 – Development Planning
- Total story points: 32
- Context window capacity: 100 000 tokens
- Batching decision: Holistic (single build fits comfortably)

Planned Batches:

| Batch | Story IDs | Cumulative Story Points |
|-------|-----------|-------------------------|
| 1 | US-001, US-002, US-003, US-005, US-006, US-007, US-008, US-009, US-011, US-013, US-014, US-015, US-016, US-017, US-018, US-019 | 32 |

Phase 3 – Iterative Build
For batch 1:
1. Load all requirements and scaffold monorepo with pnpm workspaces (core, cli, tests, docker).
2. Design Zod schemas for request/response, progress events, and error envelopes.
3. Implement backend services
   - Crawler with Undici + p-queue, robots.txt respect, depth limiting, domain whitelist, retry with exponential backoff, throttling, partial-failure reporting.
   - HTML pipeline: LinkeDOM parse, rehype-parse, rehype-sanitize (custom schema to strip images, scripts, chrome), rehype-remark, remark-stringify, link rewriting logic.
   - Aggregate vs pages modes and streaming JSON lines for progress.
4. Build CLI wrapper exposing flags and Docker ENTRYPOINT; integrate MCP SDK transport for desktop hosts.
5. Refine UX: structured logging, verbose flag, human-friendly errors, progress every ≤3 s.
6. Tests
   - Unit: schema validation, link scope, link rewriting, retry counters, throttling.
   - Integration: sample 5-page Deepwiki fixture, partial-failure scenario, performance timer.
   - CI: Vitest, ESLint with Vitest plugin, coverage gate, GitHub Actions workflow ≤4 min.
7. Package Docker image, ensure size ≤150 MB, `docker run ... --help` works.
8. Merge to main, run full pipeline, tag v0.1.0.

Phase 4 – Final Integration
- End-to-end verification of all PRD acceptance criteria using a 100-page synthetic Deepwiki repo; confirm ≤10 s conversion with warm cache on target hardware.
- Tune p-queue defaults, retry backoff, and Node flags for memory use; profile CPU hotspots.
- Harden error messages and update README, CLI manuals, and MCP server manifest.
- Publish Docker image to registry and npm package to npmjs; version lock in GitHub Actions.
- Deliver `.planr/roadmap.md`, tag v1.0.0, and mark deployment ready.
