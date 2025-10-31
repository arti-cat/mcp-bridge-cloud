# ChatGPT MCP Connector Issue Analysis

**Date:** October 31, 2025
**Issue:** "Failed to build actions from MCP endpoint" when adding articat.mcp-bridge.xyz to ChatGPT

---

## Problem Summary

When attempting to add `https://articat.mcp-bridge.xyz` as a connector in ChatGPT's "New Connector" interface, we receive the error:

```
Error creating connector
Failed to build actions from MCP endpoint
```

However, the working connector `c7-fly` at `https://bch-proxy.fly.dev` (Context7 bridge) works perfectly.

---

## Key Discovery: Two Different ChatGPT Interfaces

### Interface 1: "New Connector" (BETA) - Deep Research Mode
- **Location:** ChatGPT UI → Apps & Connectors → "New Connector" button
- **Purpose:** For Deep Research models (o3-deep-research, o4-mini-deep-research)
- **Requirements:** **MUST have specific tool names:**
  - `search` tool (returns `{"ids": [...]}`)
  - `fetch` tool (returns full document data)
- **Documentation:** https://platform.openai.com/docs/guides/deep-research#remote-mcp-servers
- **Key Quote:** "deep research models require a specialized type of MCP server—one that implements a search and fetch interface. The model is optimized to call data sources exposed through this interface and **doesn't support tool calls or MCP servers that don't implement this interface**."

### Interface 2: Regular Developer Mode
- **Location:** Settings → Connectors → Add Remote MCP Server
- **Purpose:** General MCP integration for all models
- **Requirements:** Supports ANY tools (not just search/fetch)
- **Protocols:** SSE and streaming HTTP
- **Authentication:** OAuth or no authentication

---

## Root Cause - UPDATED FINDING!

### ✅ Tool Naming is NOT the Issue!

**Confirmed:** A Cloudflare tunnel (`https://villa-endorsement-fat-record.trycloudflare.com`) with the SAME filesystem server successfully connected to ChatGPT and all tools are working (Oct 31, 2025).

This proves:
- ❌ Tool names (`read_file`, `search_files`) are fine - ChatGPT accepts them
- ❌ Deep Research requirements don't apply to regular Developer Mode connectors
- ❌ No need for specific `search` and `fetch` tool names

### 🔍 Real Root Cause: WebSocket Tunnel Relay Issue

**The actual problem:** ChatGPT works with Cloudflare tunnels but NOT with our custom WebSocket tunnel relay.

**Working Setup:**
```
ChatGPT → Cloudflare Tunnel → Local Machine → MCP Server
         ✅ Direct connection
```

**Failing Setup:**
```
ChatGPT → articat.mcp-bridge.xyz (Fly.io) → WebSocket Relay → Local Machine → MCP Server
         ❌ Relay causing issues
```

**Evidence:**
- Cloudflare tunnel: ✅ Works perfectly, all tools visible
- Our cloud tunnel: ❌ "Failed to build actions from MCP endpoint"
- Tunnel crashes with exit code 137 (SIGKILL) or exit code 1
- Sometimes ChatGPT makes NO requests at all (client-side rejection)
- Sometimes ChatGPT makes multiple GET/POST requests, then tunnel crashes

### Possible Tunnel Relay Issues

1. **Protocol Incompatibility:** WebSocket relay might not properly forward all HTTP headers/body
2. **Timeout Issues:** Relay might timeout during ChatGPT's connection validation
3. **Response Corruption:** Responses might get truncated or malformed through WebSocket relay
4. **Missing Headers:** Some required headers might be lost in relay translation
5. **Crash During Validation:** Relay crashes when receiving specific ChatGPT validation requests

---

## Technical Details

### Cloud Tunnel Architecture
```
ChatGPT Request
    ↓
https://articat.mcp-bridge.xyz (Fly.io cloud server)
    ↓
WebSocket Tunnel Relay (routing.js, tunnel-relay.js)
    ↓
Local Machine (cloud-connector.js)
    ↓
MCP Bridge Adapter (lib/server.js on :3000)
    ↓
@modelcontextprotocol/server-filesystem (STDIO)
```

