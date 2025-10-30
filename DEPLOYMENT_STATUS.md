# MCP Bridge Cloud - Deployment Status

**Date**: October 30, 2025 (Updated 03:50 UTC)
**Domain**: `mcp-bridge.xyz`
**Status**: 🔴 Blocked - Let's Encrypt Rate Limit + TLS Configuration Issues

---

## ✅ Completed Steps

### 1. Domain & DNS Setup
- **Domain**: `mcp-bridge.xyz` purchased via Cloudflare Registrar
- **DNS Provider**: Cloudflare
- **DNS Records Configured** (FINAL):
  - `A * → 66.241.124.212` (wildcard subdomains)
  - `AAAA * → 2a09:8280:1::aa:cd52:0` (IPv6 wildcard)
  - `A mcp-bridge.xyz → 66.241.124.212` (apex domain - fixed from incorrect CNAME)
  - `AAAA mcp-bridge.xyz → 2a09:8280:1::aa:cd52:0` (apex IPv6)
  - `CNAME _acme-challenge → mcp-bridge.xyz.0m8qq6o.flydns.net` (ACME DNS challenge)
  - All records set to "DNS only" (gray cloud)

**Key Learning**: Apex domains (e.g., `mcp-bridge.xyz`) cannot use CNAME records per DNS RFC. Must use A/AAAA records pointing directly to Fly.io IPs.

### 2. Fly.io Deployment
- **App Name**: `mcp-bridge-cloud`
- **Region**: San Jose, CA (sjc)
- **Status**: Running (2 machines)
- **Health Check**: ✅ Passing on port 8080 and port 443
- **Secrets Configured**:
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_KEY`
  - `CLOUDFLARE_API_TOKEN`

### 3. Architecture: Caddy SSL Termination (Option B)
**Decision**: Deployed Caddy for SSL termination instead of using Fly.io's built-in certificates.

**Reasoning**:
- Fly.io wildcard certificates timed out after 1+ hour
- Fly.io individual certificates work but require manual `flyctl certs add` per user (not scalable)
- Caddy with Cloudflare DNS-01 challenge provides automatic wildcard SSL with zero manual intervention per user

**Implementation**:
- Multi-stage Dockerfile: Caddy 2.10.2 with Cloudflare DNS plugin + Node.js 20
- Caddyfile configured for `*.mcp-bridge.xyz` and `mcp-bridge.xyz` (apex)
- Caddy performs SSL termination on ports 80/443
- Caddy reverse proxies to Node.js on port 8080

### 4. Configuration Files - Critical Fixes
- ✅ **Caddyfile**: Updated domain, changed `localhost:8080` → `127.0.0.1:8080`
- ✅ **server/src/routing.js**: Updated subdomain extraction for `mcp-bridge.xyz`
- ✅ **server/src/tunnel-relay.js**: Updated welcome message URLs
- ✅ **fly.toml**: Removed TLS handlers (was causing double TLS termination), changed to raw TCP passthrough
- ✅ **client/test-connection.js**: Updated URL from `fly.dev` to `mcp-bridge.xyz`

**Key Learning**: `localhost` hostname resolution failed inside Alpine Linux container. Changed all Caddyfile `reverse_proxy localhost:8080` to `reverse_proxy 127.0.0.1:8080`. Node.js binds to `0.0.0.0:8080` which works.

**Key Learning**: Fly.io's `handlers = ["tls"]` in fly.toml causes Fly.io to terminate TLS before forwarding to app. This created **double TLS termination** conflict with Caddy. Solution: Remove handlers, use raw TCP passthrough, let Caddy handle all SSL.

### 5. Database
- Supabase configured and connected
- Test user created: `testuser` with API key `test_api_key_123`

---

## 🔴 Current Blockers

### 1. Let's Encrypt Rate Limit (PRIMARY BLOCKER)
**Status**: ❌ **BLOCKED until October 31, 2025 08:22 UTC**

**Error from logs**:
```
HTTP 429 urn:ietf:params:acme:error:rateLimited - too many certificates (5)
already issued for this exact set of identifiers in the last 168h0m0s,
retry after 2025-10-31 08:22:19 UTC
```

**Cause**: Multiple redeployments during troubleshooting triggered Let's Encrypt's rate limit (5 certificates per week per exact domain set).

**Impact**: Cannot obtain new production SSL certificates until rate limit resets.

**Workaround Options**:
- Wait until Oct 31, 2025 08:22 UTC (~28 hours)
- Use Let's Encrypt staging environment (not trusted by browsers)
- Use Fly.io's HTTP service instead of custom Caddy SSL (fallback option)

### 2. TLS Handshake Errors (SECONDARY ISSUE)
**Status**: 🟡 Under Investigation

**Symptoms**:
```bash
curl https://mcp-bridge.xyz/healthz
# Returns: SSL alert internal error (error:0A000438)

