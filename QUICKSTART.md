# Quick Start - Test Locally in 5 Minutes

Get the tunnel relay server running locally to test before deploying.

---

## Prerequisites

- Node.js 18+
- Supabase account (free - sign up at supabase.com)

---

## Step 1: Supabase Setup (2 minutes)

### 1.1 Create Project
1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Name: `mcp-bridge-test`
4. Wait for provisioning

### 1.2 Run SQL Schema
Go to SQL Editor and run:

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  subdomain VARCHAR(50) UNIQUE NOT NULL,
  api_key VARCHAR(64) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

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

-- Create test user
INSERT INTO users (email, username, subdomain, api_key)
VALUES ('test@example.com', 'testuser', 'testuser', 'test_key_123');
```

### 1.3 Get API Keys
Go to Project Settings → API:
- Copy **Project URL**
- Copy **service_role key** (secret!)

---

## Step 2: Start Server (1 minute)

```bash
cd /home/bch/dev/00_RELEASE/mcp-bridge-cloud/server

# Install dependencies
npm install

# Create .env file
cat > .env << EOF
PORT=8080
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJxxxxx...
TEST_SUBDOMAIN=testuser
DEBUG=1
EOF

# Start server
npm start
```

**Expected output:**
```
╔════════════════════════════════════════════════════════════════╗
║         MCP Bridge Cloud - Tunnel Relay Server                ║
╠════════════════════════════════════════════════════════════════╣
║  HTTP Server: http://0.0.0.0:8080                          ║
║  WebSocket:   ws://localhost:8080/tunnel                      ║
╚════════════════════════════════════════════════════════════════╝

✓ Server ready to accept tunnel connections
```

---

## Step 3: Test WebSocket Connection (1 minute)

Open a NEW terminal:

```bash
cd /home/bch/dev/00_RELEASE/mcp-bridge-cloud/client
npm install

# Test connection
node -e "
import('ws').then(({ default: WebSocket }) => {
  const ws = new WebSocket('ws://localhost:8080/tunnel?api_key=test_key_123');
  ws.on('open', () => console.log('✓ Connected!'));
  ws.on('message', (data) => console.log('Message:', data.toString()));
  ws.on('error', (err) => console.error('Error:', err.message));
});
"
```

**Expected output:**
```
✓ Connected!
Message: {"type":"connected","subdomain":"testuser","url":"https://testuser.mcpbridge.io"}
```

---

## Step 4: Test with Local mcp-bridge (1 minute)

Open a THIRD terminal:

```bash
# Start local mcp-bridge adapter
cd /home/bch/dev/00_RELEASE/mcp-bridge
npm start  # This runs the HTTP adapter on port 3000
```

---

## Step 5: Test End-to-End

Back in the second terminal:

```bash
# Test with cloud connector
cd /home/bch/dev/00_RELEASE/mcp-bridge-cloud/client

node -e "
import('./lib/cloud-connector.js').then(({ CloudConnector }) => {
  const connector = new CloudConnector({
    apiKey: 'test_key_123',
    tunnelUrl: 'ws://localhost:8080',
    localPort: 3000,
    debug: true
  });

  connector.connect()
    .then(result => {
      console.log('✓ Connected!');
      console.log('URL:', result.url);
    })
    .catch(err => console.error('Error:', err));
});
"
```

---

## Step 6: Send Test HTTP Request

Open a FOURTH terminal:

```bash
# Simulate ChatGPT request
curl -X POST http://localhost:8080 \
  -H "Host: testuser.mcpbridge.io" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/list",
    "params": {}
  }'
```

**Expected flow:**
1. Request hits tunnel relay server
2. Server extracts subdomain "testuser"
3. Server finds WebSocket connection for "testuser"
4. Server forwards request through WebSocket
5. Client receives request
6. Client forwards to local mcp-bridge (:3000)
7. mcp-bridge processes and returns tools list
8. Response flows back through WebSocket
9. Server returns response to curl

**Expected response:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "tools": [
      {"name": "read_file", ...},
      {"name": "write_file", ...},
      ...
    ]
  }
}
```

---

## Troubleshooting

### "Connection refused" on port 8080
**Solution:** Server isn't running. Check Step 2.

### "Invalid API key"
**Solution:**
- Verify SQL insert created test user
- Check `.env` has correct Supabase keys
- Try: `curl http://localhost:8080/healthz` (should return OK)

### "Tunnel not connected"
**Solution:**
- Verify Step 3 WebSocket connection worked
- Check server logs for connection messages

### "ECONNREFUSED localhost:3000"
**Solution:** mcp-bridge adapter isn't running on port 3000. Check Step 4.

---

## What's Next?

Now that it works locally, you can:

1. **Deploy to Fly.io** - See [SETUP.md](SETUP.md)
2. **Integrate with mcp-bridge CLI** - See [INTEGRATION.md](INTEGRATION.md)
3. **Add more users** - Insert more rows in Supabase
4. **Build dashboard** - Next.js app for user management

---

## Quick Commands Reference

```bash
# Terminal 1: Server
cd mcp-bridge-cloud/server && npm start

# Terminal 2: Test client
cd mcp-bridge-cloud/client
node -e "import('./lib/cloud-connector.js').then(...)"

# Terminal 3: Local mcp-bridge
cd mcp-bridge && npm start

# Terminal 4: Send requests
curl -X POST http://localhost:8080 -H "Host: testuser.mcpbridge.io" ...
```

---

## Success Checklist

- [ ] Supabase project created
- [ ] SQL schema created
- [ ] Test user inserted
- [ ] Server starts on port 8080
- [ ] WebSocket connection works
- [ ] Cloud connector connects
- [ ] HTTP request forwards correctly
- [ ] Response comes back

If all checked, you're ready to deploy! 🚀

---

## Get Help

- Check server logs in Terminal 1
- Check [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) for architecture
- Check [SETUP.md](SETUP.md) for deployment
- Open issue: https://github.com/arti-cat/mcp-bridge-cloud/issues
