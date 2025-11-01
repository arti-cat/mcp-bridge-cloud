# MCP Bridge Cloud

[![npm version](https://img.shields.io/npm/v/mcp-bridge-cloud-client.svg)](https://www.npmjs.com/package/mcp-bridge-cloud-client)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**Persistent HTTPS tunnels for MCP Bridge users.**

Users get a permanent URL like `https://username.mcp-bridge.xyz` that routes to their local MCP adapter.

---

## Architecture

```
User's Local Machine                 Cloud Service (Fly.io)
┌─────────────────────┐              ┌──────────────────────────┐
│ MCP Server (STDIO)  │              │  Caddy (Reverse Proxy)   │
│        ↓            │              │  *.mcp-bridge.xyz → :8080  │
│ lib/server.js       │              │                          │
│ (HTTP on :3000)     │              │  ┌────────────────────┐  │
│        ↓            │   WebSocket  │  │ Tunnel Relay       │  │
│ WebSocket Client ───┼──────────────┼─→│ (Node.js :8080)    │  │
│ (connects w/ API)   │              │  │                    │  │
└─────────────────────┘              │  │ Routes by subdomain│  │
                                     │  │ username → WS conn │  │
ChatGPT ─────────────────────────────┼─→│                    │  │
https://username.mcp-bridge.xyz        │  └────────────────────┘  │
                                     │                          │
                                     │  Supabase (Auth + DB)    │
                                     └──────────────────────────┘
```

---

## Tech Stack

### Server
- **Node.js 18+** - Runtime
- **Fastify** - HTTP server
- **ws** - WebSocket library
- **Supabase** - Auth + Database (replaces PostgreSQL)
- **Caddy 2.10+** - Reverse proxy with auto-SSL

### Client
- **ws** - WebSocket client
- Integrated into existing `mcp-bridge` CLI

### Deployment
- **Fly.io** - Server hosting ($5-10/mo)
- **Supabase** - Free tier (500MB DB)
- **Cloudflare** - DNS for wildcard SSL

---

## Project Structure

```
mcp-bridge-cloud/
├── server/                   # Tunnel relay service
│   ├── src/
│   │   ├── index.js          # Main entry point
│   │   ├── tunnel-relay.js   # WebSocket tunnel handling
│   │   ├── routing.js        # Subdomain → connection mapping
│   │   ├── auth.js           # Supabase auth integration
│   │   └── db.js             # Supabase client
│   ├── package.json
│   └── Dockerfile
├── client/                   # Modified mcp-bridge client
│   ├── lib/
│   │   └── cloud-connector.js
│   └── README.md
├── dashboard/                # Next.js dashboard (optional)
├── shared/                   # Shared types/configs
├── Caddyfile                 # Caddy config
├── docker-compose.yml        # Local dev
├── fly.toml                  # Fly.io deployment
└── README.md
```

---

## Database Schema (Supabase)

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  subdomain VARCHAR(50) UNIQUE NOT NULL,
  api_key VARCHAR(64) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own data
CREATE POLICY "Users can view own data"
  ON users FOR SELECT
  USING (auth.uid() = id);
```

### Tunnels Table (connection tracking)
```sql
CREATE TABLE tunnels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  subdomain VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'disconnected', -- connected, disconnected
  last_seen TIMESTAMP DEFAULT NOW(),
  requests_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_subdomain ON tunnels(subdomain);
CREATE INDEX idx_user_id ON tunnels(user_id);
```

---

## Quick Start (Development)

### 1. Set up Supabase
```bash
# Sign up at supabase.com
# Create new project
# Copy project URL and anon key
```

### 2. Environment Variables
```bash
# server/.env
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_KEY=eyJxxx...
PORT=8080
```

### 3. Install Dependencies
```bash
cd server
npm install
```

### 4. Run Server
```bash
npm run dev
```

### 5. Test Client
```bash
cd ../client
npm install
node lib/cloud-connector.js --api-key YOUR_KEY
```

---

## Deployment

### Fly.io
```bash
# Install flyctl
curl -L https://fly.io/install.sh | sh

# Login
flyctl auth login

# Deploy
flyctl deploy
```

### Caddy (on VPS or Fly.io)
```bash
# Install Caddy with Cloudflare DNS module
# Configure Caddyfile
# Start: caddy run
```

---

## Usage

### For Users
```bash
# Install mcp-bridge-cloud CLI
npm install -g mcp-bridge-cloud

# Sign up for cloud account (get API key)
# Run with cloud mode
mcp-bridge-cloud --api-key YOUR_API_KEY

# Output:
# ✓ Connected to cloud
# Your persistent URL: https://username.mcp-bridge.xyz
# Add this URL to ChatGPT Developer Mode
```

---

## Revenue Model

### Pricing
- **Free Beta**: First 50 users (validate demand)
- **Starter**: $9/mo - 1 tunnel, 10K requests/mo
- **Pro**: $19/mo - 3 tunnels, 100K requests/mo
- **Team**: $49/mo - 10 tunnels, unlimited

### Costs
- Fly.io: ~$5-10/mo
- Supabase: Free (up to 500MB)
- Domain: $12/year
- **Total: ~$10/mo to start**

---

## Why Supabase?

1. **Free tier** - Perfect for MVP, scales later
2. **Auth built-in** - Email/password, OAuth, magic links
3. **Real-time** - Could add live connection status
4. **Auto REST API** - No need to write CRUD endpoints
5. **Dashboard** - Built-in admin panel
6. **Row Level Security** - User data isolation
7. **Backups** - Automatic daily backups

---

## Next Steps

1. ✅ Create directory structure
2. ⏳ Implement tunnel relay server
3. ⏳ Integrate with Supabase
4. ⏳ Build WebSocket client
5. ⏳ Test locally
6. ⏳ Deploy to Fly.io

---

## License

MIT - Same as mcp-bridge
