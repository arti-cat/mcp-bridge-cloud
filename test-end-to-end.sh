#!/bin/bash
# End-to-end test: Real MCP server → mcp-bridge HTTP adapter → Cloud tunnel → Internet

set -e

echo "🧪 End-to-End MCP Bridge Cloud Test"
echo "====================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Start mcp-bridge HTTP adapter (no tunnel)
echo -e "${BLUE}Step 1: Starting mcp-bridge HTTP adapter on port 3000${NC}"
echo "Command: cd ../MCP-bridge && npx mcp-bridge --tunnel-url skip --port 3000 --preset filesystem --dir /tmp"
echo ""
cd ../MCP-bridge
npx mcp-bridge --tunnel-url skip --port 3000 --preset filesystem --dir /tmp &
MCP_BRIDGE_PID=$!
echo "PID: $MCP_BRIDGE_PID"
sleep 3

# Step 2: Start cloud connector
echo ""
echo -e "${BLUE}Step 2: Connecting to cloud tunnel (articat.mcp-bridge.xyz)${NC}"
echo "Command: cd ../mcp-bridge-cloud/client && node test-connection.js"
echo ""
cd ../mcp-bridge-cloud/client
node test-connection.js &
CLOUD_CONNECTOR_PID=$!
echo "PID: $CLOUD_CONNECTOR_PID"
sleep 3

# Step 3: Send test request through cloud tunnel
echo ""
echo -e "${BLUE}Step 3: Sending request through cloud tunnel${NC}"
echo "URL: https://articat.mcp-bridge.xyz"
echo "Request: tools/list"
echo ""
curl -X POST https://articat.mcp-bridge.xyz \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' \
  --max-time 10 \
  -v

# Cleanup
echo ""
echo -e "${YELLOW}Cleaning up...${NC}"
kill $CLOUD_CONNECTOR_PID 2>/dev/null || true
kill $MCP_BRIDGE_PID 2>/dev/null || true

echo ""
echo -e "${GREEN}✅ Test complete!${NC}"
