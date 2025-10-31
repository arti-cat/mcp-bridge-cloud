# Integrating Cloud Connector into mcp-bridge CLI

Guide for adding `--cloud` mode to the existing mcp-bridge package.

---

## Overview

The cloud connector allows mcp-bridge users to get persistent HTTPS tunnels instead of temporary Cloudflare tunnels.

**User experience:**
```bash
# Before (temporary tunnel):
mcp-bridge
# → https://abc-xyz-123.trycloudflare.com (changes every restart)

# After (persistent tunnel):
mcp-bridge --cloud --api-key sk_xxxxx
# → https://username.mcp-bridge.xyz (same URL forever)
```

---

## Step 1: Copy Cloud Connector

Copy the client library to mcp-bridge:

```bash
cp client/lib/cloud-connector.js /path/to/mcp-bridge/lib/
cp client/package.json /path/to/mcp-bridge/package.json.cloud
```

---

## Step 2: Update mcp-bridge package.json

Add `ws` dependency:

```json
{
  "dependencies": {
    "...existing dependencies...",
    "ws": "^8.16.0"
  }
}
```

---

## Step 3: Update CLI Argument Parsing

In `/path/to/mcp-bridge/bin/cli.js`:

```javascript
function parseArgs() {
  const config = {
    // ... existing config
    cloud: false,
    apiKey: process.env.MCP_CLOUD_API_KEY || null,
    cloudUrl: process.env.MCP_CLOUD_URL || 'wss://mcp-bridge.xyz',
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      // ... existing cases

      case '--cloud':
        config.cloud = true;
        break;

      case '--api-key':
        config.apiKey = args[++i];
        break;

      case '--cloud-url':
        config.cloudUrl = args[++i];
        break;
    }
  }

  return config;
}
```

---

## Step 4: Add Cloud Mode to Main Function

In `bin/cli.js`, update the `main()` function:

```javascript
async function main() {
  const config = parseArgs();

  log('\n╔═══════════════════════════════════════════════════════════╗', colors.bright);
  log('║                   mcp-bridge Server                      ║', colors.bright);
  log('╚═══════════════════════════════════════════════════════════╝', colors.bright);

  let adapter, tunnel;

  try {
    // Start adapter
    adapter = await startAdapter(config);

    // Choose tunnel mode
    if (config.cloud) {
      // Cloud mode: persistent tunnel
      tunnel = await startCloudTunnel(config);
    } else if (config.tunnelUrl) {
      // Existing tunnel URL provided
      log(`\n🌐 Using provided tunnel: ${config.tunnelUrl}`, colors.cyan);
      tunnel = { url: config.tunnelUrl };
    } else {
      // Cloudflare temp tunnel (existing behavior)
      const hasCloudflared = await checkCloudflared();
      if (!hasCloudflared) {
        log('\n✗ Error: Cloudflared installation failed', colors.red);
        process.exit(1);
      }
      tunnel = await startTunnel(config.port, config);
    }

    // Display success message
    displaySuccessMessage(config, tunnel);

    // ... rest of existing code
  } catch (error) {
    log(`\n✗ Error: ${error.message}`, colors.red);
    process.exit(1);
  }
}
```

---

## Step 5: Add Cloud Tunnel Function

Add this new function to `bin/cli.js`:

```javascript
import { CloudConnector } from '../lib/cloud-connector.js';

async function startCloudTunnel(config) {
  log('\n☁️  Starting cloud tunnel...', colors.bright);

  if (!config.apiKey) {
    throw new Error('API key required for cloud mode. Use --api-key or set MCP_CLOUD_API_KEY');
  }

  const connector = new CloudConnector({
    apiKey: config.apiKey,
    tunnelUrl: config.cloudUrl,
    localPort: config.port,
    debug: config.dev,
  });

  try {
    const result = await connector.connect();

    log(`✓ Connected to cloud`, colors.green);
    log(`   Your persistent URL: ${result.url}`, colors.cyan);

    return {
      url: result.url,
      subdomain: result.subdomain,
      connector, // Keep reference for cleanup
    };
  } catch (error) {
    log(`✗ Cloud connection failed: ${error.message}`, colors.red);
    log('\nTroubleshooting:', colors.yellow);
    log('  • Verify your API key is correct', colors.yellow);
    log('  • Check cloud service is running: curl https://mcp-bridge.xyz/healthz', colors.yellow);
    log('  • Try temporary tunnel instead: remove --cloud flag', colors.yellow);
    throw error;
  }
}
```

---

## Step 6: Update Success Message

Update `displaySuccessMessage()` function to handle cloud mode:

```javascript
function displaySuccessMessage(config, tunnel) {
  log('\n' + '═'.repeat(60), colors.green);
  log('✓ Server Ready!', colors.green + colors.bright);
  log('═'.repeat(60), colors.green);

  log('\n📋 Configuration:', colors.bright);
  log(`   Adapter Port: ${config.port}`, colors.cyan);
  log(`   MCP Server: ${config.server}`, colors.cyan);

  if (config.server === '@modelcontextprotocol/server-filesystem') {
    log(`   Root Directory: ${config.dir}`, colors.cyan);
  }

  log(`   Tunnel URL: ${tunnel.url}`, colors.cyan);

  if (config.cloud) {
    log(`   Tunnel Type: ☁️  Cloud (Persistent)`, colors.green);
    log(`   Subdomain: ${tunnel.subdomain}`, colors.cyan);
  } else if (config.tunnelUrl) {
    log(`   Tunnel Type: 🔗 Custom`, colors.cyan);
  } else {
    log(`   Tunnel Type: ⚡ Cloudflare (Temporary)`, colors.yellow);
  }

  log('\n🎯 Next Steps:', colors.bright);
  log('\n   1. Copy this URL:', colors.cyan);
  log(`      ${tunnel.url}`, colors.green + colors.bright);

  if (config.cloud) {
    log('\n   2. This URL is PERMANENT! ✨', colors.green);
    log('      Add it once to ChatGPT, works forever', colors.cyan);
  }

  log('\n   3. Add to ChatGPT Developer Mode:', colors.cyan);
  log('      • Settings → Apps & Connectors → Developer Mode');
  log('      • Add Remote MCP Server');
  log(`      • URL: ${tunnel.url}`);
  log('      • Protocol: HTTP (streaming)');
  log('      • Authentication: None');

  log('\n' + '─'.repeat(60), colors.cyan);
  log('Press Ctrl+C to stop\n', colors.yellow);
}
```