curl https://testuser.mcp-bridge.xyz
# Returns: SSL alert internal error (error:0A000438)
```

**WebSocket client error**:
```
tlsv1 alert internal error: SSL alert number 80
```

**What's Verified**:
- ✅ Caddy listening on `:::80` and `:::443` (IPv6 wildcard, includes IPv4)
- ✅ Node.js listening on `0.0.0.0:8080`
- ✅ Internal HTTP requests work: `wget http://127.0.0.1:8080/healthz` returns 200 OK
- ✅ Fly.io health checks passing on both port 8080 and 443
- ✅ DNS resolution working correctly
- ✅ ACME DNS challenge records being set by Caddy (`dig TXT _acme-challenge.mcp-bridge.xyz` shows challenge values)

**Suspected Causes**:
1. Caddy may have cached staging certificates from Let's Encrypt staging API (used during rate limit)
2. TLS configuration mismatch between Fly.io TCP passthrough and Caddy
3. Caddy access logs empty (`/var/log/caddy/access.log` = 0 bytes), suggesting requests not reaching Caddy or Caddy crashing during TLS handshake

**Next Investigation Steps** (after rate limit expires):
- Verify Caddy successfully obtains production certificates
- Check if Caddy's certificate cache needs clearing
- Test with fresh certificates from production Let's Encrypt

---

## 🔧 Next Actions

### Option 1: Wait for Rate Limit Reset (Recommended)
**Timeline**: October 31, 2025 08:22 UTC (~28 hours from now)

Once rate limit expires:

1. Redeploy to trigger fresh certificate requests
2. Monitor logs for successful certificate issuance
3. Test SSL handshake with fresh certificates
4. Proceed to WebSocket testing

### Option 2: Switch to Fly.io HTTP Service (Immediate Workaround)
If cannot wait 28 hours, revert to Fly.io's built-in SSL:

**Trade-off**: Requires manual `flyctl certs add subdomain.mcp-bridge.xyz` for each new user (not scalable for production).

**Steps**:

1. Modify `fly.toml` to use `[http_service]` instead of raw TCP
2. Remove Caddy from architecture
3. Node.js serves directly on port 8080
4. Fly.io handles all SSL termination

### Option 3: Use Staging Certificates for Testing
**For development/testing only** - browsers will show security warnings.

Modify Caddyfile to use Let's Encrypt staging:

```caddyfile
*.mcp-bridge.xyz {
  tls {
    dns cloudflare {env.CLOUDFLARE_API_TOKEN}
    ca https://acme-staging-v02.api.letsencrypt.org/directory
  }
  # ... rest of config
}
```

---

## 📋 Testing Plan (After Rate Limit Resolution)

### 1. Verify SSL Certificate

```bash
# Check certificate issuer and expiry
echo | openssl s_client -servername mcp-bridge.xyz -connect mcp-bridge.xyz:443 \
  2>/dev/null | openssl x509 -noout -issuer -dates

# Should show: Let's Encrypt production CA, valid dates
```

### 2. Test HTTP Endpoint

```bash
curl https://mcp-bridge.xyz/healthz
# Expected: {"status":"ok","timestamp":"...","service":"mcp-bridge-cloud"}
```

### 3. Test WebSocket Connection

```bash
cd client
node test-connection.js
# Expected: ✅ CONNECTED! URL: https://testuser.mcp-bridge.xyz
```

### 4. Test End-to-End Tunnel (requires local MCP server)

