// stdio-adapter/adapter.js
// Bridges STDIO MCP servers to HTTP for ChatGPT compatibility

import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import Fastify from "fastify";
import { Readable } from "node:stream";

const PORT = process.env.ADAPTER_PORT || 3000;
const HOST = "127.0.0.1";

// MCP server configuration
const MCP_SERVER_COMMAND = process.env.MCP_SERVER_COMMAND || "npx";
const MCP_SERVER_ARGS = process.env.MCP_SERVER_ARGS
  ? process.env.MCP_SERVER_ARGS.split(" ")
  : ["-y", "@modelcontextprotocol/server-filesystem", process.cwd()];

const app = Fastify({
  logger: true,
  bodyLimit: 50 * 1024 * 1024,
});

// Enable JSON parsing
app.addContentTypeParser('application/json', { parseAs: 'string' }, async (_req, body) => {
  try {
    return JSON.parse(body);
  } catch (err) {
    throw new Error('Invalid JSON');
  }
});

// Store the MCP server process
let mcpProcess = null;
let isReady = false;
const messageQueue = [];
let requestCounter = 0;
const pendingRequests = new Map();

// Start the STDIO MCP server
function startMCPServer() {
  const argsDisplay = MCP_SERVER_ARGS.join(" ");
  console.log(`Starting MCP server: ${MCP_SERVER_COMMAND} ${argsDisplay}`);

  mcpProcess = spawn(MCP_SERVER_COMMAND, MCP_SERVER_ARGS, {
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  // Handle stdout (responses from MCP server)
  let buffer = '';
  mcpProcess.stdout.on('data', (data) => {
    buffer += data.toString();

    // Process complete JSON-RPC messages
    const lines = buffer.split('\n');
    buffer = lines.pop(); // Keep incomplete line in buffer

    for (const line of lines) {
      if (line.trim()) {
        try {
          const message = JSON.parse(line);
          console.log('← MCP Server:', JSON.stringify(message).substring(0, 200));

          // Match response to pending request
          if (message.id !== undefined && pendingRequests.has(message.id)) {
            const { resolve } = pendingRequests.get(message.id);
            pendingRequests.delete(message.id);
            resolve(message);
          }
        } catch (err) {
          console.error('Failed to parse MCP response:', line, err);
        }
      }
    }
  });

  mcpProcess.stderr.on('data', (data) => {
    console.error('MCP Server stderr:', data.toString());
  });

  mcpProcess.on('error', (err) => {
    console.error('MCP Server error:', err);
    isReady = false;
  });

  mcpProcess.on('exit', (code) => {
    console.log(`MCP Server exited with code ${code}`);
    isReady = false;
    mcpProcess = null;
  });

  // Initialize the MCP server
  setTimeout(() => {
    sendToMCP({
      jsonrpc: "2.0",
      id: requestCounter++,
      method: "initialize",
      params: {
        protocolVersion: "2025-06-18",
        capabilities: {},
        clientInfo: {
          name: "chatgpt-local-tools",
          version: "1.0.0"
        }
      }
    }).then(() => {
      isReady = true;
      console.log('✓ MCP Server initialized and ready');
    });
  }, 100);
}

// Send JSON-RPC message to STDIO MCP server
function sendToMCP(message) {
  return new Promise((resolve, reject) => {
    if (!mcpProcess || mcpProcess.killed) {
      return reject(new Error('MCP server not running'));
    }

    const id = message.id || requestCounter++;
    message.id = id;

    pendingRequests.set(id, { resolve, reject });

    const jsonMessage = JSON.stringify(message) + '\n';
    console.log('→ MCP Server:', jsonMessage.substring(0, 200));

    mcpProcess.stdin.write(jsonMessage, (err) => {
      if (err) {
        pendingRequests.delete(id);
        reject(err);
      }
    });

    // Timeout after 30 seconds
    setTimeout(() => {
      if (pendingRequests.has(id)) {
        pendingRequests.delete(id);
        reject(new Error('Request timeout'));
      }
    }, 30000);
  });
}

// Health check
app.get("/healthz", async () => ({ ok: true, mcpReady: isReady }));

// Session ID for MCP (required by spec)
const sessionId = randomUUID();

// Main MCP endpoint - handle all MCP requests
app.all("/mcp*", async (req, reply) => {
  if (!isReady) {
    return reply.code(503).send({
      error: "MCP server not ready"
    });
  }

  try {
    // Parse the JSON-RPC request
    let jsonRpcRequest;

    if (req.method === "POST") {
      jsonRpcRequest = req.body;
    } else {
      // For GET requests, might need to handle differently
      // Most MCP uses POST, but we'll support GET for discovery
      jsonRpcRequest = {
        jsonrpc: "2.0",
        id: requestCounter++,
        method: "tools/list",
        params: {}
      };
    }

    // Forward to MCP server via STDIO
    const response = await sendToMCP(jsonRpcRequest);

    // Set required MCP headers
    reply.header('Content-Type', 'application/json');

    // CORS headers to expose MCP headers to ChatGPT
    reply.header('Access-Control-Expose-Headers', 'Mcp-Session-Id');

    // Add session ID header for initialize responses (required by MCP spec)
    if (jsonRpcRequest.method === 'initialize') {
      reply.header('Mcp-Session-Id', sessionId);
    }

    return reply.send(response);

  } catch (error) {
    console.error('Error handling MCP request:', error);
    return reply.code(500).send({
      jsonrpc: "2.0",
      id: req.body?.id || null,
      error: {
        code: -32603,
        message: error.message
      }
    });
  }
});

// Graceful shutdown
const shutdown = async () => {
  console.log('\nShutting down...');
  if (mcpProcess) {
    mcpProcess.kill();
  }
  await app.close();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Start everything
startMCPServer();

const argsDisplay = MCP_SERVER_ARGS.join(" ");
app.listen({ host: HOST, port: PORT }).then(() => {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║  STDIO-to-HTTP Adapter Running                                  ║
╠════════════════════════════════════════════════════════════════╣
║  HTTP Endpoint: http://${HOST}:${PORT}/mcp                    ║
║  MCP Server: ${MCP_SERVER_COMMAND} ${argsDisplay.substring(0, 30)}... ║
║  Status: Initializing...                                        ║
╚════════════════════════════════════════════════════════════════╝
  `);
}).catch((err) => {
  console.error('Failed to start adapter:', err);
  process.exit(1);
});
