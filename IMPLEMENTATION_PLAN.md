# MCP Bridge Cloud - Implementation Plan

**Status**: Phase 1 Complete (Cloud Infrastructure) ✅
**Date**: October 30, 2025
**Next Phase**: Dashboard + CLI Integration

---

## Overview

mcp-bridge-cloud provides persistent HTTPS URLs for MCP servers, eliminating the need to update ChatGPT configurations on every restart.

**Current Status**: Core infrastructure is LIVE and tested end-to-end.

---

## Phase 1: Cloud Infrastructure ✅ COMPLETE

### What's Done

#### Server (Deployed to Fly.io)
- ✅ WebSocket tunnel relay (`server/src/tunnel-relay.js`)
- ✅ HTTP routing with subdomain extraction (`server/src/routing.js`)
- ✅ Supabase integration for users/tunnels (`server/src/db.js`)
- ✅ Health check and status endpoints
- ✅ SSL via Fly.io (Let's Encrypt certificates)
- ✅ Deployed to production: `mcp-bridge.xyz`

#### Client Library
- ✅ CloudConnector WebSocket client (`client/lib/cloud-connector.js`)
- ✅ Automatic reconnection with exponential backoff
- ✅ HTTP request/response forwarding
- ✅ Test script validates end-to-end flow

#### Infrastructure
- ✅ Fly.io deployment configuration (`fly.toml`)
- ✅ Docker containerization (`Dockerfile`)
- ✅ DNS configuration (Cloudflare)
- ✅ Supabase database schema

#### Documentation
- ✅ User onboarding guide (`docs/ADD_NEW_USER.md`)
- ✅ Deployment status tracking (`DEPLOYMENT_STATUS.md`)
- ✅ Caddy implementation docs (for future migration)
- ✅ Project documentation (`CLAUDE.md`, `README.md`)

#### Testing
- ✅ End-to-end test validated:
  - Internet → `https://articat.mcp-bridge.xyz`
  - → WebSocket tunnel
  - → Local mcp-bridge HTTP adapter
  - → Filesystem MCP server (STDIO)
  - → Full JSON-RPC response with all tools
- ✅ SSL certificate working (Let's Encrypt via Fly.io)
- ✅ Subdomain routing working
- ✅ API key authentication working

### Test User Account
- Email: `articat-1066@gmail.com`
- Username: `articat`
- Subdomain: `articat.mcp-bridge.xyz`
- Status: Active and tested ✅

---

## Phase 2: User Dashboard 🔨 IN PROGRESS

### Goal
Self-service user management via web UI at `https://mcp-bridge.xyz/dashboard`

### What Needs to Be Built

#### 2.1 Frontend (Web App)
```
dashboard/
├── public/
│   ├── index.html          # Landing/login page
│   ├── signup.html         # User registration
│   └── dashboard.html      # Account management
├── src/
│   ├── auth.js            # Supabase Auth integration
│   ├── api.js             # API calls to server
│   └── components/
│       ├── LoginForm.js
│       ├── SignupForm.js
│       ├── TunnelStatus.js
│       ├── ApiKeyManager.js
│       └── UsageMetrics.js
├── styles/
│   └── main.css
└── package.json
```

**Tech Stack Options:**
- **Simple**: Vanilla JS + HTML + CSS (no build step)
- **Modern**: Svelte/SvelteKit (lightweight, fast)
- **Enterprise**: Next.js + React (more overhead)

**Recommendation**: Start with Svelte for speed and simplicity.

#### 2.2 Dashboard Features

**Authentication (Supabase Auth)**
- [ ] Email/password signup
- [ ] Email verification
- [ ] Login/logout
- [ ] Password reset
- [ ] Session management

**Account Management**
- [ ] View subdomain and tunnel URL
- [ ] Display API key (with copy button)
- [ ] Regenerate API key
- [ ] View tunnel connection status (connected/disconnected)
- [ ] View last connection timestamp

**Usage Metrics**
- [ ] Total requests count
- [ ] Requests per day chart
- [ ] Connection uptime
- [ ] Recent activity log

**Subdomain Selection**
- [ ] Choose custom subdomain during signup
- [ ] Validate subdomain availability
- [ ] DNS-safe validation (lowercase, alphanumeric, hyphens)

#### 2.3 Server Updates

**New API Endpoints** (add to `server/src/routing.js`):
```javascript
POST   /api/auth/signup           # Create new user + tunnel
POST   /api/auth/login            # Authenticate user
GET    /api/account               # Get user account info
POST   /api/account/regenerate-key # Regenerate API key
GET    /api/account/metrics       # Get usage metrics
POST   /api/account/subdomain     # Update subdomain
```

**Static File Serving** (add to `server/src/index.js`):
```javascript
// Serve dashboard
app.register(fastifyStatic, {
  root: path.join(__dirname, '../../dashboard/dist'),
  prefix: '/dashboard/',
});

// Root domain serves landing page
app.get('/', async (req, reply) => {
  return reply.sendFile('index.html');
});
```

**Database Schema Updates** (if needed):
- Users table already has: `email`, `username`, `subdomain`, `api_key`
- Tunnels table already has: `connected`, `last_seen`, `requests_count`
- May need: `created_at`, `email_verified`, `last_login`

#### 2.4 Fly.io Certificate Management

**Automatic Certificate Creation**:
- [ ] Add API endpoint: `POST /api/admin/add-user`
- [ ] Call `flyctl certs add` via Fly.io API when new user signs up
- [ ] Store certificate status in database
- [ ] Handle certificate issuance delays (30-60 seconds)

**Alternative (if Fly.io API too complex)**:
- Manual certificate addition per user (current approach)
- Document in user signup email/instructions

#### 2.5 Deployment

**Build Process**:
```bash
cd dashboard
npm run build    # Build dashboard to dashboard/dist/
cd ..
flyctl deploy    # Deploy server + dashboard together
```

**Update Dockerfile**:
```dockerfile
# Add dashboard build step
COPY dashboard/ ./dashboard/
RUN cd dashboard && npm ci && npm run build
```

---

## Phase 3: CLI Integration

### Goal
Allow users to run `npx mcp-bridge --cloud` to use persistent tunnel instead of Cloudflare.

### What Needs to Be Done

#### 3.1 Copy CloudConnector Library
```bash
# Copy from mcp-bridge-cloud to MCP-bridge
cp mcp-bridge-cloud/client/lib/cloud-connector.js \
   MCP-bridge/lib/cloud-connector.js
```

#### 3.2 Update CLI (`MCP-bridge/bin/cli.js`)

**Add Flags**:
```javascript
case '--cloud':
  config.useCloud = true;
  break;
case '--api-key':
  config.cloudApiKey = args[++i];
  break;
```

**Add Cloud Logic**:
```javascript
// After starting HTTP adapter on port 3000...

if (config.useCloud) {
  // Use CloudConnector instead of Cloudflare
  const { CloudConnector } = require('../lib/cloud-connector.js');

  const cloudClient = new CloudConnector({
    apiKey: config.cloudApiKey || process.env.MCP_BRIDGE_API_KEY,
    tunnelUrl: 'wss://mcp-bridge.xyz',
    localPort: config.port,
    debug: config.dev,
  });

  const result = await cloudClient.connect();
  log(`✓ Tunnel URL: ${result.url}`, colors.green);

} else {
  // Existing Cloudflare logic
  const cloudflared = await import('cloudflared');
  // ... existing code
}
```

#### 3.3 Update Documentation

**README.md**:
```markdown
## Cloud Mode (Persistent URLs)

Get a permanent HTTPS URL that never changes:

1. Sign up at https://mcp-bridge.xyz/dashboard
2. Get your API key
3. Run with cloud mode:

```bash
npx mcp-bridge --cloud --api-key YOUR_API_KEY
```

Your persistent URL: `https://yourusername.mcp-bridge.xyz`

**Benefits:**
- ✅ URL never changes (even after restarts)
- ✅ No need to update ChatGPT configuration
- ✅ Works from anywhere (no localhost required)
```

#### 3.4 Package.json

**Add Environment Variable**:
```json
{
  "scripts": {
    "cloud": "MCP_BRIDGE_API_KEY=your_key_here node bin/cli.js --cloud"
  }
}
```

#### 3.5 Testing

```bash
# Test with cloud mode
cd MCP-bridge
export MCP_BRIDGE_API_KEY="your_api_key"
npx mcp-bridge --cloud --preset filesystem --dir ~/Documents

# Should output:
# ✓ Adapter running on port 3000
# ✓ Connected to cloud
# ✓ Tunnel URL: https://yourusername.mcp-bridge.xyz
```

---

## Phase 4: Production Readiness (Future)

### 4.1 Monitoring & Logging
- [ ] Add structured logging (Winston/Pino)
- [ ] Ship logs to external service (Papertrail, Logtail)
- [ ] Add Prometheus metrics endpoint
- [ ] Set up Grafana dashboard

### 4.2 Rate Limiting
- [ ] Add rate limiting per user (requests/minute)
- [ ] Add rate limiting per IP (requests/second)
- [ ] Return 429 with Retry-After header

### 4.3 Billing Integration
- [ ] Add Stripe integration
- [ ] Free tier: 1000 requests/month
- [ ] Paid tier: Unlimited requests
- [ ] Usage tracking per user

### 4.4 SSL Migration to Caddy
- [ ] Wait for Let's Encrypt rate limit to expire (Oct 31, 2025)
- [ ] Switch from Fly.io HTTP service to Caddy TCP passthrough
- [ ] Enable wildcard SSL certificate (`*.mcp-bridge.xyz`)
- [ ] Remove manual certificate management per user

### 4.5 Multi-Region Deployment
- [ ] Deploy to multiple Fly.io regions (sjc, iad, lhr)
- [ ] Add health checks and automatic failover
- [ ] Geo-routing for lowest latency

### 4.6 Security Hardening
- [ ] Add CORS restrictions (whitelist ChatGPT origins)
- [ ] Add request signing (HMAC)
- [ ] Add IP allowlist per user
- [ ] Add anomaly detection (unusual traffic patterns)

### 4.7 Documentation
- [ ] API documentation (OpenAPI/Swagger)
- [ ] User guides (with screenshots)
- [ ] Video tutorials
- [ ] Troubleshooting guide

---

## Current Architecture

```
Internet (ChatGPT)
    ↓
https://username.mcp-bridge.xyz (SSL via Fly.io)
    ↓
Node.js Server (Fastify) on Fly.io
    ├── HTTP Routes (routing.js)
    │   ├── /healthz
    │   ├── /api/status/:subdomain
    │   └── /* (forwards to WebSocket tunnel)
    │
    └── WebSocket Server (tunnel-relay.js)
        └── /tunnel (accepts client connections)
            ↓
        WebSocket Connection
            ↓
CloudConnector (client/lib/cloud-connector.js)
    ↓
localhost:3000 (mcp-bridge HTTP adapter)
    ↓
STDIO MCP Server (filesystem, sqlite, etc.)
```

---

## Future Architecture (After Caddy Migration)

```
Internet (ChatGPT)
    ↓
https://username.mcp-bridge.xyz
    ↓
Fly.io TCP Passthrough (port 443)
    ↓
Caddy (SSL termination, wildcard cert)
    ├── *.mcp-bridge.xyz → localhost:8080
    └── mcp-bridge.xyz → localhost:8080
        ↓
Node.js Server (Fastify)
    └── [same as current]
```

---

## Timeline Estimate

### Phase 2: Dashboard (2-3 days)
- Day 1: Setup Svelte, authentication, basic UI
- Day 2: Account management, API integration
- Day 3: Testing, polish, deployment

### Phase 3: CLI Integration (1 day)
- Morning: Copy library, update CLI flags
- Afternoon: Testing, documentation

### Phase 4: Production Readiness (1-2 weeks)
- Week 1: Monitoring, rate limiting, security
- Week 2: Billing, multi-region, docs

---

## Success Criteria

### Phase 2 Complete When:
- [ ] Users can sign up via web UI
- [ ] Users receive subdomain + API key
- [ ] Users can view tunnel status
- [ ] Users can regenerate API key
- [ ] Dashboard deployed to production

### Phase 3 Complete When:
- [ ] `npx mcp-bridge --cloud` works
- [ ] Users can connect via CLI
- [ ] Documentation updated
- [ ] Published to npm (optional)

### Phase 4 Complete When:
- [ ] Monitoring and alerting operational
- [ ] Rate limiting active
- [ ] Billing system live
- [ ] SSL migrated to Caddy
- [ ] Multi-region deployment

---

## Open Questions

1. **Dashboard Tech Stack**: Svelte vs Next.js vs Vanilla JS?
2. **Certificate Management**: Fly.io API vs manual addition?
3. **Billing**: Stripe vs Paddle vs manual invoicing?
4. **npm Package**: Publish `@mcp-bridge/cloud-connector` or copy files?
5. **Monorepo**: Should mcp-bridge and mcp-bridge-cloud merge?

---

## Resources

- **Supabase Docs**: https://supabase.com/docs/guides/auth
- **Fly.io API**: https://fly.io/docs/reference/api/
- **Svelte Tutorial**: https://svelte.dev/tutorial
- **Fastify Static**: https://github.com/fastify/fastify-static
- **WebSocket Testing**: https://www.piesocket.com/websocket-tester

---

## Contact

- **Maintainer**: articat-1066@gmail.com
- **Repo**: mcp-bridge-cloud
- **Production**: https://mcp-bridge.xyz
- **Status**: https://mcp-bridge.xyz/healthz

---

**Last Updated**: October 30, 2025
**Next Review**: After Phase 2 completion
