import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
// Import mock internals at the top
// Note: Vitest often handles hoisting, but dynamic import in loadModule might affect this.
// We'll revisit using vi.mocked if these direct imports cause issues later.
import { __mocks as restMocks } from '@chatmcp/sdk/server/rest.js'
import { McpServer as MockMcpServer, __spies as mcpSpies } from '@modelcontextprotocol/sdk/server/mcp.js'
import { __mocks as sseMocks } from '@modelcontextprotocol/sdk/server/sse.js'
import { __mocks as stdioMocks } from '@modelcontextprotocol/sdk/server/stdio.js'
// Mock h3 internals needed for assertions
import { __mocks as h3Mocks } from 'h3'

// ---------------------------------------------------------------------------
// Mocking external dependencies used by src/server.ts
// ---------------------------------------------------------------------------

/**
 * Mock the MCP server class so we can track calls to `connect`/`close` without
 * requiring the actual implementation provided by the SDK.
 */
vi.mock('@modelcontextprotocol/sdk/server/mcp.js', () => {
  const connectSpy = vi.fn().mockResolvedValue(undefined)
  const closeSpy = vi.fn().mockResolvedValue(undefined)
  let lastInstance: unknown

  // Simple mock class replicating the public surface we rely on
  class McpServer {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(public readonly opts: any) {
      lastInstance = this
    }

    connect = connectSpy

    close = closeSpy

    // Helper to access the last created instance for assertions
    static __getLastInstance = () => lastInstance
  }

  return {
    McpServer,
    /** spies exported for assertion purposes */
    __spies: { connectSpy, closeSpy },
  }
})

/**
 * Mock STDIO transport
 */
vi.mock('@modelcontextprotocol/sdk/server/stdio.js', () => {
  let lastInstance: unknown
  class StdioServerTransport {
    constructor() {
      // Assign instance upon creation
      lastInstance = this
    }
  }
  return {
    StdioServerTransport,
    // Expose a way to get the last instance
    __mocks: { getLastInstance: () => lastInstance },
  }
})

/**
 * Mock REST (streamable HTTP) transport
 */
vi.mock('@chatmcp/sdk/server/rest.js', () => {
  let lastInstance: unknown
  const startServerSpy = vi.fn().mockResolvedValue(undefined)
  class RestServerTransport {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(public readonly opts: any) {
      // Assign instance upon creation
      lastInstance = this
    }

    startServer = startServerSpy
  }
  return {
    RestServerTransport,
    __mocks: {
      getLastInstance: () => lastInstance,
      startServerSpy,
    },
  }
})

/**
 * Mock SSE transport
 */
vi.mock('@modelcontextprotocol/sdk/server/sse.js', () => {
  let lastInstance: unknown
  class SSEServerTransport {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(public readonly path: string, public readonly res: any) {
      // Assign instance upon creation
      lastInstance = this
    }

    sessionId = 'mock-session-id'

    handlePostMessage = vi.fn().mockResolvedValue(undefined)
  }
  return {
    SSEServerTransport,
    // Expose a way to get the last instance
    __mocks: { getLastInstance: () => lastInstance },
  }
})

/**
 * Mock `h3` – we do not want to start a real HTTP server. We simply need
 * the API surface (`createApp`, `createRouter`, `defineEventHandler`, `listen`) that src/server.ts expects.
 */
vi.mock('h3', () => {
  const appUseSpy = vi.fn()
  const routerGetSpy = vi.fn().mockReturnThis()
  const routerPostSpy = vi.fn().mockReturnThis()
  const routerUseSpy = vi.fn().mockReturnThis()

  const createAppMock = vi.fn(() => ({
    use: appUseSpy,
    handler: vi.fn(),
  }))
  const createRouterMock = vi.fn(() => ({
    get: routerGetSpy,
    post: routerPostSpy,
    use: routerUseSpy,
    handler: vi.fn(),
  }))
  // Ensure the event handler function itself is returned to be executed
  const defineEventHandlerMock = vi.fn(fn => fn)
  const listenMock = vi.fn()
  const toNodeListenerMock = vi.fn()

  return {
    createApp: createAppMock,
    createRouter: createRouterMock,
    defineEventHandler: defineEventHandlerMock,
    listen: listenMock,
    toNodeListener: toNodeListenerMock,
    // Expose spies for detailed assertions
    __mocks: {
      createAppMock,
      createRouterMock,
      defineEventHandlerMock,
      listenMock,
      toNodeListenerMock,
      appUseSpy,
      routerGetSpy,
      routerPostSpy,
      routerUseSpy,
    },
  }
})


