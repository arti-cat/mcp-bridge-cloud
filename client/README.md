# mcp-bridge-cloud-client

> WebSocket client for connecting local MCP servers to persistent cloud tunnels

[![npm version](https://img.shields.io/npm/v/mcp-bridge-cloud-client.svg)](https://www.npmjs.com/package/mcp-bridge-cloud-client)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Overview

The cloud client enables MCP Bridge users to get **persistent HTTPS URLs** instead of temporary Cloudflare tunnels. Connect your local MCP server once and get a permanent URL like `https://yourusername.mcp-bridge.xyz`.

**Part of the [MCP Bridge Cloud](https://mcp-bridge.xyz) infrastructure.**

## Features

- ✅ **Persistent URLs** - Same HTTPS URL across restarts
- ✅ **WebSocket Tunnel** - Reliable bidirectional communication
- ✅ **Auto-reconnect** - Handles network interruptions gracefully
- ✅ **Secure** - API key authentication
- ✅ **Fast** - Low-latency request forwarding

## Installation

```bash
npm install mcp-bridge-cloud-client
```

## Quick Start

```javascript
import { CloudConnector } from 'mcp-bridge-cloud-client';

const client = new CloudConnector({
  apiKey: 'your-api-key-from-mcp-bridge.xyz',
  tunnelUrl: 'wss://mcp-bridge.xyz',
  localPort: 3000,
  debug: true
});

// Connect to cloud tunnel
const result = await client.connect();
console.log('Persistent URL:', result.url);
// → https://yourusername.mcp-bridge.xyz
```

## Usage with MCP Bridge Cloud CLI

This package is designed to work with the mcp-bridge-cloud CLI:

```bash
# Install mcp-bridge-cloud CLI (coming soon)
npm install -g mcp-bridge-cloud

# Run with cloud mode
mcp-bridge-cloud --api-key your-api-key
```

The CLI automatically:
1. Starts your local MCP server
2. Starts HTTP adapter on port 3000
3. Connects to cloud using this client
4. Gives you a persistent URL

## API Reference

### CloudConnector

#### Constructor Options

```typescript
new CloudConnector({
  apiKey: string,           // Required: Your API key from mcp-bridge.xyz
  tunnelUrl?: string,       // Optional: Cloud server URL (default: wss://mcp-bridge.xyz)
  localPort?: number,       // Optional: Local adapter port (default: 3000)
  debug?: boolean           // Optional: Enable debug logging (default: false)
})
```

#### Methods

##### `connect(): Promise<{url: string, subdomain: string}>`

Connects to the cloud tunnel service.

```javascript
const result = await client.connect();
console.log(result.url);        // https://username.mcp-bridge.xyz
console.log(result.subdomain);  // username
```

##### `disconnect(): void`

Disconnects from the cloud tunnel.

```javascript
client.disconnect();
```

##### `isConnected(): boolean`

Checks if currently connected.

```javascript
if (client.isConnected()) {
  console.log('Connected to cloud');
}
```

##### `getUrl(): string | null`

Gets the persistent URL.

```javascript
const url = client.getUrl();
console.log('Your persistent URL:', url);
```

## How It Works

```
┌─────────────────────────────────────────────────────────────┐
│ Your Local Machine                                          │
│                                                             │
│  ┌──────────────────┐         ┌──────────────────┐        │
│  │ HTTP Adapter     │ ←────── │ CloudConnector   │        │
│  │ (port 3000)      │         │ (this package)   │        │
│  └────────┬─────────┘         └────────┬─────────┘        │
│           │                            │                   │
│           │                            │ WebSocket         │
└───────────┼────────────────────────────┼───────────────────┘
            │                            │
            │                            ▼
            │                  ┌──────────────────────┐
            │                  │ mcp-bridge.xyz       │
            │                  │ (Cloud Relay)        │
            │                  └──────────┬───────────┘
            │                             │
            │                             │ HTTPS
            │                             ▼
            │                  ┌──────────────────────┐
            │                  │ ChatGPT / LLM        │
            │                  └──────────────────────┘
            │
            ▼
┌─────────────────────┐
│ MCP Server          │
│ (STDIO)             │
└─────────────────────┘
```

1. CloudConnector establishes WebSocket connection to mcp-bridge.xyz
2. HTTP requests from ChatGPT arrive at cloud relay
3. Cloud relay forwards requests through WebSocket to your machine
4. CloudConnector forwards to local HTTP adapter (port 3000)
5. HTTP adapter communicates with MCP server via STDIO
6. Responses flow back through the same path

## Environment Variables

```bash
# Optional: Set defaults
export MCP_CLOUD_API_KEY=your-api-key
export MCP_CLOUD_URL=wss://mcp-bridge.xyz
```

## Getting an API Key

1. Sign up at [https://mcp-bridge.xyz/dashboard](https://mcp-bridge.xyz/dashboard)
2. Create an account
3. Copy your API key
4. Use it in your CloudConnector configuration

## Error Handling

```javascript
try {
  await client.connect();
} catch (error) {
  if (error.message.includes('API key')) {
    console.error('Invalid API key');
  } else if (error.message.includes('timeout')) {
    console.error('Connection timeout - check your internet');
  } else {
    console.error('Connection error:', error.message);
  }
}
```

## Reconnection Behavior

The client automatically reconnects with exponential backoff:
- Initial delay: 1 second
- Max delay: 32 seconds
- Max attempts: 10

```javascript
// Manually trigger reconnect
client.disconnect();
await client.connect();
```

## Debug Mode

Enable debug logging to troubleshoot issues:

```javascript
const client = new CloudConnector({
  apiKey: 'your-key',
  debug: true  // Enable verbose logging
});
```

Output example:
```
[CloudConnector] Connecting to cloud: wss://mcp-bridge.xyz
[CloudConnector] ✓ Connected to cloud tunnel
[CloudConnector] ✓ Persistent URL: https://username.mcp-bridge.xyz
[CloudConnector] → HTTP GET /
[CloudConnector] ← HTTP 200
```

## Requirements

- Node.js >= 18.0.0
- Local HTTP adapter running on port 3000 (or custom port)
- Active internet connection
- Valid API key from mcp-bridge.xyz

## Integration Examples

### With Express.js

```javascript
import express from 'express';
import { CloudConnector } from 'mcp-bridge-cloud-client';

const app = express();
app.listen(3000);

const client = new CloudConnector({
  apiKey: process.env.MCP_CLOUD_API_KEY
});

await client.connect();
console.log('Available at:', client.getUrl());
```

### With Custom Port

```javascript
const client = new CloudConnector({
  apiKey: 'your-key',
  localPort: 8080  // Use custom port
});
```

### Graceful Shutdown

```javascript
process.on('SIGINT', () => {
  console.log('Shutting down...');
  client.disconnect();
  process.exit(0);
});
```

## Troubleshooting

### "Connection refused" error

**Problem:** Local adapter not running on port 3000

**Solution:**
```bash
# Check if something is listening on port 3000
lsof -i :3000

# Or start your adapter
node your-adapter.js
```

### "Invalid API key" error

**Problem:** API key is incorrect or expired

**Solution:** Get a new API key from [mcp-bridge.xyz/dashboard](https://mcp-bridge.xyz/dashboard)

### "Connection timeout" error

**Problem:** Cannot reach cloud server

**Solution:**
- Check internet connection
- Verify tunnelUrl is correct
- Check firewall settings

## License

MIT © [articat](https://github.com/arti-cat)

## Links

- [MCP Bridge Cloud](https://mcp-bridge.xyz) - Cloud tunnel service
- [MCP Bridge CLI](https://github.com/arti-cat/mcp-bridge) - Command-line tool
- [GitHub Repository](https://github.com/arti-cat/mcp-bridge-cloud) - Source code
- [Issues](https://github.com/arti-cat/mcp-bridge-cloud/issues) - Bug reports

## Contributing

Contributions welcome! Please open an issue or PR on GitHub.

## Support

- Documentation: [https://mcp-bridge.xyz/docs](https://mcp-bridge.xyz/docs)
- Issues: [GitHub Issues](https://github.com/arti-cat/mcp-bridge-cloud/issues)
- Email: articat1066@gmail.com

---

**Made with ❤️ for the MCP community**
