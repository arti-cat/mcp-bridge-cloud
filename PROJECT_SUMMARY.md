# MCP Bridge Cloud - Project Summary

## What We Built

A **cloud tunnel service** that provides persistent HTTPS URLs for mcp-bridge users.

**Problem Solved:**
Cloudflare temp tunnels change URLs every restart → users must update ChatGPT config constantly.

**Solution:**
Users get permanent URLs like `https://username.mcp-bridge.xyz` that work forever.

---

## Architecture

```
User's Machine (Local)          Cloud Service (Fly.io)
┌──────────────────────┐       ┌─────────────────────────┐
│ MCP Server (STDIO)   │       │ Caddy (*.mcp-bridge.xyz)  │
│         ↓            │       │         ↓                │
│ mcp-bridge adapter   │       │ Tunnel Relay (Node.js)  │
│ (HTTP :3000)         │       │   - WebSocket server    │
│         ↓            │  WS   │   - Subdomain routing   │
│ CloudConnector ──────┼───────┼──→  - HTTP forwarding   │
│ (with API key)       │       │                         │
└──────────────────────┘       │ Supabase (DB)           │
                                │   - Users               │
ChatGPT ────────────────────────┼──→  - Tunnels          │
https://username.mcp-bridge.xyz  │   - API keys            │
                                └─────────────────────────┘
```

---

## Tech Stack

### Server (Cloud Service)
- **Node.js 18+** - Runtime
- **Fastify** - HTTP server
- **ws** - WebSocket server
- **Supabase** - Database + Auth (free tier)
- **Caddy** - Reverse proxy with auto-SSL
- **Fly.io** - Hosting platform (~$5-10/mo)

### Client (Integrated into mcp-bridge)
- **ws** - WebSocket client
- ~150 lines of code
- Auto-reconnect with exponential backoff
- Forwards HTTP requests to local adapter

---

## Files Created

### Server (mcp-bridge-cloud/)
```
server/
├── src/
│   ├── index.js           # Main entry point (60 lines)
│   ├── tunnel-relay.js    # WebSocket tunnel server (200 lines)
│   ├── routing.js         # Subdomain routing logic (100 lines)
│   └── db.js              # Supabase client wrapper (150 lines)
├── package.json
└── .env.example

client/
├── lib/
│   └── cloud-connector.js # WebSocket client (200 lines)
└── package.json

Config Files:
├── Caddyfile              # Reverse proxy config
├── fly.toml               # Fly.io deployment
├── Dockerfile             # Container image
├── docker-compose.yml     # Local dev setup
└── .gitignore

Documentation:
├── README.md              # Overview
├── SETUP.md               # Deployment guide (comprehensive)
├── INTEGRATION.md         # How to add to mcp-bridge CLI
└── PROJECT_SUMMARY.md     # This file
```

**Total Code: ~710 lines**
**Total Files: 17 files**

---

## How It Works

### 1. User Signs Up (Future: Dashboard)
```sql
INSERT INTO users (email, username, subdomain, api_key)
VALUES ('user@example.com', 'john', 'john', 'sk_xxxxx');
```

### 2. User Runs mcp-bridge with Cloud Flag
```bash
mcp-bridge --cloud --api-key sk_xxxxx --preset filesystem --dir ~/Documents
```

### 3. CloudConnector Connects to Server
- Opens WebSocket to `wss://mcp-bridge.xyz/tunnel?api_key=sk_xxxxx`
- Server validates API key via Supabase
- Server maps `john.mcp-bridge.xyz` → user's WebSocket connection

### 4. User Gets Persistent URL
```
✓ Connected to cloud
Your persistent URL: https://john.mcp-bridge.xyz
```

### 5. ChatGPT Sends Request
```
ChatGPT → https://john.mcp-bridge.xyz/tools/list
         ↓
Caddy → Tunnel Relay → extracts subdomain "john"
                     → finds WebSocket connection
                     → forwards request through WebSocket
                     ↓
User's Local Machine → receives request
                     → forwards to mcp-bridge adapter (:3000)
                     → mcp-bridge processes (calls MCP server)
                     → returns response
                     ↓
Tunnel Relay ← response through WebSocket
         ↓
ChatGPT ← HTTP response
```

---

## Database Schema (Supabase)

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  username VARCHAR(50) UNIQUE,
  subdomain VARCHAR(50) UNIQUE,  -- e.g., "john"
  api_key VARCHAR(64) UNIQUE,     -- e.g., "sk_xxxxx"
  created_at TIMESTAMP
);
```

### Tunnels Table (Connection Tracking)
```sql
CREATE TABLE tunnels (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  subdomain VARCHAR(50),
  status VARCHAR(20),              -- "connected" or "disconnected"
  last_seen TIMESTAMP,
  requests_count INTEGER,
  created_at TIMESTAMP
);
```

---

## Deployment Steps (Quick Version)

### 1. Supabase Setup (5 min)
1. Create project at supabase.com
2. Run SQL schema
3. Copy API keys

### 2. Domain Setup (10 min)
1. Buy domain: `mcp-bridge.xyz` (~$12/year)
2. Add to Cloudflare
3. Get API token for DNS

### 3. Deploy to Fly.io (10 min)
```bash
cd mcp-bridge-cloud
flyctl launch
flyctl secrets set SUPABASE_URL=xxx SUPABASE_SERVICE_KEY=yyy ...
flyctl deploy
```

### 4. Configure DNS (5 min)
- Point `*.mcp-bridge.xyz` → Fly.io IP
- Wait for DNS propagation

### 5. Install Caddy (5 min)
- Add Caddy to Dockerfile OR deploy separately
- Caddy handles wildcard SSL automatically

**Total setup time: 30-40 minutes**

---

## Testing Locally

### 1. Start Server
```bash
cd mcp-bridge-cloud/server
npm install

