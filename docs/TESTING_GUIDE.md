# Testing Guide - Dashboard Implementation

**Before Deployment Checklist**

---

## Prerequisites

- [ ] Node.js 18+ installed
- [ ] Supabase project created with auth enabled
- [ ] Supabase credentials available (URL + anon key + service key)
- [ ] Fly.io CLI installed and authenticated
- [ ] Access to mcp-bridge-cloud Fly.io app

---

## Part 1: Local Development Testing

### Step 1: Install Dependencies

```bash
# Install server dependencies
cd server
npm install

# Install dashboard dependencies
cd ../dashboard
npm install
```

### Step 2: Configure Environment

**Server Environment** (`server/.env`):
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=eyJxxx...service-key
SUPABASE_ANON_KEY=eyJxxx...anon-key
PORT=8080
NODE_ENV=development
```

**Dashboard Environment** (`dashboard/.env`):
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx...anon-key
```

### Step 3: Start Development Servers

**Terminal 1 - Server:**
```bash
cd server
npm run dev
```

Expected output:
```
╔════════════════════════════════════════════════════════════════╗
║         MCP Bridge Cloud - Tunnel Relay Server                ║
╠════════════════════════════════════════════════════════════════╣
║  HTTP Server: http://0.0.0.0:8080                          ║
║  WebSocket:   ws://localhost:8080/tunnel                      ║
╚════════════════════════════════════════════════════════════════╝

✓ Server ready to accept tunnel connections
```

**Terminal 2 - Dashboard:**
```bash
cd dashboard
npm run dev
```

Expected output:
```
  VITE v5.0.11  ready in 234 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### Step 4: Test Authentication Flow

**Test Signup:**
1. [ ] Open http://localhost:5173
2. [ ] Click "Sign up"
3. [ ] Enter test credentials:
   - Email: test@example.com
   - Password: password123
   - Username: testuser
   - Subdomain: testuser
4. [ ] Click "Sign Up"
5. [ ] Verify redirect to dashboard
6. [ ] Check console for errors

**Expected Result:**
- Dashboard loads showing:
  - Welcome message
  - Subdomain: testuser.mcp-bridge.xyz
  - API key (64 characters)
  - Tunnel status: Disconnected
  - Usage: 0 requests

**Test Login:**
1. [ ] Click "Sign Out"
2. [ ] Enter same credentials
3. [ ] Click "Sign In"
4. [ ] Verify dashboard loads again

**Test Subdomain Validation:**
1. [ ] Sign out
2. [ ] Click "Sign up"
3. [ ] Enter subdomain "testuser" (already taken)
4. [ ] Verify "Not available" message appears
5. [ ] Try subdomain "testuser2"
6. [ ] Verify "✓ Available" message appears

### Step 5: Test API Endpoints

**Test GET /api/account:**
```bash
# Get your JWT token from browser localStorage (key: "supabase.auth.token")
TOKEN="your-jwt-token-here"

curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8080/api/account
```

Expected response:
```json
{
  "username": "testuser",
  "subdomain": "testuser",
  "api_key": "abc123...",
  "email": "test@example.com",
  "url": "https://testuser.mcp-bridge.xyz"
}
```

**Test GET /api/account/metrics:**
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8080/api/account/metrics
```

Expected response:
```json
{
  "requests_count": 0,
  "status": "disconnected",
  "last_seen": null
}
```

**Test GET /api/check-subdomain:**
```bash
curl "http://localhost:8080/api/check-subdomain?subdomain=available123"
```

Expected response:
```json
{
  "subdomain": "available123",
  "available": true
}
```

### Step 6: Test Dashboard Features

**Test API Key Copy:**
1. [ ] Click "Copy Key" button
2. [ ] Paste into text editor
3. [ ] Verify 64-character hex string

**Test API Key Regeneration:**
1. [ ] Note current API key
2. [ ] Click "Regenerate" button
3. [ ] Confirm dialog
4. [ ] Verify new API key displayed
5. [ ] Verify new key is different from old key

**Test Tunnel Status:**
1. [ ] Start local mcp-bridge client (if available)
2. [ ] Connect with API key
3. [ ] Verify status changes to "Connected"
4. [ ] Verify green indicator appears
5. [ ] Stop client
6. [ ] Verify status changes to "Disconnected" within 10s

### Step 7: Test Static File Serving

**Build Dashboard:**
```bash
cd dashboard
npm run build
```

Expected output:
```
vite v5.0.11 building for production...
✓ 45 modules transformed.
dist/index.html                   0.48 kB
dist/assets/index-abc123.css      3.12 kB
dist/assets/index-def456.js      45.67 kB
✓ built in 1.23s
```

**Test Production Build:**
1. [ ] Stop dashboard dev server
2. [ ] Visit http://localhost:8080
3. [ ] Verify dashboard loads (served by Fastify)
4. [ ] Test signup/login flows
5. [ ] Verify all features work

---

## Part 2: Production Deployment Testing

### Step 1: Pre-Deployment Checks

**Verify Secrets:**
```bash
flyctl secrets list --app mcp-bridge-cloud
```

