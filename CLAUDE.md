# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MCP Bridge Cloud is a WebSocket-based tunnel relay service that provides persistent HTTPS URLs for mcp-bridge users. The system routes HTTP requests from ChatGPT through WebSocket connections to users' local MCP adapters.

**Core Problem**: Cloudflare temporary tunnels change URLs on every restart, requiring users to constantly update ChatGPT configurations.

**Solution**: Permanent subdomains (e.g., `https://username.mcpbridge.io`) that persist across restarts.

## Architecture

The system has three main components:

1. **Cloud Server** (`server/`): Node.js/Fastify server on Fly.io that accepts WebSocket tunnel connections and routes HTTP traffic
2. **Client Connector** (`client/`): WebSocket client that connects local mcp-bridge to the cloud server
3. **Infrastructure**: Caddy for reverse proxy/SSL, Supabase for database/auth

### Request Flow

```
ChatGPT → https://username.mcpbridge.io
    ↓
Caddy (reverse proxy, wildcard SSL)
    ↓
Fastify Server (routing.js extracts subdomain)
    ↓
Tunnel Relay (tunnel-relay.js routes by subdomain → WebSocket)
    ↓
User's Local Machine (cloud-connector.js receives via WebSocket)
    ↓
Local HTTP Adapter (:3000)
    ↓
MCP Server (STDIO)
```

## Development Commands

### Server Development

```bash
# Install dependencies
cd server
npm install

# Development mode (auto-restart on changes)
npm run dev

# Production mode
npm start
```

### Client Testing

```bash
# Install dependencies
cd client
npm install

# Test connection (requires running server)
node -e "
const { CloudConnector } = require('./lib/cloud-connector.js');
const client = new CloudConnector({
  apiKey: 'test_api_key_123',
  tunnelUrl: 'ws://localhost:8080',
  localPort: 3000,
  debug: true
});
client.connect().then(r => console.log('Connected:', r));
"
```

### Environment Setup

Create `server/.env`:
```bash
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_KEY=eyJxxx...
PORT=8080
NODE_ENV=development
```

For local testing without Supabase, you can mock the database functions in `server/src/db.js`.

## Key Files and Their Responsibilities

### Server (`server/src/`)

- **`index.js`**: Main entry point. Sets up Fastify server, registers routes, initializes WebSocket server
- **`tunnel-relay.js`**: WebSocket server that manages tunnel connections. Maps subdomains to WebSocket connections, handles bidirectional communication
- **`routing.js`**: HTTP routing logic. Extracts subdomains, validates users, forwards requests to appropriate tunnels
- **`db.js`**: Supabase client wrapper. User lookup by API key/subdomain, tunnel status tracking, request counting

### Client (`client/lib/`)

- **`cloud-connector.js`**: WebSocket client that connects to cloud server, receives HTTP requests via WebSocket, forwards to local adapter, sends responses back

### Configuration

- **`fly.toml`**: Fly.io deployment config (regions, health checks, scaling)
- **`Caddyfile`**: Reverse proxy config for wildcard SSL (`*.mcpbridge.io`)
- **`Dockerfile`**: Container build for deployment
- **`docker-compose.yml`**: Local development environment

## Important Implementation Details

### Subdomain Extraction
The system extracts subdomains from the `Host` header (e.g., `username.mcpbridge.io` → `username`). For local testing, set `TEST_SUBDOMAIN` env var or use `Host` header injection.

### WebSocket Connection Management
- **One connection per subdomain**: New connections from same user close existing ones (see `tunnel-relay.js:50-54`)
- **Heartbeat mechanism**: Server pings every 30s, terminates inactive connections (see `tunnel-relay.js:110-120`)
- **Auto-reconnect**: Client reconnects with exponential backoff (1s → 32s max) on disconnect (see `cloud-connector.js:189-206`)

### Request/Response Correlation
Each HTTP request gets a unique `requestId` (format: `req_{timestamp}_{random}`). Pending requests are stored in a Map with 30s timeout. This allows async request/response matching over WebSocket.

### Database Schema
Two main tables in Supabase:
- **`users`**: email, username, subdomain, api_key (all unique)
- **`tunnels`**: tracks connection status, last_seen timestamp, requests_count

The `increment_tunnel_requests` PostgreSQL function atomically increments request counts.

## Testing

### Manual Testing Flow

1. **Start server**:
   ```bash
   cd server && npm run dev
   ```

