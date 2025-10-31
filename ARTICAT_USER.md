# Articat User Account - MCP Bridge Cloud

**Status**: ✅ Active and Working

## Your Credentials

```
Email:     articat-1066@gmail.com
Username:  articat
Subdomain: articat
API Key:   dfcdc844ef1f140aa0f5fe095b3202e76125702cbe14004e125bc310433f1bd6

```

## Your Persistent Tunnel URL

```
https://articat.mcp-bridge.xyz
```

This URL is permanent and will work across all restarts of your local mcp-bridge client.

## Test Results

```
✅ CONNECTED!
   URL: https://articat.mcp-bridge.xyz
   Subdomain: articat

🎉 Test successful! The tunnel is now active.
```

**Test Date**: Oct 30, 2025 15:50 UTC

## How to Use with mcp-bridge

Once the mcp-bridge CLI is updated with cloud connector support:

```bash
# Connect to cloud tunnel (instead of Cloudflare)
mcp-bridge --cloud --api-key dfcdc844ef1f140aa0f5fe095b3202e76125702cbe14004e125bc310433f1bd6

# Or set environment variable
export MCP_BRIDGE_API_KEY=dfcdc844ef1f140aa0f5fe095b3202e76125702cbe14004e125bc310433f1bd6
mcp-bridge --cloud
```

## Current Infrastructure

- **SSL Certificate**: Let's Encrypt (via Fly.io) ✅
- **DNS**: Cloudflare
  - A record: `articat → 66.241.124.212`
  - AAAA record: `articat → 2a09:8280:1::aa:cd52:0`
- **Server**: Deployed on Fly.io (mcp-bridge-cloud app)
- **Database**: Supabase

## Next Steps

1. **Integration**: Copy `client/lib/cloud-connector.js` into mcp-bridge CLI
2. **Testing**: Test with actual MCP server (STDIO)
3. **Usage**: Configure ChatGPT to use `https://articat.mcp-bridge.xyz`

## Useful Commands

```bash
# Check certificate status
flyctl certs show articat.mcp-bridge.xyz --app mcp-bridge-cloud

# View server logs
flyctl logs --app mcp-bridge-cloud

# Test connection
cd client && node test-connection.js

# Check tunnel status (API endpoint)
curl https://mcp-bridge.xyz/api/status/articat
```

## Support

If you encounter issues:
1. Check certificate status (should be "Issued")
2. Verify DNS records in Cloudflare
3. Check server logs for errors
4. Test WebSocket connection with `test-connection.js`

---

**Created**: Oct 30, 2025
**Last Updated**: Oct 30, 2025
**Account Status**: Active
