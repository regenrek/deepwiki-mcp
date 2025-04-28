# Deepwiki-to-Markdown MCP Server

A standalone TypeScript service that receives a Deepwiki repository URL through Model Context Protocol (MCP), crawls every in-scope page, converts the sanitized HTML to Markdown, and returns either a single aggregated document or a page-structured array.

## Features

- **Domain Safety**: Only processes URLs from deepwiki.com domain
- **Scope Limitation**: Respects repository boundaries without crawling external resources
- **HTML Sanitization**: Removes headers, footers, navigation, scripts, and ads
- **Progress Streaming**: Provides real-time updates on crawl progress
- **Link Rewriting**: Converts repository links to work in Markdown format
- **Multiple Output Formats**: Choose between aggregated Markdown or structured page data
- **Error Handling**: Detailed error messages and partial success handling
- **Performance**: Fast processing with configurable concurrency and depth limits

## Installation

### From NPM

```bash
npm install mcp-deepwiki
```

Or with yarn:

```bash
yarn add mcp-deepwiki
```

### From Source

```bash
# Clone the repository
git clone https://github.com/regenrek/mcp-deepwiki.git
cd mcp-deepwiki

# Install dependencies
npm install

# Build the package
npm run build
```

## Usage

### CLI Usage

The MCP server can be run in three different transport modes:

```bash
# Run with stdio transport (default)
npx mcp-deepwiki

# Run with HTTP transport
npx mcp-deepwiki --http --port 3000

# Run with SSE transport
npx mcp-deepwiki --sse --port 3001
```

### Working with the MCP Server

#### Using the MCP Inspector

The easiest way to interact with the MCP server is using the MCP Inspector:

```bash
# In one terminal, start the server with HTTP transport
npm run dev-http

# In another terminal, or using a web browser, open the inspector
npx @modelcontextprotocol/inspector http://localhost:3000/mcp
```

The inspector provides a GUI for sending requests to the server and viewing responses.

#### Direct API Calls

For HTTP transport, you can make direct API calls:

```bash
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "id": "req-1",
    "action": "deepwiki_fetch",
    "params": {
      "url": "https://deepwiki.com/user/repo",
      "mode": "aggregate"
    }
  }'
```

### Integration with Large Language Models

This MCP server is designed to be used with LLMs that support the Model Context Protocol. For example, with Claude models:

```javascript
// Example using @anthropic-ai/sdk with MCP
import { Claude } from '@anthropic-ai/sdk'
import { McpClient } from '@modelcontextprotocol/client'

const claude = new Claude({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const mcpClient = new McpClient({
  url: 'http://localhost:3000/mcp', // Your MCP server URL
})

// Register the MCP client with Claude
claude.registerMcpClient(mcpClient)

// Now Claude can use the deepwiki_fetch tool
const response = await claude.messages.create({
  model: 'claude-3-sonnet-20240229',
  max_tokens: 1024,
  system: 'You have access to a tool that can fetch and convert Deepwiki content to Markdown.',
  messages: [
    {
      role: 'user',
      content: 'Please fetch the content from this Deepwiki repository: https://deepwiki.com/user/repo'
    }
  ]
})
```

### MCP Tool Integration

The package registers a tool named `deepwiki_fetch` that you can use with any MCP-compatible client:

```json
{
  "action": "deepwiki_fetch",
  "params": {
    "url": "https://deepwiki.com/user/repo",
    "mode": "aggregate"
  }
}
```

#### Parameters

- `url` (required): The starting URL of the Deepwiki repository
- `mode` (optional): Output mode, either "aggregate" for a single Markdown document (default) or "pages" for structured page data
- `maxDepth` (optional): Maximum depth of pages to crawl (default: 10)

### Response Format

#### Success Response (Aggregate Mode)

```json
{
  "status": "ok",
  "data": "# Page Title\n\nPage content...\n\n---\n\n# Another Page\n\nMore content...",
  "totalPages": 5,
  "totalBytes": 25000,
  "elapsedMs": 1200
}
```

#### Success Response (Pages Mode)

