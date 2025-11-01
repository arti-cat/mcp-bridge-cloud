# CLAUDE.md

## Project Overview

**MCP Bridge Cloud** - Public repository for mcp-bridge.xyz persistent tunnel service.

**Problem**: Cloudflare temp tunnels change URLs on restart → users must reconfigure ChatGPT constantly.
**Solution**: Persistent subdomains (e.g., `https://username.mcp-bridge.xyz`) via WebSocket relay.

**This repo contains:**

- `cli/` - Command-line tool (published as `mcp-bridge-cloud`)
- `client/` - WebSocket client library (published as `mcp-bridge-cloud-client`)
- `dashboard/` - User account management (Svelte + Supabase)

**Server code** is in separate private repo (`mcp-bridge-cloud-server`).

## Architecture

```
ChatGPT → https://username.mcp-bridge.xyz
    ↓ (HTTPS)
Cloud Server (Fly.io - private repo)
    ↓ (WebSocket)
CLI Tool (user's machine - this repo)
    ↓ (HTTP localhost:3000)
Local HTTP Adapter
    ↓ (STDIO)
MCP Server
```

**Flow**: Cloud server routes by subdomain → WebSocket tunnel → Local CLI → HTTP adapter → MCP server.

## Code Structure

### `cli/` - Command Line Interface

```
bin/mcp-bridge-cloud.js    # Entry point, arg parsing, user messages
lib/adapter.js              # HTTP-to-STDIO adapter (Fastify server)
```

**Key patterns:**

- Uses `mcp-bridge-cloud-client` package for WebSocket connection
- Spawns local Fastify server on port 3000 (configurable)
- Converts HTTP requests → JSON-RPC → STDIO

### `client/` - WebSocket Client Library

```
lib/cloud-connector.js      # Main WebSocket client class
test-connection.js          # Test script
```

**CloudConnector API:**

```javascript
const client = new CloudConnector({
  apiKey: '...',           // 64-char hex string
  tunnelUrl: 'wss://...',  // WebSocket URL
  localPort: 3000,         // Where adapter listens
  debug: false             // Verbose logging
});

await client.connect();    // Returns { url, subdomain }
client.disconnect();
```

**Key patterns:**

- Auto-reconnect with exponential backoff (1s → 32s max)
- Request/response correlation via unique requestId
- Event-driven (EventEmitter for tunnel events)
- 30s timeout per request

### `dashboard/` - User Dashboard

```
src/App.svelte              # Main app component
src/lib/supabaseClient.js   # Auth + DB client
public/                     # Static assets
```

**Tech**: Svelte + Vite + Supabase + Tailwind CSS

## Development

### CLI

```bash
cd cli
npm install
node bin/mcp-bridge-cloud.js --help
npm link  # For global testing
```

### Client Library

```bash
cd client
npm install
node test-connection.js  # Requires MCP_API_KEY env var
```

### Dashboard

```bash
cd dashboard
npm install
npm run dev
```

## Testing

**Quick test** (requires valid API key):

```bash
cd client
MCP_API_KEY=your_key node test-connection.js
```

Expected:
```
✅ CONNECTED!
URL: https://yourname.mcp-bridge.xyz
```

**Verify tunnel status:**
```bash
curl https://mcp-bridge.xyz/api/status/yourname
# Should show: "status": "connected"
```

## Code Conventions

- **ES Modules**: All code uses `import/export` (type: "module")
- **Node.js 18+**: Required for all packages
- **Error handling**: Try/catch with descriptive messages, log errors to console
- **Async/await**: Preferred over promises/callbacks
- **WebSocket messages**: JSON format with `type`, `requestId`, `data` fields
- **Environment variables**: Uppercase with prefixes (MCP_*, VITE_*)

## Key Implementation Details

**WebSocket Protocol:**

- Client → Server: `{ type: 'auth', apiKey: '...' }`
- Server → Client: `{ type: 'http-request', requestId: '...', data: {...} }`
- Client → Server: `{ type: 'http-response', requestId: '...', data: {...} }`

**Connection Management:**

- One WebSocket per subdomain (new connection closes existing)
- Heartbeat every 30s (pong required or connection terminated)
- Auto-reconnect on disconnect

**Request Timeout:**

- 30s timeout for pending requests
- Map-based correlation (requestId → pending request)
- Cleanup on timeout or response

## Related Repos

- **mcp-bridge-cloud** (this repo): Public - CLI, client, dashboard
- **mcp-bridge-cloud-server**: Private - Server infrastructure
