#!/bin/sh
# Startup script for MCP Bridge Cloud
# Starts both Caddy (SSL termination) and Node.js server

set -e

echo "🚀 Starting MCP Bridge Cloud..."
echo ""

# Start Caddy in background for SSL termination
echo "📦 Starting Caddy (SSL/reverse proxy)..."
caddy start --config /etc/caddy/Caddyfile --adapter caddyfile

# Wait a moment for Caddy to initialize
sleep 2

# Check if Caddy started successfully
if ! pgrep -x "caddy" > /dev/null; then
    echo "❌ ERROR: Caddy failed to start"
    exit 1
fi

echo "✓ Caddy started successfully"
echo ""

# Start Node.js server in foreground
echo "🚀 Starting Node.js server..."
echo ""
exec node src/index.js
