# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**MCP Bridge Cloud** - Persistent tunnel service providing stable HTTPS URLs for local Model Context Protocol (MCP) servers.

**Problem**: Temporary tunnels (Cloudflare, ngrok) change URLs on restart → users must reconfigure ChatGPT constantly.
**Solution**: Persistent subdomains (e.g., `https://username.mcp-bridge.xyz`) that never change, using WebSocket relay architecture.

**This repo contains public-facing components:**

- `cli/` - Command-line tool (published as `mcp-bridge-cloud`)
- `client/` - WebSocket client library (published as `mcp-bridge-cloud-client`)
- `dashboard/` - User account management UI (Svelte + Supabase)

**Server infrastructure:**

- Lives in separate **private** repository: `mcp-bridge-cloud-server`
- May exist locally in `server/` directory (git-ignored in this repo)
- Remote: <https://github.com/arti-cat/mcp-bridge-cloud-server> (private)

## Architecture Flow

```text
ChatGPT/LLM
    ↓ HTTPS Request
https://username.mcp-bridge.xyz
    ↓
Cloud Server (Fly.io)
├── Routing Layer (subdomain extraction)
├── WebSocket Relay (tunnel management)
└── Database (Supabase - user/tunnel tracking)
    ↓ WebSocket Tunnel
Local Machine
├── CloudConnector (WebSocket client)
├── HTTP Adapter (Fastify, port 3000)
└── MCP Server (STDIO - filesystem/database/etc.)
```

**Key insight**: The cloud server acts as a WebSocket relay that routes HTTP requests based on subdomain to the appropriate connected client, which then proxies to a local MCP server.

## Repository Structure

### Dual Repository Pattern

This project uses a **public/private split**:

1. **Public repo** (`mcp-bridge-cloud`): User-facing tools, client library, dashboard
2. **Private repo** (`mcp-bridge-cloud-server`): Server infrastructure, routing, database

**Why split?**
- Public: Open-source client tools encourage adoption
- Private: Server code contains business logic and infrastructure secrets

**Local development setup:**
```bash
# Directory structure for local development:
/home/bch/00_mcp_bridge_dev/
├── mcp-bridge-cloud/           # This repo (public)
│   ├── cli/
│   ├── client/
│   ├── dashboard/
│   └── server/                  # Git-ignored (local copy of private repo)
└── mcp-bridge-cloud-server/    # Private repo (optional separate clone)
```

## Code Structure

### `cli/` - Command Line Interface

```text
bin/mcp-bridge-cloud.js    # Entry point, arg parsing, spawns MCP server
lib/adapter.js              # HTTP-to-STDIO adapter (Fastify server)
package.json                # v0.1.0, depends on mcp-bridge-cloud-client
```

**How it works:**
1. User runs `mcp-bridge-cloud --api-key <key>`
2. CLI spawns local MCP filesystem server via `npx @modelcontextprotocol/server-filesystem`
3. Starts HTTP adapter (Fastify) on port 3000 (configurable)
4. Connects to cloud via `CloudConnector` (WebSocket client)
5. Displays persistent URL: `https://username.mcp-bridge.xyz`

**Key dependencies:**
- `mcp-bridge-cloud-client`: WebSocket client (from `client/`)
- `fastify`: HTTP server for adapter
- `kill-port`: Clean up port before starting

### `client/` - WebSocket Client Library

```text
lib/cloud-connector.js      # Main CloudConnector class
test-connection.js          # Connection test script
package.json                # v0.1.1, minimal deps (ws only)
```

**CloudConnector class:**
```javascript
import { CloudConnector } from 'mcp-bridge-cloud-client';

const client = new CloudConnector({
  apiKey: '...',           // 64-char hex string from dashboard
  tunnelUrl: 'wss://...',  // Default: wss://mcp-bridge.xyz/tunnel
  localPort: 3000,         // Where HTTP adapter listens
  debug: false             // Verbose logging
});

const { url, subdomain } = await client.connect();
// url: 'https://username.mcp-bridge.xyz'
// subdomain: 'username'

client.disconnect();
```

