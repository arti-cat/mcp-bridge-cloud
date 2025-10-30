#!/bin/bash
# Deployment script for MCP Bridge Cloud to Fly.io

set -e

echo "🚀 MCP Bridge Cloud - Fly.io Deployment"
echo "========================================"
echo ""

# Check if app exists, if not create it
if ! flyctl apps list | grep -q "mcp-bridge-cloud"; then
  echo "📦 Creating Fly.io app..."
  flyctl apps create mcp-bridge-cloud --org personal
  echo "✓ App created"
else
  echo "✓ App already exists"
fi

echo ""
echo "🔐 Setting secrets..."
echo "You will need:"
echo "  1. SUPABASE_URL (from server/.env)"
echo "  2. SUPABASE_SERVICE_KEY (from server/.env)"
echo "  3. CLOUDFLARE_API_TOKEN (the token you just created)"
echo ""
echo "Press Enter to continue..."
read

# Set secrets (you'll need to provide these)
flyctl secrets set \
  SUPABASE_URL="$SUPABASE_URL" \
  SUPABASE_SERVICE_KEY="$SUPABASE_SERVICE_KEY" \
  CLOUDFLARE_API_TOKEN="$CLOUDFLARE_API_TOKEN"

echo ""
echo "✓ Secrets configured"
echo ""
echo "🚢 Deploying to Fly.io..."
flyctl deploy

echo ""
echo "✓ Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "  1. Get your Fly.io app IP: flyctl ips list"
echo "  2. Configure Cloudflare DNS to point *.mcp-bridge.xyz to that IP"
echo "  3. Test your deployment!"