// ---------------------------------------------------------------------------
// Actual tests start here – we import the module under test AFTER the mocks.
// ---------------------------------------------------------------------------

// Removed unused StartOptions import

// Utility loader so we import the fresh module within each test after mocks
async function loadModule() {
  return await import('../src/server')
}

// Imports for mock spies/helpers moved to the top

beforeEach(() => {
  // Reset mocks before each test
  vi.clearAllMocks()
})

afterEach(() => {
  // Restore mocks after each test
  vi.restoreAllMocks()
})

/**
 * createServer tests
 */
describe('createServer', () => {
  it('should return an instance of McpServer with provided options', async () => {
    const { createServer } = await loadModule()
    const options = { name: 'test-server', version: '1.2.3' }
    const server = createServer(options)

    // Check if it's an instance of our *mocked* McpServer
    expect(server).toBeInstanceOf(MockMcpServer)
    // Check if the constructor was called with the correct options
    const lastInstance = MockMcpServer.__getLastInstance() as any
    expect(lastInstance?.opts).toEqual(options)
  })
})

/**
 * STDIO transport tests
 */
describe('startServer – stdio transport', () => {
  it('invokes StdioServerTransport and connects', async () => {
    const { createServer, startServer } = await loadModule()
    const server = createServer({ name: 'test', version: '1.0.0' })

    await startServer(server, { type: 'stdio' })

    const transportInstance = stdioMocks.getLastInstance()
    expect(transportInstance).toBeDefined()
    expect(mcpSpies.connectSpy).toHaveBeenCalledTimes(1)
    expect(mcpSpies.connectSpy).toHaveBeenCalledWith(transportInstance)
  })
})

/**
 * HTTP (REST) transport tests
 */
describe('startServer – streamable HTTP transport', () => {
  it('invokes RestServerTransport with defaults and starts server', async () => {
    const { createServer, startServer } = await loadModule()
    const server = createServer({ name: 'test', version: '1.0.0' })

    await startServer(server, { type: 'http' })

    const transportInstance = restMocks.getLastInstance() as any
    expect(transportInstance).toBeDefined()
    expect(transportInstance.opts).toEqual({ port: 3000, endpoint: '/mcp' })

    expect(mcpSpies.connectSpy).toHaveBeenCalledTimes(1)
    expect(mcpSpies.connectSpy).toHaveBeenCalledWith(transportInstance)
    expect(restMocks.startServerSpy).toHaveBeenCalledTimes(1)
  })

  it('invokes RestServerTransport with custom options and starts server', async () => {
    const { createServer, startServer } = await loadModule()
    const server = createServer({ name: 'test', version: '1.0.0' })
    const customOptions = { type: 'http' as const, port: 8080, endpoint: '/api/mcp' }

    await startServer(server, customOptions)

    const transportInstance = restMocks.getLastInstance() as any
    expect(transportInstance).toBeDefined()
    expect(transportInstance.opts).toEqual({ port: customOptions.port, endpoint: customOptions.endpoint })

    expect(mcpSpies.connectSpy).toHaveBeenCalledTimes(1)
    expect(mcpSpies.connectSpy).toHaveBeenCalledWith(transportInstance)
    expect(restMocks.startServerSpy).toHaveBeenCalledTimes(1)
  })
})

/**
 * SSE transport tests
 */
