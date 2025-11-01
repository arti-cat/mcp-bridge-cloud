# mcp-bridge-cloud

> Persistent cloud tunnels for MCP servers

[![npm version](https://img.shields.io/npm/v/mcp-bridge-cloud.svg)](https://www.npmjs.com/package/mcp-bridge-cloud)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## What is this?

**mcp-bridge-cloud** is a CLI tool that gives your local MCP server a **persistent HTTPS URL** that never changes.

No more updating ChatGPT configuration every time you restart your server!

```bash
# Install globally
npm install -g mcp-bridge-cloud

# Run with your API key
mcp-bridge-cloud --api-key YOUR_API_KEY

# Get a persistent URL like:
# https://yourusername.mcp-bridge.xyz
```

## Features

- ✅ **Persistent URLs** - Same HTTPS URL across all restarts
- ✅ **Zero Configuration** - Works out of the box
- ✅ **Secure** - API key authentication
- ✅ **Fast** - Low-latency WebSocket tunnel
- ✅ **Filesystem MCP** - Built-in filesystem server
- ✅ **ChatGPT Ready** - Compatible with ChatGPT Developer Mode

## Installation

```bash
npm install -g mcp-bridge-cloud
```

## Quick Start

### 1. Get API Key

Sign up at [https://mcp-bridge.xyz/dashboard](https://mcp-bridge.xyz/dashboard) and copy your API key.

### 2. Run the CLI

```bash
mcp-bridge-cloud --api-key YOUR_API_KEY
```

Output:
```
╔═══════════════════════════════════════════════════════════╗
║              MCP Bridge Cloud                             ║
║         Persistent Tunnels for MCP Servers                ║
╚═══════════════════════════════════════════════════════════╝

🚀 Starting MCP filesystem adapter...
   Root directory: /Users/you/projects
   Port: 3000
✓ Adapter running

🌐 Connecting to MCP Bridge Cloud...
✓ Connected to cloud
   Your persistent URL: https://yourusername.mcp-bridge.xyz

═══════════════════════════════════════════════════════════
✓ Server Ready!
═══════════════════════════════════════════════════════════

📋 Configuration:
   Adapter Port: 3000
   Root Directory: /Users/you/projects
   Subdomain: yourusername
   Persistent URL: https://yourusername.mcp-bridge.xyz

🎯 Next Steps:

   1. Copy your persistent URL:
      https://yourusername.mcp-bridge.xyz

   2. Add to ChatGPT:
      • Settings → Apps & Connectors → Developer Mode
      • Add Remote MCP Server
      • URL: https://yourusername.mcp-bridge.xyz
      • Protocol: HTTP (streaming)
      • Authentication: None

   3. Your URL persists across restarts!
      No need to reconfigure ChatGPT every time ✨

────────────────────────────────────────────────────────────
Press Ctrl+C to stop
```

### 3. Add to ChatGPT

1. Open ChatGPT
2. Go to **Settings** → **Apps & Connectors** → **Developer Mode**
3. Click **Add Remote MCP Server**
4. Enter your persistent URL: `https://yourusername.mcp-bridge.xyz`
5. Select **HTTP (streaming)**
6. Click **Connect**

Done! Your MCP server is now available in ChatGPT.

## Usage

### Basic Usage

```bash
# Use default settings (current directory, port 3000)
mcp-bridge-cloud --api-key YOUR_API_KEY
```

### Custom Directory

```bash
# Serve a specific directory
mcp-bridge-cloud --api-key YOUR_API_KEY --dir ~/Documents
```

### Custom Port

```bash
# Use a different port
mcp-bridge-cloud --api-key YOUR_API_KEY --port 3001
```

### Environment Variables

```bash
# Set API key via environment variable
export MCP_CLOUD_API_KEY=YOUR_API_KEY
mcp-bridge-cloud
```

### Debug Mode

```bash
# Enable verbose logging
mcp-bridge-cloud --api-key YOUR_API_KEY --debug
```

## Command Line Options

| Option | Alias | Description | Default |
|--------|-------|-------------|---------|
| `--api-key <key>` | `-k` | API key from mcp-bridge.xyz | Required |
| `--port <number>` | `-p` | Port for HTTP adapter | `3000` |
| `--dir <path>` | `-d` | Root directory to serve | Current directory |
| `--tunnel-url <url>` | `-t` | Cloud server URL | `wss://mcp-bridge.xyz` |
| `--debug` | | Enable debug logging | `false` |
| `--help` | `-h` | Show help | |

## Environment Variables

| Variable | Description |
|----------|-------------|
| `MCP_CLOUD_API_KEY` | API key (alternative to `--api-key`) |
| `MCP_CLOUD_URL` | Cloud server URL |
| `DEBUG=1` | Enable debug mode |

## How It Works

```
┌─────────────────────────────────────────────────────────────┐
│ Your Local Machine                                          │
│                                                             │
│  ┌──────────────────┐         ┌──────────────────┐        │
│  │ MCP Server       │ ←────── │ HTTP Adapter     │        │
│  │ (STDIO)          │         │ (port 3000)      │        │
│  └──────────────────┘         └────────┬─────────┘        │
│                                         │                   │
│                                         │ WebSocket         │
└─────────────────────────────────────────┼───────────────────┘
                                          │
                                          ▼
                                ┌──────────────────────┐
                                │ mcp-bridge.xyz       │
                                │ (Cloud Relay)        │
                                └──────────┬───────────┘
                                           │
                                           │ HTTPS
                                           ▼
                                ┌──────────────────────┐
                                │ ChatGPT              │
                                └──────────────────────┘
```

1. **MCP Server** runs locally (filesystem access via STDIO)
2. **HTTP Adapter** wraps it with HTTP interface
3. **Cloud Connector** establishes WebSocket tunnel to mcp-bridge.xyz
4. **ChatGPT** connects to your persistent URL
5. Requests flow through cloud → WebSocket → adapter → MCP server

## MCP Tools Available

The built-in filesystem server provides these tools:

- **search** - Find files by pattern
- **fetch** - Read file contents
- **list** - List directory contents
- **write** - Create or update files

## Troubleshooting

### "API key required" error

**Problem:** No API key provided

**Solution:**
```bash
# Provide via command line
mcp-bridge-cloud --api-key YOUR_KEY

# Or via environment variable
export MCP_CLOUD_API_KEY=YOUR_KEY
mcp-bridge-cloud
```

### "Connection refused" error

**Problem:** Port already in use

**Solution:**
```bash
# Use a different port
mcp-bridge-cloud --api-key YOUR_KEY --port 3001
```

### "MCP server not ready" error

**Problem:** MCP server failed to start

**Solution:**
```bash
# Check if npx works
npx -y @modelcontextprotocol/server-filesystem --help

# Try with debug mode
mcp-bridge-cloud --api-key YOUR_KEY --debug
```

## Examples

### Basic Filesystem Access

```bash
# Share your Documents folder with ChatGPT
mcp-bridge-cloud --api-key abc123 --dir ~/Documents
```

Then in ChatGPT:
```
You: "List all markdown files in my Documents folder"
ChatGPT: *uses the 'search' tool* "I found 15 markdown files..."
```

### Project Collaboration

```bash
# Share a specific project
cd ~/projects/my-app
mcp-bridge-cloud --api-key abc123
```

Then in ChatGPT:
```
You: "Read the README.md file"
ChatGPT: *uses the 'fetch' tool* "Here's what I found in your README..."
```

## License

MIT © [articat](https://github.com/arti-cat)

## Links

- [MCP Bridge Cloud](https://mcp-bridge.xyz) - Cloud service
- [GitHub Repository](https://github.com/arti-cat/mcp-bridge-cloud) - Source code
- [npm Package](https://www.npmjs.com/package/mcp-bridge-cloud) - This package
- [Client Library](https://www.npmjs.com/package/mcp-bridge-cloud-client) - WebSocket client
- [Issues](https://github.com/arti-cat/mcp-bridge-cloud/issues) - Bug reports

## Support

- Documentation: [https://mcp-bridge.xyz/docs](https://mcp-bridge.xyz/docs)
- Issues: [GitHub Issues](https://github.com/arti-cat/mcp-bridge-cloud/issues)
- Email: articat1066@gmail.com

---

**Made with ❤️ for the MCP community**