### Test Results

**Tunnel connectivity:** ✅ Working
```bash
curl https://articat.mcp-bridge.xyz/
# Returns: {"jsonrpc":"2.0","id":11,"result":{"tools":[...]}}
```

**POST initialize:** ✅ Working
```bash
curl -X POST https://articat.mcp-bridge.xyz/ \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{...}}'
# Returns: {"jsonrpc":"2.0","id":1,"result":{"protocolVersion":"2024-11-05",...}}
```

**ChatGPT requests:** ❌ Sometimes no requests, sometimes multiple GET/POST then crash
- In verbose mode with --dev flag, we saw:
  - Multiple GET requests → tools/list responses
  - POST initialize → proper response
  - Then tunnel exits with code 1

---

## Solutions

### Solution 1: Use Regular Developer Mode (Quick Fix)
**Recommendation:** Try this first!

Instead of using the "New Connector" button, use the regular Developer Mode:
1. Go to **Settings → Connectors**
2. Look for **"Add Remote MCP Server"** or similar
3. Add URL: `https://articat.mcp-bridge.xyz`
4. This supports ANY tools, not just search/fetch

### Solution 2: Create Wrapper MCP Server with search/fetch Tools

Create a new MCP server that wraps the filesystem server and exposes tools with the exact names Deep Research expects:

**Required Implementation:**
```javascript
// Expose as "search" instead of "search_files"
{
  name: "search",
  description: "Search for files matching a pattern",
  inputSchema: {
    type: "object",
    properties: {
      query: { type: "string", description: "Search query/pattern" },
      path: { type: "string", description: "Directory to search in" }
    },
    required: ["query"]
  }
  // Returns: { ids: ["path/to/file1", "path/to/file2", ...] }
}

// Expose as "fetch" instead of "read_text_file"
{
  name: "fetch",
  description: "Fetch the contents of a file by its ID (path)",
  inputSchema: {
    type: "object",
    properties: {
      id: { type: "string", description: "File path/ID from search results" }
    },
    required: ["id"]
  }
  // Returns: { id, title, content, metadata }
}
```

**Implementation Steps:**
1. Create new MCP server: `/home/bch/dev/00_RELEASE/mcp-bridge-filesystem-deep-research/`
2. Import `@modelcontextprotocol/server-filesystem` as dependency
3. Wrap `search_files` → expose as `search` with `{ids: [...]}` response
4. Wrap `read_text_file` → expose as `fetch` with full document response
5. Update mcp-bridge CLI to support this new server via `--server` flag

### Solution 3: Modify Filesystem Server Directly (Advanced)

Fork `@modelcontextprotocol/server-filesystem` and add aliases:
- Add `search` tool that calls `search_files` internally
- Add `fetch` tool that calls `read_text_file` internally
- Maintain backward compatibility with existing tool names

---

## Testing Checklist

After implementing a solution:

