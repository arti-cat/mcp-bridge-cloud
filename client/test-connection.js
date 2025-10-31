#!/usr/bin/env node
/**
 * Test script to verify WebSocket connection to mcp-bridge-cloud
 */

import { CloudConnector } from './lib/cloud-connector.js';

// Configuration
const config = {
  apiKey: process.env.MCP_API_KEY || 'dfcdc844ef1f140aa0f5fe095b3202e76125702cbe14004e125bc310433f1bd6',
  tunnelUrl: process.env.MCP_CLOUD_URL || 'wss://mcp-bridge.xyz',
  localPort: 3000,
  debug: true,
};

console.log('🧪 Testing WebSocket Connection to mcp-bridge-cloud');
console.log('================================================\n');
console.log('Config:', {
  apiKey: config.apiKey.substring(0, 10) + '...',
  tunnelUrl: config.tunnelUrl,
  localPort: config.localPort,
});
console.log('');

// Create connector
const client = new CloudConnector(config);

// Connect
console.log('⏳ Connecting to server...\n');

try {
  const result = await client.connect();

  console.log('✅ CONNECTED!');
  console.log('   URL:', result.url);
  console.log('   Subdomain:', result.subdomain);
  console.log('');
  console.log('🎉 Test successful! The tunnel is now active.');
  console.log('');
  console.log('You can now test with:');
  console.log(`   curl https://${result.subdomain}.mcp-bridge.xyz`);
  console.log('');
  console.log('⚠️  NOTE: Requests will fail with "Connection refused" because no local adapter is running.');
  console.log('   This is expected - the WebSocket tunnel itself is working!');
  console.log('');
  console.log('Press Ctrl+C to disconnect...');

  // Keep running until interrupted
  process.on('SIGINT', () => {
    console.log('\n\n👋 Shutting down...');
    client.disconnect();
    process.exit(0);
  });

} catch (error) {
  console.error('❌ Connection failed:', error.message);
  process.exit(1);
}
