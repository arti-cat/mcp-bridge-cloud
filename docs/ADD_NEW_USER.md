# Adding a New User to MCP Bridge Cloud

**Quick Reference Guide for Developer Operations**

## Prerequisites

- Supabase access to `mcp-bridge-cloud` project
- Fly.io CLI installed and authenticated (`flyctl auth login`)
- Access to `mcp-bridge-cloud` Fly.io app

## Step 1: Generate API Key

```bash
# Generate a secure 64-character API key
openssl rand -hex 32
```

**Output example**: `a1b2c3d4e5f6...` (64 characters)

## Step 2: Create Database Record

Open Supabase SQL Editor and run:

```sql
INSERT INTO users (email, username, subdomain, api_key)
VALUES (
  'user@example.com',      -- User's email
  'username',              -- Chosen username
  'username',              -- Subdomain (usually same as username)
  'a1b2c3d4e5f6...'       -- API key from Step 1
);
```

**Note**: `subdomain` must be unique and DNS-safe (lowercase, alphanumeric, hyphens only).

## Step 3: Add SSL Certificate

```bash
flyctl certs add username.mcp-bridge.xyz --app mcp-bridge-cloud
```

**Expected output**:
```
Certificate hostname: username.mcp-bridge.xyz
Status: Issued
```

**If certificate already exists**: Check status with `flyctl certs show username.mcp-bridge.xyz`

## Step 4: Verify Certificate

```bash
flyctl certs show username.mcp-bridge.xyz --app mcp-bridge-cloud
```

**Wait for status**: `Issued` (usually takes 30-60 seconds)

## Step 5: Test Connection

Update [client/test-connection.js](../client/test-connection.js):

```javascript
const config = {
  apiKey: 'a1b2c3d4e5f6...',  // User's API key
  tunnelUrl: 'wss://mcp-bridge.xyz',
  localPort: 3000,
  debug: true,
};
```

Run test:

```bash
cd client
node test-connection.js
```

**Expected output**:
```
✅ CONNECTED!
   URL: https://username.mcp-bridge.xyz
   Subdomain: username
```

## Step 6: Provide User Credentials

Send to user:

```
Your MCP Bridge Cloud credentials:

  Email:     user@example.com
  Subdomain: username.mcp-bridge.xyz
  API Key:   a1b2c3d4e5f6... (64 characters)

Connect with:
  mcp-bridge --cloud --api-key YOUR_API_KEY

Your tunnel URL: https://username.mcp-bridge.xyz
```

## Troubleshooting

### Certificate Not Issued After 5 Minutes

```bash
# Check certificate status
flyctl certs show username.mcp-bridge.xyz

# If stuck, remove and re-add
flyctl certs remove username.mcp-bridge.xyz
flyctl certs add username.mcp-bridge.xyz
```

### WebSocket Connection Fails

1. **Check database record**: Verify API key matches exactly
2. **Check certificate**: Ensure status is "Issued", not "Pending"
3. **Check logs**: `flyctl logs --app mcp-bridge-cloud`
4. **Test health**: `curl https://mcp-bridge.xyz/healthz`

### "Subdomain Already Exists" Error

```sql
-- Check existing subdomains
SELECT username, subdomain FROM users WHERE subdomain = 'username';

-- Update if needed
UPDATE users SET subdomain = 'username2' WHERE username = 'username';
```

## Current Limitations (Temporary)

- **Manual certificate per user**: Each subdomain requires `flyctl certs add`
- **Rate limit**: Fly.io may limit rapid certificate issuance
- **Migration planned**: After **Oct 31, 2025 08:22 UTC**, will restore Caddy with wildcard SSL (no manual certs)

## Quick Command Reference

```bash
# List all certificates
flyctl certs list --app mcp-bridge-cloud

# Check specific certificate
flyctl certs show username.mcp-bridge.xyz

# View logs
flyctl logs --app mcp-bridge-cloud

# Check app status
flyctl status --app mcp-bridge-cloud

# SSH into machine (advanced)
flyctl ssh console --app mcp-bridge-cloud
```

## Database Schema Reference

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  subdomain TEXT UNIQUE NOT NULL,
  api_key TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Future Changes

After Let's Encrypt rate limit expires (**Oct 31, 2025 08:22 UTC**):

1. Restore Caddy with wildcard SSL certificate (`*.mcp-bridge.xyz`)
2. Remove manual certificate management requirement
3. Automatic SSL for all subdomains
4. Update this guide accordingly

---

**Last Updated**: Oct 30, 2025
**Status**: Production - Manual Cert Management
**Next Review**: Nov 1, 2025 (after rate limit expires)