Required secrets:
- [ ] SUPABASE_URL
- [ ] SUPABASE_SERVICE_KEY
- [ ] SUPABASE_ANON_KEY

**Set Dashboard Build-Time Variables:**

Option A - Build args in fly.toml:
```toml
[build]
  [build.args]
    VITE_SUPABASE_URL = "https://xxx.supabase.co"
    VITE_SUPABASE_ANON_KEY = "eyJxxx..."
```

Option B - Environment variables:
```bash
export VITE_SUPABASE_URL="https://xxx.supabase.co"
export VITE_SUPABASE_ANON_KEY="eyJxxx..."
```

### Step 2: Deploy

```bash
flyctl deploy --app mcp-bridge-cloud
```

Expected output:
```
==> Building image
...
--> Building stage 1: dashboard-builder
...
--> Building stage 2: production server
...
==> Pushing image to registry
==> Deploying
...
--> v42 deployed successfully
```

Watch logs:
```bash
flyctl logs --app mcp-bridge-cloud
```

### Step 3: Production Smoke Tests

**Test Health Check:**
```bash
curl https://mcp-bridge.xyz/healthz
```

Expected:
```json
{
  "status": "ok",
  "timestamp": "2025-10-30T...",
  "service": "mcp-bridge-cloud"
}
```

**Test Dashboard Loads:**
```bash
curl -I https://mcp-bridge.xyz
```

Expected:
```
HTTP/2 200
content-type: text/html
...
```

**Test in Browser:**
1. [ ] Visit https://mcp-bridge.xyz
2. [ ] Verify dashboard loads (no 404)
3. [ ] Verify login form appears
4. [ ] Check browser console for errors

### Step 4: End-to-End Production Test

**Create Real User Account:**
1. [ ] Visit https://mcp-bridge.xyz
2. [ ] Click "Sign up"
3. [ ] Enter real email address
4. [ ] Choose unique subdomain (e.g., your-name-test)
5. [ ] Create account
6. [ ] Verify dashboard loads
7. [ ] Copy API key

**Provision SSL Certificate:**
```bash
flyctl certs add your-subdomain.mcp-bridge.xyz --app mcp-bridge-cloud
```

Wait 30-60 seconds, then check:
```bash
flyctl certs show your-subdomain.mcp-bridge.xyz --app mcp-bridge-cloud
```

Expected:
```
Certificate
  Hostname               = your-subdomain.mcp-bridge.xyz
  ...
  Issued                 = rsa,ecdsa
```

**Test Tunnel Connection:**
```bash
# If mcp-bridge CLI available
mcp-bridge --cloud --api-key YOUR_API_KEY

# Otherwise, test with WebSocket client
```

**Send Test Request:**
```bash
curl https://your-subdomain.mcp-bridge.xyz/healthz
```

Expected:
- If tunnel connected: Response from local adapter
- If tunnel offline: Error "Tunnel offline"

**Verify Metrics Update:**
1. [ ] Send several requests to your subdomain
2. [ ] Refresh dashboard
3. [ ] Verify request count increments
4. [ ] Verify tunnel status shows "Connected"

### Step 5: Test User Workflows

**Test API Key Regeneration in Production:**
1. [ ] Click "Regenerate" in dashboard
2. [ ] Copy new API key
3. [ ] Disconnect old client
4. [ ] Connect client with new API key
5. [ ] Verify old key returns 401
6. [ ] Verify new key works

**Test Login Persistence:**
1. [ ] Log in to dashboard
2. [ ] Close browser tab
3. [ ] Reopen https://mcp-bridge.xyz
4. [ ] Verify auto-login (session persists)

**Test Logout:**
1. [ ] Click "Sign Out"
2. [ ] Verify redirect to login page
3. [ ] Try to access /api/account with old token
4. [ ] Verify 401 Unauthorized

---

## Part 3: Edge Cases & Error Handling

### Authentication Errors

**Test Invalid Credentials:**
- [ ] Try login with wrong password → expect error message
- [ ] Try login with non-existent email → expect error message
- [ ] Try signup with existing email → expect "Email already registered"

**Test Invalid Tokens:**
```bash
# Test expired token
curl -H "Authorization: Bearer expired-token" \
  https://mcp-bridge.xyz/api/account

# Expected: 401 Unauthorized
```

### Subdomain Validation

**Test Invalid Subdomains:**
- [ ] UPPERCASE → should auto-convert to lowercase
- [ ] special@chars → should show error
- [ ] too-short (ab) → should show error (min 3 chars)
- [ ] underscore_test → should reject (no underscores allowed)

### API Error Handling

**Test 404 Routes:**
```bash
curl https://mcp-bridge.xyz/nonexistent-route
```

**Test Missing Auth:**
```bash
curl https://mcp-bridge.xyz/api/account
# Expected: 401 Unauthorized
```

### Database Conflicts

**Test Duplicate Subdomain:**
1. [ ] Create user with subdomain "duplicate-test"
2. [ ] Try to create another user with same subdomain
3. [ ] Expected: "Subdomain already taken"

---

## Part 4: Performance Testing

