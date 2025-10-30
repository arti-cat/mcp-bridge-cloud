#!/usr/bin/env node
/**
 * Test script to verify WebSocket connection to mcp-bridge-cloud
 */

import { CloudConnector } from './lib/cloud-connector.js';

// Configuration
const config = {
  apiKey: '7b48fd731ad2ef3c74c6ed3807087af15b9363c8cb2799c5e4b6adec33084ba6',  // articat API key
  tunnelUrl: 'wss://mcp-bridge-cloud.fly.dev',  // Fly.io direct (for testing)
  localPort: 3000,  // Local adapter port (won't be used for this test)
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