2. **Create test user** (via Supabase SQL Editor):
   ```sql
   INSERT INTO users (email, username, subdomain, api_key)
   VALUES ('test@example.com', 'testuser', 'testuser', 'test_api_key_123');
   ```

3. **Start a local HTTP server** on port 3000 (simulates mcp-bridge adapter):
   ```bash
   python -m http.server 3000
   ```

4. **Connect client**:
   ```bash
   cd client
   node lib/cloud-connector.js  # (modify to set apiKey and debug mode)
   ```

5. **Send test request**:
   ```bash
   curl -X POST http://localhost:8080 \
     -H "Host: testuser.mcpbridge.io" \
     -H "Content-Type: application/json" \
     -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
   ```

### Health Check

```bash
curl http://localhost:8080/healthz
# Returns: {"status":"ok","timestamp":"...","service":"mcp-bridge-cloud"}
```

### Tunnel Status

```bash
curl http://localhost:8080/api/status/testuser
# Returns connection status for subdomain "testuser"
```

## Deployment

### Fly.io Deployment

```bash
# Install Fly CLI
curl -L https://fly.io/install.sh | sh

# Login
flyctl auth login

# Set secrets (NEVER commit these)
flyctl secrets set \
  SUPABASE_URL="https://xxx.supabase.co" \
  SUPABASE_SERVICE_KEY="eyJxxx..." \
  SUPABASE_ANON_KEY="eyJxxx..."

# Deploy
flyctl deploy

# View logs
flyctl logs

# Check status
flyctl status
```

### DNS Configuration

Point wildcard domain to Fly.io IP:
```
A record:    *.mcpbridge.io → [Fly.io IPv4]
AAAA record: *.mcpbridge.io → [Fly.io IPv6]
```

Caddy handles automatic SSL via Cloudflare DNS challenge.

## Common Development Tasks

### Adding New Endpoints

Add to `server/src/index.js`:
```javascript
app.get('/your-route', async (req, reply) => {
  // handler
});
```

### Modifying WebSocket Protocol

Update both:
- `server/src/tunnel-relay.js`: Server-side message handling
- `client/lib/cloud-connector.js`: Client-side message handling

Ensure message types are symmetric.

### Debugging WebSocket Issues

Enable debug logging:
```javascript
// Client side
const client = new CloudConnector({ debug: true, ... });

// Server side (already enabled in dev mode via Fastify logger)
```

### Database Migrations

Run SQL in Supabase SQL Editor. The schema is defined in `server/src/db.js` (see `SCHEMA_SQL` constant).

## Integration with mcp-bridge

The client library (`client/lib/cloud-connector.js`) is designed to be copied into the mcp-bridge CLI package. See `INTEGRATION.md` for detailed integration steps.

Key integration points:
1. Add `--cloud` and `--api-key` CLI flags
2. Instantiate `CloudConnector` instead of starting Cloudflare tunnel
3. Display persistent URL to user
4. Handle cleanup on shutdown

## Security Considerations

- **API keys**: 64-character random strings, stored in Supabase `users.api_key`
- **Row Level Security**: Enabled on `users` table (users can only see their own data)
- **HTTPS only**: All production traffic over TLS (Caddy auto-SSL)
- **WebSocket authentication**: API key validated on connection, invalid keys rejected with 1008 close code
- **Rate limiting**: Not yet implemented (TODO for production)

## Troubleshooting

### "Tunnel not connected" error
- Verify client is running with correct API key
- Check server logs for connection attempts
- Ensure WebSocket isn't blocked by firewall

### "Invalid subdomain" error
- Check `Host` header is set correctly
- For local testing, set `TEST_SUBDOMAIN` environment variable

### Request timeout (30s)
- Local adapter may be slow or unresponsive
- Check local adapter is running on correct port
- Review `REQUEST_TIMEOUT` constant in `tunnel-relay.js`

### Database connection errors
- Verify `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` are set
- Check Supabase project is running
- Confirm schema has been created (run `SCHEMA_SQL` from `db.js`)

## Tech Stack

- **Runtime**: Node.js 18+
- **Web Framework**: Fastify 5.x
- **WebSocket**: ws 8.x
- **Database**: Supabase (PostgreSQL + auth)
- **Reverse Proxy**: Caddy 2.10+ with Cloudflare DNS module
- **Deployment**: Fly.io
- **DNS**: Cloudflare