- [ ] Tunnel starts successfully
- [ ] `curl https://articat.mcp-bridge.xyz/` returns tools list
- [ ] Tools list includes `search` and `fetch` (if using Solution 2/3)
- [ ] POST initialize returns proper response
- [ ] ChatGPT "New Connector" accepts the URL
- [ ] ChatGPT can successfully call search tool
- [ ] ChatGPT can successfully call fetch tool
- [ ] Tunnel remains stable during ChatGPT requests (doesn't crash)

---

## Additional Issues Discovered

### Tunnel Stability
The tunnel sometimes crashes with exit code 1 after receiving requests from ChatGPT. This needs investigation:
- Check error handling in cloud-connector.js
- Check error handling in tunnel-relay.js
- Add better error logging
- Investigate why process exits during active requests

### Protocol Confusion - RESOLVED ✅
- ~~Documentation mentions "SSE and streaming HTTP"~~
- **Confirmed:** Our server returns `Content-Type: application/json` ✅
- **Confirmed:** Context7 also returns `Content-Type: application/json` ✅
- **Conclusion:** SSE is NOT required - regular HTTP JSON-RPC is sufficient

### Latest Testing (Oct 31, 2025 16:50 UTC)

**What we verified:**
- ✅ ChatGPT DOES make requests to `https://articat.mcp-bridge.xyz`
- ✅ OAuth discovery requests (404 - expected)
- ✅ `initialize` with `openai-mcp` client returns HTTP 200
- ✅ `tools/list` returns HTTP 200 with 14 tools
- ✅ All responses have proper `Mcp-Session-Id` header
- ✅ All responses have correct `Content-Length`
- ✅ All JSON-RPC responses are valid and well-formed

**The mystery:**
ChatGPT makes successful requests, receives valid responses, but STILL shows "Failed to build actions from MCP endpoint" error.

**Hypothesis:**
Since the responses are technically perfect, the issue may be:
1. **Tool schema validation failure** - ChatGPT might reject specific tool schemas
2. **Response timing** - Some subtle timing issue during validation
3. **Connection persistence** - ChatGPT expects the connection to stay alive longer
4. **Undocumented requirement** - Some header or capability ChatGPT expects but isn't documented

---

## Conclusion

**The persistent cloud tunnel concept works perfectly. HTTP requests/responses are valid. The issue is something subtle in ChatGPT's validation logic.**

### What Works
- ✅ Cloudflare tunnel → ChatGPT → Filesystem MCP server (confirmed working Oct 31, 2025)
- ✅ curl/HTTP testing → WebSocket relay → Filesystem MCP server
- ✅ WebSocket relay correctly forwards HTTP GET/POST to local machine
- ✅ Tool names (`read_file`, `search_files`) are fine for ChatGPT

### What Doesn't Work
- ❌ ChatGPT → WebSocket relay (`articat.mcp-bridge.xyz`) → Filesystem MCP server
- ❌ Tunnel crashes or hangs during ChatGPT's validation
- ❌ Sometimes ChatGPT doesn't even attempt to connect (client-side rejection)

### Next Steps

1. **Debug WebSocket relay** - Compare Cloudflare tunnel traffic vs our relay traffic
2. **Fix crash issues** - Prevent tunnel from exiting during ChatGPT requests
3. **Test headers** - Ensure all HTTP headers are properly forwarded through relay
4. **Add logging** - More verbose logging in tunnel-relay.js and cloud-connector.js
5. **Investigate timeout** - May need to increase timeout values
6. **Compare protocols** - Cloudflare handles HTTP/2, check if relay properly supports it

### Temporary Workaround

For now, users should use **Cloudflare tunnels** instead of the persistent cloud tunnel:

```bash
# Start mcp-bridge without --cloud flag (uses Cloudflare tunnel)
cd /home/bch/dev/00_RELEASE/MCP-bridge
node bin/cli.js --dir /home/bch/dev/00_RELEASE
# Will output: https://[random].trycloudflare.com
# Add this URL to ChatGPT immediately (it changes on restart)
```

Once the WebSocket relay bugs are fixed, users can switch to persistent URLs like `https://username.mcp-bridge.xyz`.

---

## Related Files

- `/home/bch/dev/00_RELEASE/mcp-bridge-cloud/server/src/tunnel-relay.js` - WebSocket tunnel relay
- `/home/bch/dev/00_RELEASE/mcp-bridge-cloud/server/src/routing.js` - HTTP routing
- `/home/bch/dev/00_RELEASE/mcp-bridge-cloud/client/lib/cloud-connector.js` - Local connector
- `/home/bch/dev/00_RELEASE/MCP-bridge/lib/server.js` - MCP adapter
- `/home/bch/dev/00_RELEASE/MCP-bridge/bin/cli.js` - CLI with cloud support
- `/home/bch/dev/00_RELEASE/mcp-bridge-cloud/dev-docs/openai-mco.md` - OpenAI MCP docs

---

## References

- OpenAI Deep Research MCP Guide: https://platform.openai.com/docs/guides/deep-research#remote-mcp-servers
- OpenAI MCP Documentation: https://platform.openai.com/docs/mcp
- MCP Protocol Specification: https://modelcontextprotocol.io/
- ChatGPT Developer Mode info provided in conversation