**Connection management:**
- Auto-reconnect with exponential backoff (1s → 32s max, up to 10 attempts)
- Heartbeat every 30s (ping/pong)
- Request/response correlation via unique `requestId`
- 30s timeout per HTTP request

### `dashboard/` - User Dashboard

```text
src/App.svelte              # Root component with client-side routing
src/routes/                 # Login, Signup, Dashboard pages
src/components/             # TunnelStatus, ApiKeyDisplay, UsageMetrics
src/lib/supabaseClient.js   # Supabase auth + database client
public/                     # Static assets
vite.config.js              # Proxy /api/* to localhost:8080
```

**Tech stack:**
- Svelte 4 + Vite 5
- Supabase (auth + database)
- Tailwind CSS (styling)

**Routes:**
- `/login` - User login
- `/signup` - Account creation (validates subdomain, generates API key)
- `/dashboard` - Account info, tunnel status, usage metrics
- `/forgot-password`, `/reset-password` - Password recovery

### `server/` - Server Infrastructure (Private Repo)

```text
src/index.js                # Fastify server, API routes, static file serving
src/tunnel-relay.js         # WebSocket server (/tunnel endpoint)
src/routing.js              # HTTP routing by subdomain
src/db.js                   # Supabase database operations
src/api-routes.js           # REST API for dashboard
fly.toml                    # Fly.io deployment config
Dockerfile                  # Multi-stage: build dashboard + server
```

**Server responsibilities:**
1. **Routing** - Extract subdomain from hostname, route to correct WebSocket tunnel
2. **Tunnel management** - One WebSocket connection per subdomain, heartbeat monitoring
3. **Database** - User/tunnel status tracking, request count, API key validation
4. **API** - Dashboard endpoints (signup, account, metrics, regenerate key)

**Key patterns:**
- Subdomain extraction: `username.mcp-bridge.xyz` → `username`
- One connection per subdomain (new connection closes existing)
- Session ID persists across reconnections
- Async request count increment (non-blocking)

## Development Commands

### CLI Tool

```bash
cd cli

# Install dependencies
npm install

# Link globally for testing
npm link

# Test CLI locally
mcp-bridge-cloud --help
mcp-bridge-cloud --api-key <test-key> --debug

# Unlink when done
npm unlink -g mcp-bridge-cloud

# Publish to npm (requires auth)
npm publish
```

### Client Library

```bash
cd client

# Install dependencies
npm install

# Test connection (requires valid API key)
MCP_API_KEY=<your-key> node test-connection.js

# Expected output:
# ✅ CONNECTED!
# URL: https://yourname.mcp-bridge.xyz

# Publish to npm
npm publish
```

### Dashboard

```bash
cd dashboard

# Install dependencies
npm install

# Start dev server (localhost:5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Environment setup
# Create .env file:
echo "VITE_SUPABASE_URL=https://xxx.supabase.co" > .env
echo "VITE_SUPABASE_ANON_KEY=xxx" >> .env
```

### Server (if available locally)

```bash
cd server  # Or ../mcp-bridge-cloud-server

# Install dependencies
npm install

# Start dev server with watch mode
npm run dev

# Start production server
npm start

# Environment setup
# Create .env file:
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_KEY=xxx  # Service role for admin operations
PORT=8080
NODE_ENV=production

# Deploy to Fly.io
fly deploy

# View logs
fly logs

# SSH into server
fly ssh console
```

### Testing Workflow

```bash
# 1. Start server locally (terminal 1)
cd server
npm run dev
# Server runs on http://localhost:8080

# 2. Start dashboard dev server (terminal 2)
cd dashboard
npm run dev
# Dashboard runs on http://localhost:5173

# 3. Test client connection (terminal 3)
cd client
MCP_API_KEY=<valid-key> node test-connection.js

# 4. Verify tunnel status
curl http://localhost:8080/api/status/<subdomain>
# Should return: {"status": "connected", ...}

# 5. Test CLI tool (terminal 4)
cd cli
npm link
mcp-bridge-cloud --api-key <valid-key> --debug

# 6. Send test request to tunnel
curl -X POST https://<subdomain>.mcp-bridge.xyz \
  -H "Content-Type: application/json" \
  -d '{"method": "tools/list"}'
```