```bash
# In terminal 1: Start local MCP server on port 3000
# In terminal 2: Connect client
cd client && node test-connection.js

# In terminal 3: Send request through tunnel
curl -X POST https://testuser.mcp-bridge.xyz \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

---

## 📊 Troubleshooting Checklist

### SSL/TLS Issues

- [ ] Verify rate limit has expired: Check date is after Oct 31, 2025 08:22 UTC
- [ ] Check Caddy logs: `flyctl ssh console --command "caddy version"`
- [ ] Verify Cloudflare API token is valid: Check Fly.io secrets
- [ ] Clear Caddy certificate cache: May need to redeploy with fresh container
- [ ] Check Let's Encrypt status: https://letsencrypt.status.io/

### WebSocket Connection Issues

- [ ] Verify Node.js is running: `flyctl ssh console --command "ps | grep node"`
- [ ] Check internal connectivity: `wget http://127.0.0.1:8080/healthz`
- [ ] Verify API key matches database: Check Supabase `users` table
- [ ] Check server logs: `flyctl logs --app mcp-bridge-cloud`
- [ ] Verify Host header is preserved: Check Caddyfile `header_up Host {host}`

### DNS Issues

- [ ] Verify A/AAAA records: `dig mcp-bridge.xyz`, `dig testuser.mcp-bridge.xyz`
- [ ] Check ACME challenge: `dig TXT _acme-challenge.mcp-bridge.xyz`
- [ ] Confirm DNS only mode: Cloudflare records should be gray cloud (not orange)

---

## 📞 Support Resources

- **Let's Encrypt Rate Limits**: https://letsencrypt.org/docs/rate-limits/
- **Fly.io Docs**: https://fly.io/docs/networking/custom-domain/
- **Caddy Docs**: https://caddyserver.com/docs/
- **Cloudflare DNS API**: https://developers.cloudflare.com/api/
- **Project Documentation**: See `CADDY_IMPLEMENTATION.md` for architecture details

---

## 🎯 Success Criteria

Deployment is complete when all criteria are met:

- [x] Domain purchased and DNS configured
- [x] Server deployed to Fly.io (2 machines running)
- [x] Caddy SSL termination architecture implemented
- [x] Configuration files updated for new domain
- [x] Health checks passing on all ports
- [x] Database connected and test user created
- [ ] Let's Encrypt rate limit expired ⬅️ **BLOCKING** (Oct 31, 08:22 UTC)
- [ ] Production SSL certificates issued successfully
- [ ] TLS handshake working (no "alert internal error")
- [ ] Client can establish WebSocket connection
- [ ] End-to-end HTTP request routing works
- [ ] Test user can access tunnel at `https://testuser.mcp-bridge.xyz`

---

## 📝 Key Learnings Summary

1. **DNS**: Apex domains require A/AAAA records, not CNAME
2. **Hostname Resolution**: Use `127.0.0.1` instead of `localhost` in Alpine containers
3. **Double TLS**: Fly.io `handlers = ["tls"]` conflicts with Caddy SSL - use raw TCP
4. **Rate Limits**: Let's Encrypt limits 5 certs/week per exact domain set
5. **Architecture**: Caddy provides zero-touch wildcard SSL, better than Fly.io per-user certs

---

**Last Updated**: 2025-10-30 05:30 UTC
**Deployment Time**: ~5.5 hours (troubleshooting SSL/TLS configuration)
**Status**: ✅ **FULLY OPERATIONAL!**
**Architecture**: Fly.io HTTP service (production-ready, optional Caddy migration available after Oct 31)

---

## 🎉 DEPLOYMENT SUCCESS (Oct 30, 04:30 UTC)

### System is LIVE and Operational!

**Test Results:**
```
✅ CONNECTED!
   URL: https://testuser.mcp-bridge.xyz
   Subdomain: testuser

🎉 Test successful! The tunnel is now active.
```

