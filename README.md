# MCP Bridge Cloud

[![npm version](https://img.shields.io/npm/v/mcp-bridge-cloud.svg)](https://www.npmjs.com/package/mcp-bridge-cloud)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**Persistent HTTPS URLs for your local MCP servers.**

Get a permanent URL like `https://username.mcp-bridge.xyz` that persists across restarts. No more updating ChatGPT every time you restart your tunnel.

## Quick Start

### Install CLI

```bash
npm install -g mcp-bridge-cloud
```

### Get API Key

Sign up at [mcp-bridge.xyz](https://mcp-bridge.xyz) (dashboard coming soon - contact for early access)

### Connect

```bash
# Connect your local MCP server to the cloud
mcp-bridge-cloud --api-key YOUR_API_KEY

# Or use the short alias
mcp-cloud --api-key YOUR_API_KEY
```

### Add to ChatGPT

Your persistent URL: `https://username.mcp-bridge.xyz`

Add this to ChatGPT Developer Mode - it never changes!

## How It Works

```text
ChatGPT → https://username.mcp-bridge.xyz
    ↓ (Cloud routes by subdomain)
WebSocket Tunnel
    ↓ (Your machine)
Local MCP Server
```

The CLI:

1. Connects to cloud via WebSocket (authenticated with API key)
2. Starts local HTTP adapter on port 3000
3. Routes ChatGPT requests → your local MCP server
4. Sends responses back through the tunnel

## CLI Options

```bash
mcp-bridge-cloud [options]

Options:
  --api-key <key>     Your API key from mcp-bridge.xyz (required)
  --port <number>     Local adapter port (default: 3000)
  --debug             Enable verbose logging
  --help              Show help
  --version           Show version
```

## Programmatic Usage

Install the client library in your Node.js project:

```bash
npm install mcp-bridge-cloud-client
```

```javascript
import { CloudConnector } from 'mcp-bridge-cloud-client';

const client = new CloudConnector({
  apiKey: 'your-api-key',
  tunnelUrl: 'wss://mcp-bridge.xyz',
  localPort: 3000,
  debug: true
});

const result = await client.connect();
console.log('Connected:', result.url);
// Output: https://username.mcp-bridge.xyz

// Keep running...
// When done:
client.disconnect();
```

## Project Structure

This repository contains the **public-facing components**:

- **`cli/`** - Command-line tool (`mcp-bridge-cloud` on npm)
- **`client/`** - WebSocket client library (`mcp-bridge-cloud-client` on npm)
- **`dashboard/`** - User account management dashboard (Svelte)

Server infrastructure is in a separate private repository.

## Packages

- **[mcp-bridge-cloud](https://www.npmjs.com/package/mcp-bridge-cloud)** - CLI tool for end users
- **[mcp-bridge-cloud-client](https://www.npmjs.com/package/mcp-bridge-cloud-client)** - Client library for developers

## Use Cases

### End Users

- Connect local MCP servers to ChatGPT with persistent URLs
- No more temporary tunnel reconfiguration
- "Set it and forget it" experience

### Developers

- Embed persistent tunnels in your applications
- Build SaaS products with ChatGPT integration
- CI/CD testing with stable endpoints

See [USE_CASES.md](USE_CASES.md) for detailed examples.

## Development

### CLI Tool

```bash
cd cli
npm install
node bin/mcp-bridge-cloud.js --help
npm link  # Test globally
```

### Client Library

```bash
cd client
npm install
MCP_API_KEY=your_key node test-connection.js
```

### Dashboard

```bash
cd dashboard
npm install
npm run dev
```

## Requirements

- Node.js 18 or higher
- Valid API key from mcp-bridge.xyz
- Local MCP server accessible via STDIO

## Troubleshooting

### "Invalid API key"

- Check your API key is correct (64-character hex string)
- Verify it's active in your account dashboard

### "Connection failed"

- Check internet connection
- Verify firewall allows WebSocket connections
- Try with `--debug` flag for detailed logs

### "Local adapter not responding"

- Ensure port 3000 is available (or use `--port`)
- Check your MCP server is running
- Verify MCP server accepts STDIO input

## Links

- **Website**: <https://mcp-bridge.xyz>
- **GitHub**: <https://github.com/arti-cat/mcp-bridge-cloud>
- **npm (CLI)**: <https://www.npmjs.com/package/mcp-bridge-cloud>
- **npm (Client)**: <https://www.npmjs.com/package/mcp-bridge-cloud-client>

## License

MIT - See [LICENSE](LICENSE) for details.