### Load Time

**Measure Dashboard Load:**
```bash
# Using curl with timing
curl -w "\nTime: %{time_total}s\n" -o /dev/null -s https://mcp-bridge.xyz
```

Expected: < 2 seconds

### Bundle Size

**Check Built Files:**
```bash
cd dashboard/dist
ls -lh assets/
```

Expected:
- CSS: ~3-5 KB
- JS: ~40-50 KB gzipped

### API Response Time

**Measure API Latency:**
```bash
for i in {1..10}; do
  curl -w "%{time_total}\n" -o /dev/null -s \
    -H "Authorization: Bearer $TOKEN" \
    https://mcp-bridge.xyz/api/account
done
```

Expected: < 200ms average

---

## Part 5: Security Testing

### Authentication Security

**Test JWT Expiration:**
1. [ ] Log in to dashboard
2. [ ] Wait for JWT to expire (default: 1 hour)
3. [ ] Try to access /api/account
4. [ ] Verify 401 Unauthorized
5. [ ] Refresh page
6. [ ] Verify Supabase auto-refreshes token

**Test Authorization:**
- [ ] User A cannot access User B's data (enforced by RLS)
- [ ] Invalid API keys rejected with 1008 WebSocket close code
- [ ] Missing Authorization header returns 401

### Input Validation

**Test XSS Prevention:**
```bash
# Try malicious subdomain
curl "https://mcp-bridge.xyz/api/check-subdomain?subdomain=<script>alert(1)</script>"
```

Expected: Validation error or safe handling

**Test SQL Injection:**
```bash
# Try SQL in subdomain
curl "https://mcp-bridge.xyz/api/check-subdomain?subdomain=test' OR '1'='1"
```

Expected: Validation error or parameterized query prevents injection

---

## Troubleshooting Guide

### Dashboard Won't Load

**Symptoms**: 404 or blank page at https://mcp-bridge.xyz

**Checks:**
```bash
# 1. Check if dist/ exists
flyctl ssh console --app mcp-bridge-cloud
ls -la /app/dashboard/dist/

# 2. Check server logs
flyctl logs --app mcp-bridge-cloud | grep -i "dashboard"

# 3. Verify static file serving registered
# Should see: "✓ Dashboard static files registered"
```

**Solution:**
- Rebuild with `flyctl deploy`
- Ensure dashboard builds successfully in Dockerfile

### Supabase Auth Errors

**Symptoms**: "Invalid API credentials" in browser console

**Checks:**
```bash
# 1. Verify environment variables
echo $VITE_SUPABASE_URL
echo $VITE_SUPABASE_ANON_KEY

# 2. Check Supabase dashboard
# Settings → API → Verify URL and anon key match
```

**Solution:**
- Update `.env` with correct credentials
- Rebuild dashboard: `npm run build`

### API Endpoints Return 404

**Symptoms**: POST /api/auth/signup returns 404

**Checks:**
```bash
# Check server logs for route registration
flyctl logs | grep -i "api"

# Test health check
curl https://mcp-bridge.xyz/healthz
```

**Solution:**
- Verify `server/src/api-routes.js` exists
- Verify routes registered in `server/src/index.js`
- Redeploy

### Certificate Provisioning Fails

**Symptoms**: `flyctl certs add` times out or fails

**Checks:**
```bash
# Check DNS resolution
dig your-subdomain.mcp-bridge.xyz

# Check Fly.io status
flyctl status --app mcp-bridge-cloud
```

**Solution:**
- Wait 5 minutes and retry
- Remove and re-add: `flyctl certs remove ...` then `flyctl certs add ...`
- Check Fly.io dashboard for errors

---

## Success Criteria

Dashboard implementation is **COMPLETE** when:

- [x] Dashboard builds without errors
- [x] Users can sign up via web UI
- [x] Users can log in with credentials
- [x] Users see subdomain and API key
- [x] Users can copy API key
- [x] Users can regenerate API key
- [x] Tunnel status updates correctly
- [x] Usage metrics display accurately
- [x] Static files served correctly in production
- [x] API endpoints respond correctly
- [x] JWT authentication works
- [x] No console errors in browser
- [x] SSL certificates provision successfully
- [x] End-to-end flow tested with real user

---

## Test Results Log

**Test Date**: ___________
**Tester**: ___________

| Test | Status | Notes |
|------|--------|-------|
| Local dev server starts | ☐ | |
| Dashboard dev server starts | ☐ | |
| User signup works | ☐ | |
| User login works | ☐ | |
| API key displayed | ☐ | |
| API key copy works | ☐ | |
| API key regenerate works | ☐ | |
| Tunnel status updates | ☐ | |
| Usage metrics display | ☐ | |
| Dashboard builds | ☐ | |
| Production deploys | ☐ | |
| Dashboard loads in prod | ☐ | |
| API endpoints work in prod | ☐ | |
| SSL cert provisions | ☐ | |
| End-to-end test passes | ☐ | |

---

**Next Step**: Once all tests pass, mark Phase 2 as COMPLETE and proceed to Phase 3 (CLI Integration)! 🚀