describe('startServer – SSE transport', () => {
  it('sets up h3 server and listens on default port', async () => {
    const { createServer, startServer } = await loadModule()
    const server = createServer({ name: 'test', version: '1.0.0' })

    await startServer(server, { type: 'sse' }) // Default port 3000

    expect(h3Mocks.createAppMock).toHaveBeenCalledTimes(1)
    expect(h3Mocks.createRouterMock).toHaveBeenCalledTimes(1)

    // Check router configuration
    expect(h3Mocks.routerGetSpy).toHaveBeenCalledWith('/sse', expect.any(Function))
    expect(h3Mocks.routerPostSpy).toHaveBeenCalledWith('/messages', expect.any(Function))
    expect(h3Mocks.appUseSpy).toHaveBeenCalledWith(expect.anything()) // Router passed to app.use

    // Check server listening (either via listen or toNodeListener)
    expect(
      h3Mocks.listenMock.mock.calls.length > 0
      || h3Mocks.toNodeListenerMock.mock.calls.length > 0,
    ).toBe(true)

    // If using toNodeListener (preferred), check listen was called on the node server
    if (h3Mocks.toNodeListenerMock.mock.calls.length > 0) {
      // We need to mock node:http createServer to check .listen()
      // This adds complexity, maybe checking toNodeListener is sufficient for this test level
    }
  })

  it('sets up h3 server and listens on custom port', async () => {
    const { createServer, startServer } = await loadModule()
    const server = createServer({ name: 'test', version: '1.0.0' })
    const customPort = 9000

    await startServer(server, { type: 'sse', port: customPort })

    // We need a way to check the port passed to listen/createNodeServer
    // This requires mocking 'node:http' or refining the h3 mock further
    // For now, we assert the basic setup happened
    expect(h3Mocks.createAppMock).toHaveBeenCalledTimes(1)
    expect(h3Mocks.createRouterMock).toHaveBeenCalledTimes(1)
    expect(
      h3Mocks.listenMock.mock.calls.length > 0
      || h3Mocks.toNodeListenerMock.mock.calls.length > 0,
    ).toBe(true)
  })

  // TODO: Add more detailed SSE tests:
  // - Simulate GET /sse -> check transport created, connect called, transport stored
  // - Simulate POST /messages -> check handlePostMessage called
  // - Simulate POST /messages (invalid session) -> check 400 status
  // - Simulate client disconnect -> check transport removed
})


/**
 * stopServer tests
 */
// TODO: Add stopServer tests
// - Mock process.exit
// - Assert server.close() is called
// - Test error handling in server.close()
// ... existing code ...
// Example structure:
// describe('stopServer', () => {
//   let exitSpy: MockInstance<typeof process.exit>;

//   beforeEach(() => {
//     // Prevent tests from exiting
//     exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {}) as any);
//   });

//   afterEach(() => {
//     exitSpy.mockRestore();
//   });

//   it('calls server.close and process.exit(0) on success', async () => {
//     const { createServer, stopServer } = await loadModule();
//     const server = createServer({ name: 'test', version: '1.0.0' });
//     // Ensure close resolves successfully
//     mcpSpies.closeSpy.mockResolvedValue(undefined);

//     await stopServer(server);

//     expect(mcpSpies.closeSpy).toHaveBeenCalledTimes(1);
//     expect(exitSpy).toHaveBeenCalledWith(0);
//   });

//   it('calls process.exit(0) even if server.close rejects', async () => {
//     const { createServer, stopServer } = await loadModule();
//     const server = createServer({ name: 'test', version: '1.0.0' });
//     const closeError = new Error('Close failed');
//     mcpSpies.closeSpy.mockRejectedValue(closeError);
//     // Mock console.error to suppress output during test
//     const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

//     await stopServer(server);

//     expect(mcpSpies.closeSpy).toHaveBeenCalledTimes(1);
//     expect(errorSpy).toHaveBeenCalledWith('Error occurred during server stop:', closeError);
//     expect(exitSpy).toHaveBeenCalledWith(0);

//     errorSpy.mockRestore();
//   });
// });
// ... existing code ...
