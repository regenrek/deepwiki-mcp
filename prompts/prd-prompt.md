You are senior product manager. your goal ist to create a comprehensive Product Requirements Document (PRD) based on the following instructions:

<prd_instructions>
## Full project brief – Deepwiki-to-Markdown MCP server

### 1. Goal
Create a standalone MCP server written in TypeScript that accepts a Deepwiki repository URL, crawls every page that belongs to that repo namespace, converts the HTML to clean Markdown (no site header, footer, or images; keep code fences and mermaid blocks intact) and returns the result through MCP’s **stdio** transport.

### 2. Functional requirements
1. **Crawling**
   - Start at `https://deepwiki.com/<user>/<repo>`.
   - Follow only links that keep the same `<user>/<repo>` prefix.
   - Obey `robots.txt` if present and throttle requests with a queue.

2. **Conversion**
   - Strip header, footer, nav, ads, and scripts.
   - Preserve headings, text, fenced code blocks (language tag intact), and mermaid diagrams.
   - Discard every `<img>` tag and external resource.
   - Rewrite internal links to local Markdown anchors.

3. **Output modes**
   - `aggregate` (default): one Markdown string containing all pages concatenated and separated by a level-1 heading or marker comment.
   - `pages`: array of objects `{ path, markdown }` so clients can select pages individually.

4. **Request/response (stdio transport)**
   ```jsonc
   // request
   {
     "action": "deepwiki.fetch",
     "url": "https://deepwiki.com/colinhacks/zod",
     "mode": "aggregate",     // or "pages"
     "maxDepth": 2            // optional, 0 = root only
   }

   // response
   {
     "status": "ok",
     "data": "## README\n…"     // or [{ path, markdown }]
   }
   ```
   - Validate input with Zod before processing.
   - Stream progress events so the host can render a progress bar on long crawls.

### 3. Non-functional requirements
- **Environment**: runs locally first; provide a Dockerfile for `docker run deepwiki-mcp`.
- **Performance**: crawl a medium-sized repo (<100 pages, <5 MB HTML) in <10 s on a typical laptop when network cache is warm.
- **Security**: whitelist Deepwiki domain; enforce maximum total download size; sanitize HTML before conversion.
- **Logging**: `--verbose` CLI flag prints each fetched URL and timing info.
- **Testing**: unit and integration tests with Vitest; CI in GitHub Actions.
- **Linting**: ESLint with the Vitest plugin.

### 4. High-level module map
| Module | Responsibility |
| --- | --- |
| **crawler/** | Fetch URLs, respect robots.txt, enqueue links, emit HTML |
| **sanitize/** | Strip header/footer/nav and images, return clean HTML |
| **converter/** | Unified pipeline (rehype-parse -> rehype-sanitize -> rehype-remark -> remark-stringify) |
| **schema/** | Zod request/response validators |
| **server/** | MCP stdio loop, routing, progress events |
| **cli.ts** | Developer command-line entry point |
| **tests/** | Vitest cases and fixtures |

### 5. Tech stack (locked as of Apr 26 2025)

| Purpose | Library / Framework | Version |
| --- | --- | --- |
| HTTP client | undici | 7.8.0 |
| Concurrency and rate-limit | p-queue | 8.1.0 |
| Robots.txt parsing | robots-parser | 3.0.1 |
| Fast DOM for server | linkedom | 0.18.9 |
| HTML→AST core | unified | 11.0.5 |
| HTML parser | rehype-parse | 9.0.1 |
| Sanitizer | rehype-sanitize | 6.0.0 |
| AST→Markdown | rehype-remark | 10.0.1 |
| Markdown stringify | remark-stringify | 10.0.0 |
| Schema validation | zod | 3.24.3 |
| Test runner | vitest | 3.1.2 |
| Language | typescript | 5.5.2 |
| Linting | eslint | 9.4.0 |
| ESLint rules for Vitest | @vitest/eslint-plugin | 1.1.42 |
| MCP helpers | @modelcontextprotocol/sdk | 1.6.0 |

### 6. MCP tool manifest snippet
```jsonc
{
  "tools": [
    {
      "name": "deepwiki.fetch",
      "description": "Fetch a Deepwiki repo and return Markdown",
      "input_schema": {
        "type": "object",
        "properties": {
          "url": { "type": "string" },
          "mode": { "type": "string", "enum": ["aggregate", "pages"], "default": "aggregate" },
          "maxDepth": { "type": "integer", "minimum": 0 }
        },
        "required": ["url"]
      },
      "output_schema": {
        "oneOf": [
          { "type": "string" },
          {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "path": { "type": "string" },
                "markdown": { "type": "string" }
              },
              "required": ["path", "markdown"]
            }
          }
        ]
      }
    }
  ],
  "transport": "stdio"
}
```

### 7. Deliverables
1. **Source code** in a public repository with MIT license.
2. **Dockerfile** supporting `docker build` and `docker run`.
3. **README** covering:
   - install, build, test, and run steps
   - MCP registration instructions for Claude Desktop or other hosts
   - sample request/response transcript
4. **Tests**: unit (converter correctness, crawler link filtering) and integration (end-to-end fetch of a small repo).
5. **CI**: GitHub Actions running lint + tests on push and PR.
6. **Roadmap** in the repo wiki: incremental crawl updates, optional SVG generation for mermaid, proxy image placeholders, and error-tolerant partial results.

### 8. Open items
- Confirm Deepwiki does not require auth or strict rate limits.
- Decide retry policy and how to surface partial failures.
- Explore storing `Last-Modified` headers for incremental sync in later versions.

With the tech stack finalized and requirements stable we can start detailed design of the crawler queue, HTML sanitation rules, and unified pipeline plugins.
</prd_instructions>

Follow these steps to create your PRD

1. Begin with a brief introduction stating the purpose of the document.

2. Organize your PRD into the following sections:

<prd_outline>
	# Title
	## 1. Title and Overview
	### 1.1 Document Title & Version
	### 1.2 Product Summary
	## 2. User Personas
	### 2.1 Key User Types
	### 2.2 Basic Persona Details
	### 2.3 Role-based Access
		   - Briefly describe each user role (e.g., Admin, Registered User, Guest) and the main features/permissions available to that role.
	## 3. User Stories
</prd_outline>

3. For each section, provide detailed and relevant information based on the PRD instructions. Ensure that you:
   - Use clear and concise language
   - Provide specific details and metrics where required
   - Maintain consistency throughout the document
   - Address all points mentioned in each section

4. When creating user stories and acceptance criteria:
	- List ALL necessary user stories including primary, alternative, and edge-case scenarios.
	- Assign a unique requirement ID (e.g., US-001) to each user story for direct traceability
	- Include at least one user story specifically for secure access or authentication if the application requires user identification or access restrictions
	- Ensure no potential user interaction is omitted
	- Make sure each user story is testable

<user_story>
- ID
- Title
- Description
- Acceptance Criteria
</user_story>

5. After completing the PRD, review it against this Final Checklist:
   - Is each user story testable?
   - Are acceptance criteria clear and specific?
   - Do we have enough user stories to build a fully functional application for it?
   - Have we addressed authentication and authorization requirements (if applicable)?

6. Format your PRD:
    - Maintain consistent formatting and numbering.
  	- Don't format text in markdown bold "**", we don't need this.
  	- List ALL User Stories in the output!
		- Format the PRD in valid Markdown, with no extraneous disclaimers.