# Set environment variables
cp .env.example .env
# Edit .env with your Supabase keys

npm start
```

### 2. Test WebSocket Connection
```bash
cd ../client
npm install

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

### 3. Start Local MCP Adapter
```bash
cd /path/to/mcp-bridge
npm start  # Runs on port 3000
```

### 4. Send Test Request
```bash
curl -X POST http://localhost:8080 \
  -H "Host: testuser.mcp-bridge.xyz" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
```

---

## Revenue Model

### Pricing Tiers
| Tier | Price | Features |
|------|-------|----------|
| **Free Beta** | $0 | First 50 users, validate demand |
| **Starter** | $9/mo | 1 tunnel, 10K requests/mo |
| **Pro** | $19/mo | 3 tunnels, 100K requests/mo |
| **Team** | $49/mo | 10 tunnels, unlimited requests |

### Cost Structure
| Item | Cost/Month |
|------|------------|
| Fly.io (1 VM) | $5-10 |
| Supabase | Free (up to 500MB) |
| Domain | $1 (amortized) |
| **Total** | **~$7-12/mo** |

### Break-Even Analysis
- **2 users at $9/mo** = $18/mo (break even)
- **10 users at $9/mo** = $90/mo profit
- **50 users at $9/mo** = $450/mo profit
- **100 users at $9/mo** = $900/mo profit

---

## Integration with mcp-bridge

### User Experience (Before)
```bash
mcp-bridge
# → https://abc-xyz.trycloudflare.com
# URL changes every restart ❌
```

### User Experience (After)
```bash
mcp-bridge --cloud --api-key sk_xxxxx
# → https://john.mcp-bridge.xyz
# Same URL forever ✅
```

### Code Changes Required
1. Copy `cloud-connector.js` to mcp-bridge
2. Add `--cloud` and `--api-key` flags (20 lines)
3. Add `startCloudTunnel()` function (40 lines)
4. Update help text (10 lines)
5. Add cleanup logic (5 lines)

**Total: ~75 lines of code changes to mcp-bridge**

---

## Next Steps (Priority Order)

### Week 1: MVP Launch
1. ✅ Core tunnel relay (DONE)
2. ⏳ Deploy to Fly.io
3. ⏳ Test with real mcp-bridge
4. ⏳ Create 5 test users

### Week 2: Integration
5. ⏳ Integrate into mcp-bridge CLI
6. ⏳ Test end-to-end with ChatGPT
7. ⏳ Write launch blog post
8. ⏳ Post on Reddit/Twitter

### Week 3-4: Dashboard (Optional)
9. ⏳ Build Next.js dashboard
10. ⏳ Add Stripe integration
11. ⏳ Launch beta program

### Month 2: Growth
12. ⏳ Add usage analytics
13. ⏳ Email marketing to mcp-bridge users
14. ⏳ ProductHunt launch

---

## Success Metrics

### Week 1 (MVP)
- [ ] Server deployed to Fly.io
- [ ] SSL working for `*.mcp-bridge.xyz`
- [ ] 1 test user connected successfully
- [ ] ChatGPT can access via persistent URL

### Month 1 (Beta)
- [ ] 10 beta users
- [ ] 99% uptime
- [ ] <500ms average latency
- [ ] 0 critical bugs

### Month 3 (Launch)
- [ ] 50 paying users
- [ ] $450/mo revenue
- [ ] Dashboard launched
- [ ] Stripe integration working

---

## Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Low adoption | High | Free beta, validate demand first |
| WebSocket drops | Medium | Auto-reconnect with backoff |
| High bandwidth costs | Medium | Rate limiting per user |
| Security breach | High | API keys, RLS, HTTPS only |
| Fly.io outage | Medium | Monitor + quick fallback plan |

---

## Why This Will Work

1. **Real Problem**: Temp tunnels are annoying, people want persistent URLs
2. **Simple Solution**: One flag (`--cloud`) changes everything
3. **Low Friction**: Users already trust mcp-bridge
4. **Clear Value**: $9/mo to never update ChatGPT config again
5. **Low Costs**: Break even at 2 users, profit at 10+
6. **Timing**: Smithery dropping STDIO, we're filling gap
7. **Supabase**: Makes MVP fast, free tier handles 100s of users

---

## Files to Deploy

### Must Have (For MVP)
- ✅ server/src/* (all 4 files)
- ✅ server/package.json
- ✅ Dockerfile
- ✅ fly.toml
- ✅ Caddyfile

### Nice to Have (For Production)
- ⏳ Dashboard (Next.js)
- ⏳ Landing page
- ⏳ Signup flow
- ⏳ Stripe integration

---

## Contact

- **GitHub**: https://github.com/arti-cat/mcp-bridge-cloud
- **Email**: articat1066@gmail.com
- **Supabase Advice**: @bch (you built this!)

**Let's ship it!** 🚀