```json
{
  "status": "ok",
  "data": [
    {
      "path": "index",
      "markdown": "# Home Page\n\nWelcome to the repository."
    },
    {
      "path": "section/page1",
      "markdown": "# First Page\n\nThis is the first page content."
    }
  ],
  "totalPages": 2,
  "totalBytes": 12000,
  "elapsedMs": 800
}
```

#### Error Response

```json
{
  "status": "error",
  "code": "DOMAIN_NOT_ALLOWED",
  "message": "Only deepwiki.com domains are allowed"
}
```

#### Partial Success Response

```json
{
  "status": "partial",
  "data": "# Page Title\n\nPage content...",
  "errors": [
    {
      "url": "https://deepwiki.com/user/repo/page2",
      "reason": "HTTP error: 404"
    }
  ],
  "totalPages": 1,
  "totalBytes": 5000,
  "elapsedMs": 950
}
```

### Progress Events

When using the tool, you'll receive progress events during crawling:

```
Fetched https://deepwiki.com/user/repo: 12500 bytes in 450ms (status: 200)
Fetched https://deepwiki.com/user/repo/page1: 8750 bytes in 320ms (status: 200)
Fetched https://deepwiki.com/user/repo/page2: 6200 bytes in 280ms (status: 200)
```

## Configuration

### Environment Variables

- `DEEPWIKI_MAX_CONCURRENCY`: Maximum concurrent requests (default: 5)
- `DEEPWIKI_REQUEST_TIMEOUT`: Request timeout in milliseconds (default: 30000)
- `DEEPWIKI_MAX_RETRIES`: Maximum retry attempts for failed requests (default: 3)
- `DEEPWIKI_RETRY_DELAY`: Base delay for retry backoff in milliseconds (default: 250)

To configure these, create a `.env` file in the project root:

```
DEEPWIKI_MAX_CONCURRENCY=10
DEEPWIKI_REQUEST_TIMEOUT=60000
DEEPWIKI_MAX_RETRIES=5
DEEPWIKI_RETRY_DELAY=500
```

## Docker Deployment

Build and run the Docker image:

```bash
# Build the image
docker build -t mcp-deepwiki .

# Run with stdio transport (for development)
docker run -it --rm mcp-deepwiki

# Run with HTTP transport (for production)
docker run -d -p 3000:3000 mcp-deepwiki --http --port 3000

# Run with environment variables
docker run -d -p 3000:3000 \
  -e DEEPWIKI_MAX_CONCURRENCY=10 \
  -e DEEPWIKI_REQUEST_TIMEOUT=60000 \
  mcp-deepwiki --http --port 3000
```

## Development

```bash
# Install dependencies
npm install

# Run in development mode with stdio
npm run dev-stdio

# Run in development mode with HTTP
npm run dev-http

# Run in development mode with SSE
npm run dev-sse

# Run tests
npm test

# Run linter
npm run lint

# Build the package
npm run build
```

### Project Structure

```
src/
├── functions/         # Core functionality
│   ├── __tests__/     # Unit tests
│   ├── crawler.ts     # Website crawling logic
│   ├── converter.ts   # HTML to Markdown conversion
│   ├── types.ts       # TypeScript interfaces & schemas
│   └── utils.ts       # Utility functions
├── tools/             # MCP tool definitions
│   ├── deepwiki.ts    # Deepwiki fetch tool
│   └── mytool.ts      # Example tool
├── index.ts           # Main entry point
├── server.ts          # MCP server setup
└── types.ts           # Core type definitions
```

## Troubleshooting

### Common Issues

1. **Permission Denied**: If you get EACCES errors when running the CLI, make sure to make the binary executable:
   ```bash
   chmod +x ./node_modules/.bin/mcp-deepwiki
   ```

2. **Connection Refused**: Make sure the port is available and not blocked by a firewall:
   ```bash
   # Check if port is in use
   lsof -i :3000
   ```

3. **Timeout Errors**: For large repositories, consider increasing the timeout and concurrency:
   ```
   DEEPWIKI_REQUEST_TIMEOUT=60000 DEEPWIKI_MAX_CONCURRENCY=10 npx mcp-deepwiki
   ```

### Debugging

Enable debug logs by setting the environment variable:

```bash
DEBUG=mcp-deepwiki:* npx mcp-deepwiki
```

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## License

MIT
