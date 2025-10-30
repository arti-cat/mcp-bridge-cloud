# Restore Caddy SSL Architecture

**Date Created**: October 30, 2025
**Applicable After**: October 31, 2025 08:22 UTC (when Let's Encrypt rate limit expires)
**Current Status**: Using Fly.io HTTP service (temporary workaround)

---

## Why Restore Caddy?

### Current Setup (Temporary)
- **SSL Provider**: Fly.io built-in certificates
- **Per-User Setup**: Manual `flyctl certs add username.mcp-bridge.xyz` (18 seconds each)
- **Scalability**: Low (manual work per user)

### Caddy Setup (Target)
- **SSL Provider**: Caddy with Let's Encrypt (via Cloudflare DNS-01)
- **Per-User Setup**: Automatic (zero manual work)
- **Scalability**: High (wildcard certificate covers all users)

---

## Prerequisites

1. **Date Check**: Ensure current date is **after October 31, 2025 08:22 UTC**
   ```bash
   date -u
   # Must show October 31, 2025 08:22 or later
   ```

2. **Files Ready**: Verify restoration files exist
   ```bash
   ls -lh Dockerfile.caddy Caddyfile start.sh
   # All three files should exist
   ```

3. **Secrets Configured**: Verify Cloudflare API token
   ```bash
   flyctl secrets list --app mcp-bridge-cloud | grep CLOUDFLARE_API_TOKEN
   # Should show: CLOUDFLARE_API_TOKEN (digest)
   ```

---

## Restoration Steps

### Step 1: Backup Current Working Configuration

```bash
# Create backup of current Dockerfile
cp Dockerfile Dockerfile.flyio-backup
git add Dockerfile.flyio-backup
git commit -m "Backup: Fly.io HTTP service Dockerfile (working as of Oct 30)"
```

### Step 2: Switch to Caddy Configuration

```bash
# Replace Dockerfile with Caddy version
cp Dockerfile.caddy Dockerfile

# Verify Caddyfile is ready (staging CA should be removed)
grep -n "staging" Caddyfile
# Should return no results (staging CA already removed)
```

### Step 3: Update fly.toml for TCP Passthrough

Edit [fly.toml](../fly.toml) and replace the `[http_service]` section with:

```toml
# TCP passthrough - let Caddy handle SSL
[[services]]
  protocol = "tcp"
  internal_port = 443

  [[services.ports]]
    port = 443
    # NO handlers - pass raw TCP to Caddy

  [[services.ports]]
    port = 80
    # NO handlers - Caddy will redirect HTTP → HTTPS

  # Health check on Node.js internal port
  [[services.tcp_checks]]
    interval = "30s"
    timeout = "5s"
    grace_period = "10s"
```

**IMPORTANT**: Remove the entire `[http_service]` block and replace with the `[[services]]` block above.

### Step 4: Deploy

```bash
# Deploy to Fly.io
flyctl deploy --app mcp-bridge-cloud

# This will:
# - Build Docker image with Caddy (~3-4 minutes)
# - Start both Caddy and Node.js
# - Caddy requests wildcard certificate (~30-60 seconds)
```

### Step 5: Monitor Certificate Issuance

```bash
# Watch logs for certificate issuance
flyctl logs --app mcp-bridge-cloud

# Look for these success messages:
# ✓ Caddy started successfully
# certificate obtained successfully: *.mcp-bridge.xyz
# issuer: Let's Encrypt production CA
```

**Expected Timeline**:
- Docker build: 3-4 minutes
- Caddy starts: 2-3 seconds
- Certificate issuance: 30-60 seconds
- **Total**: ~4-5 minutes

---

## Verification

### 1. Check Certificate

```bash
# Should show Let's Encrypt production certificate (NOT staging)
echo | openssl s_client -servername testuser.mcp-bridge.xyz -connect testuser.mcp-bridge.xyz:443 2>/dev/null | openssl x509 -noout -issuer -dates

# Expected output:
# issuer=C=US, O=Let's Encrypt, CN=...
# notBefore=... (current date)
# notAfter=... (90 days from now)
```

### 2. Test HTTPS Endpoint

```bash
curl -I https://mcp-bridge.xyz/healthz
# Expected: HTTP/2 200

curl -I https://testuser.mcp-bridge.xyz
# Expected: HTTP/2 503 (tunnel offline) or 200 if client connected
```

### 3. Test WebSocket Connection

```bash
cd client
node test-connection.js

# Expected:
# ✅ CONNECTED!
#    URL: https://testuser.mcp-bridge.xyz
#    Subdomain: testuser
```

### 4. Verify Wildcard Coverage

```bash
# Try a different subdomain (should work without manual cert add)
curl -I https://newuser.mcp-bridge.xyz
# Should get HTTP response (not TLS error)
```

---

## Troubleshooting

### Issue: Certificate Not Issued After 5 Minutes

**Symptom**: Logs show repeated certificate request attempts

**Check**:
```bash
flyctl logs --app mcp-bridge-cloud | grep -i "error\|failed"
```

**Common Causes**:

1. **Cloudflare API Token Invalid**
   ```bash
   # Verify token in Cloudflare dashboard
   # Regenerate if needed, then update:
   flyctl secrets set CLOUDFLARE_API_TOKEN="new_token" --app mcp-bridge-cloud
   ```

2. **DNS Records Missing**
   ```bash
   # Verify wildcard A record
   dig A testuser.mcp-bridge.xyz
   # Should resolve to Fly.io IP: 66.241.124.212
   ```

3. **Rate Limit Not Expired**
   ```bash
   # Check logs for rate limit error
   flyctl logs --app mcp-bridge-cloud | grep -i "rate"
   # If still rate limited, wait until Oct 31, 08:22 UTC
   ```

### Issue: TLS Handshake Errors

**Symptom**: `curl: (35) error:0A000438:SSL routines::tlsv1 alert internal error`

**Debug**:
```bash
# SSH into container
flyctl ssh console --app mcp-bridge-cloud

# Check if Caddy is running
ps aux | grep caddy
# Should show: caddy run --config /etc/caddy/Caddyfile

# Check Caddy's view of certificates
caddy list-certificates
# Should show *.mcp-bridge.xyz with valid Let's Encrypt cert

# Check Caddy logs
cat /var/log/caddy/access.log
# Should show incoming requests (if empty, requests not reaching Caddy)
```

**Fix**:
```bash
# Restart deployment to clear any cached state
flyctl apps restart mcp-bridge-cloud
```

### Issue: "Caddy failed to start"

**Symptom**: Logs show Caddy error on startup

**Debug**:
```bash
# SSH into container
flyctl ssh console --app mcp-bridge-cloud

# Validate Caddyfile syntax
caddy validate --config /etc/caddy/Caddyfile
# Should show: Valid configuration

# Try starting Caddy manually
caddy run --config /etc/caddy/Caddyfile
# Look for specific error messages
```

**Common Fixes**:
- Check CLOUDFLARE_API_TOKEN is set: `echo $CLOUDFLARE_API_TOKEN`
- Verify Caddyfile syntax: `caddy fmt /etc/caddy/Caddyfile --overwrite`

---

## Rollback Plan

If Caddy restoration fails, quickly rollback to working Fly.io HTTP service:

```bash
# Option 1: Revert to previous release
flyctl releases --app mcp-bridge-cloud
flyctl releases rollback <previous_version> --app mcp-bridge-cloud

# Option 2: Restore from backup
cp Dockerfile.flyio-backup Dockerfile

# Edit fly.toml - restore [http_service] section
# (see current fly.toml for working config)

flyctl deploy --app mcp-bridge-cloud
```

**Rollback Time**: ~2-3 minutes (uses cached image)

---

## Post-Restoration Checklist

After successful Caddy restoration:

- [ ] Verify production Let's Encrypt certificate active
- [ ] Test WebSocket connection with test user
- [ ] Create new test user and verify subdomain works immediately (no manual cert add)
- [ ] Monitor logs for 24 hours to ensure stability
- [ ] Update DEPLOYMENT_STATUS.md with new architecture
- [ ] Remove `Dockerfile.flyio-backup` after 1 week of stable operation

---

## Benefits After Restoration

### Before (Fly.io HTTP Service)
```bash
# For each new user:
flyctl certs add username.mcp-bridge.xyz --app mcp-bridge-cloud
# Wait ~18 seconds
# Repeat for every user
```

### After (Caddy Wildcard SSL)
```bash
# For each new user:
# Nothing! Subdomain works immediately.
```

**Time Saved**:
- Per user: 18 seconds → 0 seconds
- 100 users: 30 minutes → 0 minutes
- 1000 users: 5 hours → 0 minutes

**Operational Benefits**:
- Zero manual intervention
- Instant subdomain activation
- Automatic certificate renewal (every 60 days)
- Industry-standard architecture

---

## Architecture Comparison

### Current (Temporary - Fly.io SSL)
```
User Request (HTTPS)
    ↓
Fly.io Edge (SSL termination with individual certs)
    ↓
Node.js:8080 (HTTP)
    ↓
WebSocket Tunnel Server
```

### After Restoration (Caddy SSL)
```
User Request (HTTPS)
    ↓
Fly.io Edge (TCP passthrough, no SSL)
    ↓
Caddy:443 (SSL termination with wildcard cert)
    ↓
Node.js:8080 (HTTP)
    ↓
WebSocket Tunnel Server
```

**Key Difference**: SSL handling moves from Fly.io edge (manual per-user certs) to Caddy (automatic wildcard cert).

---

## Related Documentation

- [CADDY_IMPLEMENTATION.md](../CADDY_IMPLEMENTATION.md) - Original Caddy implementation guide
- [DEPLOYMENT_STATUS.md](../DEPLOYMENT_STATUS.md) - Current deployment status
- [Caddyfile](../Caddyfile) - Caddy configuration (ready for production)
- [Dockerfile.caddy](../Dockerfile.caddy) - Caddy-enabled Dockerfile

---

## Summary

**When**: After October 31, 2025 08:22 UTC
**Time Required**: ~10 minutes
**Risk Level**: Low (easy rollback available)
**Benefit**: Zero manual work per user, instant subdomain activation

**Steps**:
1. ✅ Verify date after Oct 31, 08:22 UTC
2. ✅ Copy Dockerfile.caddy → Dockerfile
3. ✅ Update fly.toml for TCP passthrough
4. ✅ Deploy and monitor certificate issuance
5. ✅ Test and verify

**Result**: Production-ready wildcard SSL with zero manual intervention per user.

---

**Last Updated**: October 30, 2025 05:30 UTC
**Status**: Ready for execution after rate limit expiry
