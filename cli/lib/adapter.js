#!/usr/bin/env node

/**
 * MCP HTTP Adapter
 *
 * Wraps MCP STDIO servers with an HTTP interface for ChatGPT
 */

import Fastify from "fastify";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";

const app = Fastify({ logger: false });

// Configuration
const PORT = process.env.PORT || 3000;
const ALLOWED_DIR = process.env.ALLOWED_DIR || process.cwd();
const DEBUG = process.env.DEBUG === '1';

if (DEBUG) {
  console.log(`[CONFIG] Port: ${PORT}, Directory: ${ALLOWED_DIR}`);
}

// MCP Server state
let mcpProcess = null;
let isReady = false;
let requestCounter = 1;
const pendingRequests = new Map();
const sessionId = randomUUID();

// Start the filesystem MCP server
function startMCPServer() {
  if (DEBUG) {
    console.log(`Starting MCP server: npx -y @modelcontextprotocol/server-filesystem ${ALLOWED_DIR}`);
  }

  mcpProcess = spawn("npx", [
    "-y",
    "@modelcontextprotocol/server-filesystem",
    ALLOWED_DIR
  ], {
    stdio: ["pipe", "pipe", "pipe"],
    shell: true
  });

  // Handle STDOUT (JSON-RPC responses)
  mcpProcess.stdout.on("data", (data) => {
    const lines = data.toString().split("\n").filter(l => l.trim());

    for (const line of lines) {
      try {
        const response = JSON.parse(line);
        if (DEBUG) {
          console.log("← MCP:", line.substring(0, 150));
        }

        const id = response.id;
        if (id && pendingRequests.has(id)) {
          const { resolve } = pendingRequests.get(id);
          pendingRequests.delete(id);
          resolve(response);
        }
      } catch (err) {
        // Ignore non-JSON output
      }
    }
  });

  // Handle STDERR (logs)
  mcpProcess.stderr.on("data", (data) => {
    if (DEBUG) {
      console.log("MCP stderr:", data.toString().trim());
    }
  });

  // Handle process exit
  mcpProcess.on("exit", (code) => {
    if (DEBUG) {
      console.error(`MCP server exited with code ${code}`);
    }
    isReady = false;
  });

  // Handle spawn errors
  mcpProcess.on("error", (err) => {
    console.error(`Failed to start MCP server: ${err.message}`);
    isReady = false;
  });

  // Initialize the MCP server
  setTimeout(() => {
    sendToMCP({
      jsonrpc: "2.0",
      id: requestCounter++,
      method: "initialize",
      params: {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: {
          name: "mcp-bridge-cloud",
          version: "0.1.0"
        }
      }
    }).then(() => {
      isReady = true;
      if (DEBUG) {
        console.log("✓ MCP Server initialized");
      }
    }).catch(err => {
      console.error("Failed to initialize MCP server:", err.message);
    });
  }, 100);
}

// Send JSON-RPC message to STDIO MCP server
function sendToMCP(message) {
  return new Promise((resolve, reject) => {
    if (!mcpProcess || mcpProcess.killed) {
      return reject(new Error("MCP server not running"));
    }

    const id = message.id || requestCounter++;
    message.id = id;

    pendingRequests.set(id, { resolve, reject });

    const jsonMessage = JSON.stringify(message) + "\n";
    if (DEBUG) {
      console.log("→ MCP:", jsonMessage.substring(0, 150));
    }

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
        reject(new Error("Request timeout"));
      }
    }, 30000);
  });
}

// Health check
app.get("/healthz", async () => ({ ok: true, mcpReady: isReady }));

// Main MCP endpoint
const mcpHandler = async (req, reply) => {
  // Handle OPTIONS for CORS preflight
  if (req.method === "OPTIONS") {
    reply.header("Access-Control-Allow-Origin", "*");
    reply.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    reply.header("Access-Control-Allow-Headers", "*");
    reply.header("Access-Control-Expose-Headers", "Mcp-Session-Id");
    return reply.code(200).send();
  }

  if (!isReady) {
    return reply.code(503).send({
      error: "MCP server not ready"
    });
  }

  try {
    let jsonRpcRequest;

    if (req.method === "POST") {
      jsonRpcRequest = req.body;
    } else {
      // For GET requests, return tools/list
      jsonRpcRequest = {
        jsonrpc: "2.0",
        id: requestCounter++,
        method: "tools/list",
        params: {}
      };
    }

    // Forward request to MCP server
    const response = await sendToMCP({
      ...jsonRpcRequest,
      id: requestCounter++,
    });

    reply.header("Content-Type", "application/json");
    reply.header("Access-Control-Expose-Headers", "Mcp-Session-Id");
    reply.header("Mcp-Session-Id", sessionId);

    return reply.send({
      jsonrpc: "2.0",
      id: jsonRpcRequest.id,
      result: response.result,
      error: response.error
    });

  } catch (error) {
    console.error("Error handling MCP request:", error);
    return reply.code(500).send({
      jsonrpc: "2.0",
      id: req.body?.id || null,
      error: {
        code: -32603,
        message: error.message
      }
    });
  }
};

// Register routes
app.all("/", mcpHandler);
app.all("/mcp*", mcpHandler);

// CORS
app.addHook("onSend", async (_req, reply, payload) => {
  reply.header("Access-Control-Allow-Origin", "*");
  reply.header("Access-Control-Allow-Headers", "*");
  reply.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  return payload;
});

// Start everything
startMCPServer();

app.listen({ host: "0.0.0.0", port: PORT }).then(() => {
  console.log(`\n╔════════════════════════════════════════════════════════════╗`);
  console.log(`║  MCP Bridge Cloud - HTTP Adapter Running                  ║`);
  console.log(`╠════════════════════════════════════════════════════════════╣`);
  console.log(`║  HTTP Endpoint: http://0.0.0.0:${PORT.toString().padEnd(32)} ║`);
  console.log(`║  Directory: ${ALLOWED_DIR.substring(0, 44).padEnd(44)} ║`);
  console.log(`╚════════════════════════════════════════════════════════════╝\n`);
}).catch((err) => {
  console.error('Failed to start HTTP server:', err);
  process.exit(1);
});