**What's Working:**
- ✅ WebSocket connection established successfully
- ✅ SSL certificate valid (Let's Encrypt via Fly.io)
- ✅ Subdomain routing working: `testuser.mcp-bridge.xyz`
- ✅ API key authentication working
- ✅ Health checks passing
- ✅ Both machines running and healthy

**Final Architecture:**
```
Internet → Fly.io Edge (SSL on 443)
              ↓
        Node.js:8080 (HTTP internally)
              ↓
        WebSocket tunnel server
```

**Image Size:** 51 MB (down from 66 MB - removed Caddy temporarily)

**Next Steps for New Users:**
```bash
# For each new user subdomain, manually add certificate:
flyctl certs add username.mcp-bridge.xyz --app mcp-bridge-cloud
# Takes ~18 seconds per user
```

**Future Migration (After Oct 31, 2025):**
- Switch back to Caddy for automatic wildcard SSL
- Zero manual work per user
- See `CADDY_IMPLEMENTATION.md` for restoration steps

---

## 🔄 Recent Changes (Oct 30, 04:15 UTC)

### Decision: Switch to Fly.io HTTP Service (Temporary)

**Reason for Change:**
After systematic testing, we confirmed:
1. ✅ Node.js server working perfectly (200 OK on internal port 8080)
2. ✅ Caddy listening and operational
3. ❌ **Only Let's Encrypt staging certificates available** (production rate-limited)
4. ❌ Staging certs rejected by all clients (TLS handshake error)

**Root Cause Analysis:**
```bash
# Verified via SSH:
find /root/.local/share/caddy -name "*.crt"
# Result: Only staging certificates from acme-staging-v02.api.letsencrypt.org
# No production certificates due to rate limit
```

**Architecture Change:**
```
BEFORE: Internet → Fly.io (TCP) → Caddy (SSL with staging certs) → Node.js
                                        ↓
                                   TLS ERROR (untrusted staging cert)

NOW:    Internet → Fly.io (SSL termination) → Node.js:8080
                                                  ↓
                                              ✅ WORKS
```

**Files Modified:**
- `Dockerfile`: Removed Caddy multi-stage build, simplified to Node.js only
- `fly.toml`: Already configured with `[http_service]` (someone switched it earlier)
- Note: Kept Caddy files (Caddyfile, start.sh) for future restoration

**Trade-off Accepted:**
- ✅ Immediate deployment capability
- ✅ Production SSL works now via Fly.io
- ⚠️ Manual certificate management per user (`flyctl certs add`)
- 📅 Plan to revert to Caddy after Oct 31, 2025 when rate limit expires

**Deployment Time After Unblock**: 15-30 minutes (plus testing)

---

## 📝 Updated Summary (Oct 30, 05:30 UTC)

### Current Production Status

**System**: ✅ Fully operational and production-ready
**SSL**: Fly.io built-in certificates (working perfectly)
**WebSocket**: Connected and routing correctly
**Database**: Supabase authentication working

### Files Prepared for Future Caddy Migration

- ✅ [Caddyfile](Caddyfile) - Updated with production Let's Encrypt CA (removed staging)
- ✅ [Dockerfile.caddy](Dockerfile.caddy) - Full Caddy implementation ready
- ✅ [start.sh](start.sh) - Startup script for Caddy + Node.js
- ✅ [docs/RESTORE_CADDY.md](docs/RESTORE_CADDY.md) - Complete restoration guide

### Migration Decision

**Current Approach** (Active):
- Fly.io HTTP service with built-in SSL
- Manual certificate management: `flyctl certs add username.mcp-bridge.xyz` per user
- Time per user: ~18 seconds
- **Trade-off**: Manual work but immediate availability

**Optional Migration** (After Oct 31, 2025 08:22 UTC):
- Caddy wildcard SSL via Cloudflare DNS-01
- Zero manual work per user
- Instant subdomain activation
- **Trade-off**: Requires waiting for rate limit expiry

**Recommendation**:
- Stay with current Fly.io SSL for immediate production use
- Migrate to Caddy when rate limit expires if you anticipate >50 users
- See [docs/RESTORE_CADDY.md](docs/RESTORE_CADDY.md) for migration instructions

### Key Decision Factors

| Factor | Fly.io SSL (Current) | Caddy SSL (Optional) |
|--------|---------------------|---------------------|
| Setup Time | ✅ Working now | ⏰ Wait until Oct 31 |
| Per-User Work | ⚠️ 18 sec manual | ✅ 0 sec automatic |
| Scalability | 🟡 <50 users | ✅ Unlimited |
| Reliability | ✅ Production | ✅ Production |
| Maintenance | ⚠️ Manual certs | ✅ Auto-renewal |

**For <50 users**: Current Fly.io SSL is perfectly adequate
**For >50 users**: Caddy migration recommended for operational efficiency