---

## Step 7: Update Cleanup

Update the cleanup function to disconnect cloud tunnel:

```javascript
const cleanup = () => {
  log('\n\n🛑 Shutting down...', colors.yellow);

  if (adapter) {
    adapter.kill();
    log('✓ Adapter stopped', colors.green);
  }

  if (tunnel?.process) {
    tunnel.process.kill();
    log('✓ Tunnel stopped', colors.green);
  }

  if (tunnel?.connector) {
    tunnel.connector.disconnect();
    log('✓ Cloud tunnel disconnected', colors.green);
  }

  log('\nGoodbye! 👋\n', colors.cyan);
  process.exit(0);
};
```

---

## Step 8: Update Help Text

Add cloud options to `showHelp()`:

```javascript
function showHelp() {
  log('\nmcp-bridge', colors.bright);
  log('='.repeat(60), colors.bright);
  log('\nOne-command local MCP server with automatic HTTPS tunnel\n');

  log('Usage:', colors.cyan);
  log('  npx mcp-bridge [options]\n');

  log('Options:', colors.cyan);
  log('  -p, --port <number>        Port for adapter (default: 3000)');
  log('  -d, --dir <path>           Root directory (for filesystem server)');
  log('  -t, --tunnel-url <url>     Use existing tunnel URL (skip tunnel creation)');
  log('  --server <pkg>             MCP server package to run');
  log('  --preset <name>            Use a preset configuration');
  log('  --args <string|json>       Args for MCP server');
  log('  --dev                      Development mode (verbose logging)');
  log('');
  log('  ☁️  Cloud Mode (Persistent Tunnels):', colors.bright);
  log('  --cloud                    Use cloud tunnel service (persistent URL)');
  log('  --api-key <key>            API key for cloud service');
  log('  --cloud-url <url>          Cloud service URL (default: wss://mcp-bridge.xyz)');
  log('');
  log('  --list-presets             Show all available presets');
  log('  -h, --help                 Show this help\n');

  log('Examples:', colors.cyan);
  log('  # Temporary tunnel (free):');
  log('  npx mcp-bridge\n');

  log('  # Persistent cloud tunnel ($9/mo):');
  log('  npx mcp-bridge --cloud --api-key sk_xxxxx\n');

  log('  # With different MCP servers:');
  log('  npx mcp-bridge --cloud --api-key sk_xxxxx --preset sqlite --args ~/db.sqlite\n');
}
```

---

## Step 9: Test Integration

```bash
# Test without cloud (existing behavior)
mcp-bridge --preset filesystem --dir /tmp

# Test with cloud (new behavior)
mcp-bridge --cloud --api-key test_api_key_123 --preset filesystem --dir /tmp
```

---

## Step 10: Update README

Add cloud mode section to mcp-bridge README:

```markdown
## ☁️ Cloud Mode (Persistent Tunnels)

Get a permanent HTTPS URL that never changes:

### Quick Start

\`\`\`bash
# Sign up at mcp-bridge.xyz to get API key
npx mcp-bridge --cloud --api-key sk_xxxxxxxxxxxxx
\`\`\`

**Output:**
\`\`\`
✓ Connected to cloud
Your persistent URL: https://username.mcp-bridge.xyz

This URL is PERMANENT! ✨
Add it once to ChatGPT, works forever.
\`\`\`

### Benefits

- **Same URL forever** - No need to update ChatGPT config
- **Auto-reconnect** - Handles disconnections gracefully
- **Better reliability** - Dedicated infrastructure
- **Usage analytics** - Track requests via dashboard

### Pricing

- **Free Beta**: First 50 users
- **Starter**: $9/mo - 1 tunnel, 10K requests/month
- **Pro**: $19/mo - 3 tunnels, 100K requests/month

[Sign up at mcp-bridge.xyz](https://mcp-bridge.xyz)

### Environment Variables

\`\`\`bash
# Set once, use anywhere
export MCP_CLOUD_API_KEY=sk_xxxxxxxxxxxxx
export MCP_CLOUD_URL=wss://mcp-bridge.xyz  # optional

# Then just run:
mcp-bridge --cloud
\`\`\`
```

---

## Summary

After integration, users can choose:

1. **Free (temporary tunnels)**: `mcp-bridge`
   - URL changes on restart
   - Perfect for testing

2. **Paid (persistent tunnels)**: `mcp-bridge --cloud --api-key xxx`
   - Same URL forever
   - Better for production use
   - $9/mo

The free tier drives adoption, paid tier generates revenue!

---

## Files Changed

- ✅ `/path/to/mcp-bridge/lib/cloud-connector.js` (new)
- ✅ `/path/to/mcp-bridge/bin/cli.js` (modified)
- ✅ `/path/to/mcp-bridge/package.json` (add `ws` dependency)
- ✅ `/path/to/mcp-bridge/README.md` (add cloud section)

**Total changes: ~200 lines of code**