## Key Architectural Patterns

### WebSocket Protocol

All messages are JSON with `type` field:

```javascript
// Client → Server (authentication)
{
  type: 'auth',
  apiKey: '...'
}

// Server → Client (connection successful)
{
  type: 'connected',
  url: 'https://username.mcp-bridge.xyz',
  subdomain: 'username'
}

// Server → Client (HTTP request to forward)
{
  type: 'http_request',
  requestId: 'req_abc123',  // Unique correlation ID
  method: 'POST',
  url: '/',
  headers: { 'content-type': 'application/json', ... },
  body: { method: 'tools/list', ... }
}

// Client → Server (HTTP response)
{
  type: 'http_response',
  requestId: 'req_abc123',  // Same ID from request
  statusCode: 200,
  headers: { 'content-type': 'application/json', ... },
  body: { tools: [...] }
}

// Heartbeat
{ type: 'ping' }
{ type: 'pong' }
```

### Request/Response Correlation

**Pattern**: Track pending requests via Map with unique IDs

```javascript
// Server side (tunnel-relay.js)
const pendingRequests = new Map();

function handleHttpRequest(req, res) {
  const requestId = generateId();

  // Store pending request
  const timeout = setTimeout(() => {
    pendingRequests.delete(requestId);
    res.status(504).send('Gateway timeout');
  }, 30000);

  pendingRequests.set(requestId, { res, timeout });

  // Send to WebSocket client
  ws.send(JSON.stringify({
    type: 'http_request',
    requestId,
    method: req.method,
    url: req.url,
    headers: req.headers,
    body: req.body
  }));
}

function handleHttpResponse(msg) {
  const pending = pendingRequests.get(msg.requestId);
  if (!pending) return; // Timed out

  clearTimeout(pending.timeout);
  pendingRequests.delete(msg.requestId);

  pending.res
    .status(msg.statusCode)
    .headers(msg.headers)
    .send(msg.body);
}
```

**Client side uses same pattern** to correlate STDIO responses back to HTTP requests.

### HTTP-to-STDIO Adapter Pattern

**Challenge**: MCP servers use STDIO (JSON-RPC), but ChatGPT uses HTTP.

**Solution**: Fastify server that spawns MCP server as child process and converts protocols.

```javascript
// adapter.js pattern
const mcpProcess = spawn('npx', ['@modelcontextprotocol/server-filesystem', dir]);

// HTTP request → JSON-RPC
app.post('*', async (req, reply) => {
  const requestId = generateId();
  const jsonRpc = {
    jsonrpc: '2.0',
    id: requestId,
    method: req.body.method,
    params: req.body.params
  };

  // Write to MCP server's stdin
  mcpProcess.stdin.write(JSON.stringify(jsonRpc) + '\n');

  // Wait for response from stdout
  const response = await waitForResponse(requestId);
  reply.send(response);
});

// STDIO response → HTTP
mcpProcess.stdout.on('data', (data) => {
  const response = JSON.parse(data);
  resolveResponse(response.id, response.result);
});
```

### Connection Management Pattern

**One connection per subdomain** - New connection closes existing:

```javascript
// tunnel-relay.js
const connections = new Map(); // subdomain → WebSocket

function handleNewConnection(ws, subdomain) {
  // Close any existing connection for this subdomain
  const existing = connections.get(subdomain);
  if (existing) {
    existing.close(1000, 'New connection established');
  }

  // Store new connection
  connections.set(subdomain, ws);

  // Update database
  await updateTunnelStatus(subdomain, 'connected');

  // Setup heartbeat
  const heartbeat = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'ping' }));
    }
  }, 30000);

  ws.on('close', () => {
    clearInterval(heartbeat);
    connections.delete(subdomain);
    updateTunnelStatus(subdomain, 'disconnected');
  });
}
```

