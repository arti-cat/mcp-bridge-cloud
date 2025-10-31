// chatgpt-adapter.js
// ChatGPT-compatible MCP adapter that wraps filesystem MCP
// Provides 'search' and 'fetch' tools in the format ChatGPT expects

import Fastify from "fastify";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";

const app = Fastify({ logger: true });

// Configuration
const PORT = process.env.PORT || 3000;
const ALLOWED_DIR = process.env.ALLOWED_DIR || "/home/bch/bch-proxy";

// MCP Server state
let mcpProcess = null;
let isReady = false;
let requestCounter = 1;
const pendingRequests = new Map();
const sessionId = randomUUID();

// Start the filesystem MCP server
function startMCPServer() {
  console.log(`Starting MCP server: npx -y @modelcontextprotocol/server-filesystem ${ALLOWED_DIR}`);

  mcpProcess = spawn("npx", [
    "-y",
    "@modelcontextprotocol/server-filesystem",
    ALLOWED_DIR
  ], {
    stdio: ["pipe", "pipe", "pipe"]
  });

  // Handle STDOUT (JSON-RPC responses)
  mcpProcess.stdout.on("data", (data) => {
    const lines = data.toString().split("\n").filter(l => l.trim());

    for (const line of lines) {
      try {
        const response = JSON.parse(line);
        console.log("← MCP Server:", line.substring(0, 200));

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
    console.log("MCP Server stderr:", data.toString().trim());
  });

  // Handle process exit
  mcpProcess.on("exit", (code) => {
    console.log(`MCP server exited with code ${code}`);
    isReady = false;
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
          name: "chatgpt-filesystem-adapter",
          version: "1.0.0"
        }
      }
    }).then(() => {
      isReady = true;
      console.log("✓ MCP Server initialized and ready");
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
    console.log("→ MCP Server:", jsonMessage.substring(0, 200));

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

// ChatGPT-compatible search tool
async function searchFiles(query) {
  if (!query || !query.trim()) {
    return { results: [] };
  }

  // Use search_files tool from filesystem MCP
  const response = await sendToMCP({
    jsonrpc: "2.0",
    id: requestCounter++,
    method: "tools/call",
    params: {
      name: "search_files",
      arguments: {
        path: ALLOWED_DIR,
        pattern: query,
        excludePatterns: ["node_modules", ".git", "*.log"]
      }
    }
  });

  if (response.error) {
    console.error("Search error:", response.error);
    return { results: [] };
  }

  // Transform filesystem results to ChatGPT format
  const files = response.result?.content?.[0]?.text || "";
  const filePaths = files.split("\n").filter(f => f.trim());

  const results = [];
  for (let i = 0; i < Math.min(filePaths.length, 10); i++) {
    const filePath = filePaths[i].trim();
    if (!filePath) continue;

    const fileName = filePath.split("/").pop();
    results.push({
      id: filePath,
      title: fileName,
      text: `File: ${filePath}`,
      url: `file://${filePath}`
    });
  }

  console.log(`Search for "${query}" returned ${results.length} results`);
  return { results };
}

// ChatGPT-compatible fetch tool
async function fetchFile(id) {
  // Use read_text_file tool from filesystem MCP
  const response = await sendToMCP({
    jsonrpc: "2.0",
    id: requestCounter++,
    method: "tools/call",
    params: {
      name: "read_text_file",
      arguments: {
        path: id
      }
    }
  });

  if (response.error) {
    throw new Error(`File not found: ${id}`);
  }

  const content = response.result?.content?.[0]?.text || "";

  return {
    id,
    title: id.split("/").pop(),
    text: content,
    url: `file://${id}`,
    metadata: {
      path: id,
      size: content.length
    }
  };
}

// ChatGPT-compatible list tool
async function listDirectory(path) {
  // Use list_directory tool from filesystem MCP
  const response = await sendToMCP({
    jsonrpc: "2.0",
    id: requestCounter++,
    method: "tools/call",
    params: {
      name: "list_directory",
      arguments: {
        path: path || ALLOWED_DIR
      }
    }
  });

  if (response.error) {
    throw new Error(`Directory not found: ${path}`);
  }

  const listing = response.result?.content?.[0]?.text || "";
  const entries = listing.split("\n").filter(e => e.trim());

  const results = [];
  for (let i = 0; i < Math.min(entries.length, 50); i++) {
    const entry = entries[i].trim();
    if (!entry) continue;

    const isDir = entry.startsWith("[DIR]");
    const name = entry.replace(/^\[(DIR|FILE)\]\s*/, "");

    const fullPath = `${path}/${name}`.replace(/\/+/g, "/");

    results.push({
      id: fullPath,
      title: name,
      text: isDir ? `Directory: ${name}` : `File: ${name}`,
      url: `file://${fullPath}`,
      metadata: {
        type: isDir ? "directory" : "file",
        path: fullPath
      }
    });
  }

  console.log(`Listed directory "${path}" with ${results.length} entries`);
  return { results };
}

// ChatGPT-compatible write tool
async function writeFile(path, content) {
  // Use write_file tool from filesystem MCP
  const response = await sendToMCP({
    jsonrpc: "2.0",
    id: requestCounter++,
    method: "tools/call",
    params: {
      name: "write_file",
      arguments: {
        path,
        content
      }
    }
  });

  if (response.error) {
    throw new Error(`Failed to write file: ${response.error.message}`);
  }

  console.log(`Wrote file: ${path} (${content.length} bytes)`);

  return {
    success: true,
    id: path,
    message: `Successfully wrote ${content.length} bytes to ${path}`,
    metadata: {
      path,
      size: content.length
    }
  };
}

// Main MCP endpoint - handle ChatGPT requests (both / and /mcp*)
const mcpHandler = async (req, reply) => {
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

    // Handle initialize
    if (jsonRpcRequest.method === "initialize") {
      const response = {
        jsonrpc: "2.0",
        id: jsonRpcRequest.id,
        result: {
          protocolVersion: jsonRpcRequest.params.protocolVersion || "2025-03-26",
          capabilities: {
            tools: {}
          },
          serverInfo: {
            name: "chatgpt-filesystem-adapter",
            version: "1.0.0"
          },
          instructions: "Use 'search' to find files, 'list' to browse directories, 'fetch' to read files, and 'write' to create/modify files."
        }
      };

      reply.header("Content-Type", "application/json");
      reply.header("Access-Control-Expose-Headers", "Mcp-Session-Id");
      reply.header("Mcp-Session-Id", sessionId);

      return reply.send(response);
    }

    // Handle tools/list
    if (jsonRpcRequest.method === "tools/list") {
      const response = {
        jsonrpc: "2.0",
        id: jsonRpcRequest.id,
        result: {
          tools: [
            {
              name: "search",
              description: "Search for files by name pattern in the allowed directory. Returns a list of matching files with basic information.",
              inputSchema: {
                type: "object",
                properties: {
                  query: {
                    type: "string",
                    description: "Search pattern (file name or partial name)"
                  }
                },
                required: ["query"]
              }
            },
            {
              name: "fetch",
              description: "Retrieve complete file contents by file path. Use this after finding files with the search tool.",
              inputSchema: {
                type: "object",
                properties: {
                  id: {
                    type: "string",
                    description: "File path from search results"
                  }
                },
                required: ["id"]
              }
            },
            {
              name: "list",
              description: "List all files and directories in a given path. Shows detailed information about each entry including type (file/directory).",
              inputSchema: {
                type: "object",
                properties: {
                  path: {
                    type: "string",
                    description: "Directory path to list contents from"
                  }
                },
                required: ["path"]
              }
            },
            {
              name: "write",
              description: "Create a new file or overwrite an existing file with the provided content. Use with caution as it will overwrite existing files without warning.",
              inputSchema: {
                type: "object",
                properties: {
                  path: {
                    type: "string",
                    description: "Full file path where content should be written"
                  },
                  content: {
                    type: "string",
                    description: "Content to write to the file"
                  }
                },
                required: ["path", "content"]
              }
            }
          ]
        }
      };

      reply.header("Content-Type", "application/json");
      reply.header("Access-Control-Expose-Headers", "Mcp-Session-Id");

      return reply.send(response);
    }

    // Handle tools/call
    if (jsonRpcRequest.method === "tools/call") {
      const toolName = jsonRpcRequest.params.name;
      const args = jsonRpcRequest.params.arguments;

      let result;
      if (toolName === "search") {
        result = await searchFiles(args.query);
      } else if (toolName === "fetch") {
        result = await fetchFile(args.id);
      } else if (toolName === "list") {
        result = await listDirectory(args.path);
      } else if (toolName === "write") {
        result = await writeFile(args.path, args.content);
      } else {
        return reply.code(400).send({
          jsonrpc: "2.0",
          id: jsonRpcRequest.id,
          error: {
            code: -32601,
            message: `Unknown tool: ${toolName}`
          }
        });
      }

      const response = {
        jsonrpc: "2.0",
        id: jsonRpcRequest.id,
        result: {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2)
            }
          ]
        }
      };

      reply.header("Content-Type", "application/json");
      reply.header("Access-Control-Expose-Headers", "Mcp-Session-Id");

      return reply.send(response);
    }

    // Unknown method - forward to MCP server
    const response = await sendToMCP(jsonRpcRequest);
    reply.header("Content-Type", "application/json");
    reply.header("Access-Control-Expose-Headers", "Mcp-Session-Id");

    return reply.send(response);

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

// Register routes for both / and /mcp*
app.all("/", mcpHandler);
app.all("/mcp*", mcpHandler);

// CORS
app.addHook("onSend", async (_req, reply, payload) => {
  reply.header("Access-Control-Allow-Origin", "*");
  reply.header("Access-Control-Allow-Headers", "*");
  reply.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  return payload;
});

// Start server
startMCPServer();

app.listen({ host: "0.0.0.0", port: PORT }).then(() => {
  console.log(`\n╔════════════════════════════════════════════════════════════════╗`);
  console.log(`║  ChatGPT Filesystem Adapter Running                            ║`);
  console.log(`╠════════════════════════════════════════════════════════════════╣`);
  console.log(`║  HTTP Endpoint: http://0.0.0.0:${PORT}/mcp                     ║`);
  console.log(`║  Tools: search, fetch, write, list*                            ║`);
  console.log(`║  *list blocked by ChatGPT moderation, others work              ║`);
  console.log(`║  Allowed Directory: ${ALLOWED_DIR}                            ║`);
  console.log(`╚════════════════════════════════════════════════════════════════╝\n`);
}).catch((err) => {
  console.error(err);
  process.exit(1);
});
