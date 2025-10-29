# MCP Bridge Cloud - Setup Guide

Complete guide to deploying your own persistent tunnel service.

---

## Prerequisites

- Node.js 18+
- Supabase account (free tier works)
- Domain name (e.g., `mcpbridge.io`)
- Cloudflare account (for DNS)
- Fly.io account (for hosting) OR your own VPS

---

## Part 1: Supabase Setup

### 1.1 Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Choose a name (e.g., "mcp-bridge-cloud")
4. Set a strong database password
5. Select region (closest to your users)
6. Wait for project to provision (~2 minutes)

### 1.2 Create Database Tables

1. Go to SQL Editor in Supabase dashboard
2. Run this SQL:

```sql
-- Users table
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

-- Tunnels table
CREATE TABLE tunnels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  subdomain VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'disconnected',
  last_seen TIMESTAMP DEFAULT NOW(),
  requests_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, subdomain)
);

CREATE INDEX idx_tunnels_subdomain ON tunnels(subdomain);
CREATE INDEX idx_tunnels_user_id ON tunnels(user_id);

-- Function to increment request count
CREATE OR REPLACE FUNCTION increment_tunnel_requests(p_subdomain VARCHAR)
RETURNS VOID AS $$
BEGIN
  UPDATE tunnels
  SET requests_count = requests_count + 1,
      last_seen = NOW()
  WHERE subdomain = p_subdomain;
END;
$$ LANGUAGE plpgsql;
```

### 1.3 Get API Keys

1. Go to Project Settings → API
2. Copy these values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJxxxxx...`
   - **service_role key**: `eyJxxxxx...` (keep this secret!)

### 1.4 Create Test User

Run this in SQL Editor:

```sql
INSERT INTO users (email, username, subdomain, api_key)
VALUES (
  'test@example.com',
  'testuser',
  'testuser',
  'test_api_key_123'  -- Change this to something secure
);
```

---

## Part 2: Domain & DNS Setup

### 2.1 Purchase Domain

Buy a domain (e.g., `mcpbridge.io`) from:
- Namecheap (~$12/year)
- Google Domains
- Cloudflare Registrar

### 2.2 Point DNS to Cloudflare

1. Sign up for Cloudflare (free tier)
2. Add your domain to Cloudflare
3. Update nameservers at your registrar
4. Wait for DNS propagation (~24 hours max)

### 2.3 Get Cloudflare API Token

1. Go to Cloudflare Dashboard → My Profile → API Tokens
2. Click "Create Token"
3. Use template: "Edit zone DNS"
4. Select your domain
5. Copy the token (starts with "ey...")

---

## Part 3: Deploy to Fly.io

### 3.1 Install Fly CLI

```bash
# macOS/Linux
curl -L https://fly.io/install.sh | sh

# Or via Homebrew
brew install flyctl
```

### 3.2 Login to Fly.io

```bash
flyctl auth login
```

### 3.3 Set Environment Variables

```bash
cd /path/to/mcp-bridge-cloud

# Set secrets (not stored in fly.toml)
flyctl secrets set \
  SUPABASE_URL="https://xxxxx.supabase.co" \
  SUPABASE_ANON_KEY="eyJxxxxx..." \
  SUPABASE_SERVICE_KEY="eyJxxxxx..." \
  CLOUDFLARE_API_TOKEN="eyxxxxx..."
```

### 3.4 Deploy

```bash
# First deployment (creates app)
flyctl launch

# Follow prompts:
# - App name: mcp-bridge-cloud (or auto-generate)
# - Region: Choose closest to users
# - PostgreSQL: No (we're using Supabase)
# - Redis: No

# Deploy
flyctl deploy
```

### 3.5 Get Fly.io IP Address

```bash
flyctl ips list
```

You'll see something like:
```
IPv4: 66.241.125.XXX
IPv6: 2a09:8280:1::XXXX
```

### 3.6 Update DNS in Cloudflare

1. Go to Cloudflare DNS settings
2. Add A record:
   - **Name**: `@` (for `mcpbridge.io`)
   - **IPv4**: Your Fly.io IPv4
   - **Proxy**: OFF (important!)

3. Add A record for wildcard:
   - **Name**: `*`
   - **IPv4**: Your Fly.io IPv4
   - **Proxy**: OFF

4. Add AAAA record (IPv6):
   - **Name**: `@`
   - **IPv6**: Your Fly.io IPv6

5. Add AAAA wildcard:
   - **Name**: `*`
   - **IPv6**: Your Fly.io IPv6

---

## Part 4: Install Caddy (On Fly.io or Separate VPS)

### Option A: Add Caddy to Fly.io Deployment

Update `Dockerfile` to include Caddy:

```dockerfile
FROM caddy:2-builder AS caddy-builder
RUN xcaddy build \
  --with github.com/caddy-dns/cloudflare

