# DeepWiki MCP - Refactored Architecture

This document describes the refactored architecture of deepwiki-mcp, which now uses Lightpanda as the primary renderer with Playwright as a fallback.

## Key Changes

### 1. Lightpanda Integration
- **Primary renderer**: Uses Lightpanda browser (≈60MB RAM, 100ms startup)
- **Automatic download**: Binary downloaded during `npm install`
- **CDP protocol**: Connects via Chrome DevTools Protocol using puppeteer-core

### 2. Playwright Fallback
- **Heavy fallback**: Automatically used when Lightpanda fails
- **Configurable**: Can be forced with `--heavy always` or disabled with `--heavy never`
- **Full compatibility**: Handles complex React Server Components

### 3. Single Binary Distribution
- **Bundle size**: ≈39MB total (22MB Node + 17MB Lightpanda)
- **Single file**: Can be distributed as a single executable
- **No dependencies**: All runtime dependencies bundled

### 4. JSON-Lines Protocol
- **Simple interface**: Send JSON requests, receive JSON responses
- **Concurrent**: Supports parallel processing with `--concurrency N`
- **Streaming**: Process multiple requests without restarting

## Installation

```bash
# Install dependencies and download Lightpanda
pnpm install

# Build the project
pnpm build

# Run tests
pnpm test
```

## Usage

### Basic Usage

```bash
# Start the service
node dist/cli.js

# Send a request (JSON format)
echo '{"id":"1","url":"https://deepwiki.com/vercel/ai","as":"markdown"}' | node dist/cli.js
```

### Command Line Options

- `--concurrency N`: Number of parallel requests (default: CPU/2)
- `--heavy [always|never|auto]`: Playwright fallback mode (default: auto)

### Environment Variables

- `LIGHTPANDA_PATH`: Override Lightpanda binary location
- `LIGHTPANDA_PORT`: Override CDP port (default: 9222)
- `CHROMIUM_PATH`: Custom Chromium path for Playwright
- `LIGHTPANDA_DISABLE_TELEMETRY`: Disable telemetry (default: true)
- `DEBUG`: Enable debug output including stack traces

## Architecture

```
┌─────────────┐     JSON Lines      ┌──────────────┐
│   Client    │ ←─────────────────→ │   CLI Loop   │
└─────────────┘                     └──────┬───────┘
                                           │
                                    ┌──────▼───────┐
                                    │ Render Engine│
                                    └──────┬───────┘
                                           │
                          ┌────────────────┴────────────────┐
                          │                                 │
                   ┌──────▼───────┐                ┌───────▼──────┐
                   │  Lightpanda  │                │  Playwright  │
                   │  (Primary)   │                │  (Fallback)  │
                   └──────────────┘                └──────────────┘
```

## Testing

### Unit Tests
```bash
pnpm test
```

### Smoke Tests (10 repos)
```bash
pnpm test:smoke
```

### Regression Tests (known tricky repos)
```bash
pnpm test:regression
```

### Nightly Tests (100 random repos)
```bash
node scripts/nightly-test.mjs
```

## Performance

- **Cold start**: ≈100ms (Lightpanda) vs ≈2s (Chromium)
- **Memory usage**: ≈120MB (Lightpanda) vs ≈500MB+ (Chromium)
- **Success rate**: >92% with Lightpanda, 99%+ with fallback
- **Concurrency**: Handles multiple requests in parallel

## Building a Single Executable

```bash
# Bundle with esbuild
node scripts/bundle.mjs

# Create single executable (Node 18.16+)
# 1. Create sea-config.json
# 2. Run: node --experimental-sea-config sea-config.json
# 3. Copy and inject: see Node.js SEA documentation
```

## CI/CD

GitHub Actions workflow included:
- Builds on Node 20 and 21
- Runs all tests
- Creates artifacts for distribution
- Nightly regression tests with 92% success threshold

## Migration from Previous Version

1. The stdio interface remains the same
2. New binary will be smaller and faster
3. Fallback ensures compatibility with all pages
4. No changes needed for existing integrations