### Database Schema (Supabase)

**users table:**
```sql
id          UUID PRIMARY KEY
email       TEXT UNIQUE NOT NULL
username    TEXT UNIQUE NOT NULL
subdomain   TEXT UNIQUE NOT NULL  -- What goes in URL
api_key     TEXT UNIQUE NOT NULL  -- 64-char hex
created_at  TIMESTAMP
updated_at  TIMESTAMP
```

**tunnels table:**
```sql
id              UUID PRIMARY KEY
user_id         UUID REFERENCES users(id)
subdomain       TEXT NOT NULL
status          TEXT  -- 'connected' | 'disconnected'
last_seen       TIMESTAMP
requests_count  INTEGER DEFAULT 0
created_at      TIMESTAMP
```

**Key operations:**
- `getUserByApiKey(apiKey)` - Validate API key on WebSocket connection
- `getUserBySubdomain(subdomain)` - Route HTTP request to correct tunnel
- `updateTunnelStatus(userId, subdomain, status)` - Upsert on connect/disconnect
- `incrementRequestCount(subdomain)` - Async increment (uses Postgres function)

## Code Conventions

- **ES Modules**: All code uses `import/export` (package.json has `"type": "module"`)
- **Node.js 18+**: Required for all packages (uses native fetch, etc.)
- **Async/await**: Preferred over raw promises or callbacks
- **Error handling**: Try/catch with descriptive messages, always log errors
- **Environment variables**:
  - Server: Uppercase (SUPABASE_URL, PORT, NODE_ENV)
  - Dashboard: VITE_ prefix (VITE_SUPABASE_URL)
  - CLI: MCP_ prefix for user-facing vars (MCP_API_KEY for testing)
- **WebSocket messages**: Always JSON with required `type` field
- **Timeouts**: 30s for HTTP requests, 10s for WebSocket connection, 30s heartbeat
- **IDs**: Use nanoid for request IDs, UUIDs for database entities

## Common Development Tasks

### Adding a new CLI option

1. Edit `cli/bin/mcp-bridge-cloud.js` - add arg parsing
2. Pass option to `adapter.js` or `CloudConnector` constructor
3. Update `cli/README.md` with new option
4. Test with `npm link` and run locally

### Adding a new API endpoint

1. Edit `server/src/api-routes.js` - add new route
2. If requires auth, use `validateAuth()` middleware
3. Add database operation in `server/src/db.js` if needed
4. Update dashboard to consume new endpoint
5. Test with curl or dashboard UI

### Modifying WebSocket protocol

1. Update both `client/lib/cloud-connector.js` AND `server/src/tunnel-relay.js`
2. Add new message type handling in both sides
3. Update protocol documentation in READMEs
4. Test with `client/test-connection.js`

### Deploying changes

**Client/CLI** (public npm packages):
```bash
# Bump version in package.json
npm version patch  # or minor, major

# Publish (requires npm auth)
npm publish

# Users update with:
npm update -g mcp-bridge-cloud
```

**Dashboard** (bundled with server):
```bash
cd dashboard
npm run build  # Outputs to dist/

# Committed to server repo, deployed automatically
```

**Server** (Fly.io):
```bash
# Automatic: Push to main branch triggers GitHub Actions
git push origin main

# Manual: Use Fly CLI
fly deploy

# Check deployment
fly status
fly logs
```

## Related Documentation

- **README.md** - User-facing quick start guide
- **USE_CASES.md** - Detailed use cases and monetization strategy (45KB!)
- **cli/README.md** - CLI tool documentation
- **client/README.md** - Client library API reference
- **dashboard/README.md** - Dashboard development guide
- **server/README.md** - Server architecture (private repo)
- **server/DEPLOYMENT.md** - Deployment guide (private repo)