FROM node:18-alpine
# Copy Caddy binary
COPY --from=caddy-builder /usr/bin/caddy /usr/bin/caddy
# ... rest of Dockerfile
```

### Option B: Deploy Caddy Separately

If you have a VPS:

```bash
# Install Caddy with Cloudflare DNS module
curl https://caddyserver.com/api/download?os=linux&arch=amd64&p=github.com/caddy-dns/cloudflare -o caddy
chmod +x caddy
mv caddy /usr/local/bin/

# Copy Caddyfile
sudo cp Caddyfile /etc/caddy/Caddyfile

# Set environment variable
export CLOUDFLARE_API_TOKEN="your-token"

# Start Caddy
sudo caddy run --config /etc/caddy/Caddyfile
```

---

## Part 5: Test the Setup

### 5.1 Check Server is Running

```bash
curl https://mcpbridge.io/healthz
# Should return: {"status":"ok",...}
```

### 5.2 Test WebSocket Connection

```bash
cd client
npm install

# Test connection
node -e "
const CloudConnector = require('./lib/cloud-connector.js');
const client = new CloudConnector({
  apiKey: 'test_api_key_123',
  tunnelUrl: 'wss://mcpbridge.io',
  localPort: 3000,
  debug: true
});
client.connect().then(result => {
  console.log('Connected:', result);
});
"
```

### 5.3 Test with Real mcp-bridge

```bash
# In another terminal, start local MCP adapter
cd /path/to/mcp-bridge
npm start

# In original terminal, connect to cloud
mcp-bridge --cloud --api-key test_api_key_123

# You should see:
# ✓ Connected to cloud
# Your persistent URL: https://testuser.mcpbridge.io
```

### 5.4 Test with ChatGPT

1. Go to ChatGPT Developer Mode
2. Add MCP Server: `https://testuser.mcpbridge.io`
3. Try a command: "List files in the current directory"
4. Should work!

---

## Part 6: Create More Users

### 6.1 Via SQL (Manual)

```sql
INSERT INTO users (email, username, subdomain, api_key)
VALUES (
  'user@example.com',
  'john',
  'john',
  'sk_xxxxxxxxxxxxxxxxxxxxxxxx'  -- Generate secure random key
);
```

### 6.2 Via API (Future: Add signup endpoint)

TODO: Create signup endpoint that:
- Accepts email/username
- Generates API key
- Creates subdomain
- Returns credentials

---

## Part 7: Monitoring

### 7.1 Check Fly.io Logs

```bash
flyctl logs
```

### 7.2 Check Active Connections

```bash
curl https://mcpbridge.io/api/status/testuser
```

### 7.3 Supabase Dashboard

Monitor database:
- Active users
- Tunnel status
- Request counts

---

## Troubleshooting

### Issue: "Tunnel not connected"

**Solution:**
- Check mcp-bridge is running locally
- Verify API key is correct
- Check Fly.io logs for errors

### Issue: SSL certificate error

**Solution:**
- Verify DNS records in Cloudflare
- Check Caddy logs
- Ensure Cloudflare API token has DNS edit permissions

### Issue: Connection timeout

**Solution:**
- Check Fly.io is running: `flyctl status`
- Verify firewall allows WebSocket connections
- Test with: `curl https://mcpbridge.io/healthz`

---

## Costs

### Estimated Monthly Costs

- **Supabase**: Free (up to 500MB)
- **Fly.io**: ~$5-10/mo (1 VM)
- **Domain**: ~$1/mo (amortized)
- **Cloudflare**: Free
- **Total**: ~$7-12/mo

### Scaling Costs

- 100 users: ~$10/mo
- 1,000 users: ~$50/mo
- 10,000 users: ~$200/mo

---

## Security Considerations

1. **API Keys**: Use strong random keys (64+ chars)
2. **Rate Limiting**: Add rate limits to prevent abuse
3. **Row Level Security**: Enabled in Supabase
4. **HTTPS Only**: All traffic encrypted
5. **Environment Variables**: Never commit secrets to git

---

## Next Steps

1. ✅ Deploy server
2. ✅ Test with mcp-bridge
3. ⏳ Build signup dashboard (Next.js)
4. ⏳ Add Stripe integration
5. ⏳ Launch beta!

---

## Support

- GitHub Issues: https://github.com/arti-cat/mcp-bridge-cloud
- Email: articat1066@gmail.com
