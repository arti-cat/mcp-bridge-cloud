#!/usr/bin/env node

/**
 * MCP Bridge Cloud - Main Server
 *
 * Provides persistent HTTPS tunnels for mcp-bridge users.
 */

import 'dotenv/config';
import Fastify from 'fastify';
import { createTunnelServer } from './tunnel-relay.js';
import { routeRequest, healthCheck, tunnelStatus } from './routing.js';

const PORT = process.env.PORT || 8080;
const HOST = process.env.HOST || '0.0.0.0';

// Initialize Fastify
const app = Fastify({
  logger: process.env.NODE_ENV !== 'production',
  trustProxy: true, // Important for getting real IP behind Caddy
});

// Health check endpoint
app.get('/healthz', healthCheck);

// Tunnel status endpoint
app.get('/api/status/:subdomain', tunnelStatus);

// Main routing endpoint (handles all subdomain traffic)
app.all('/*', routeRequest);

// Start server
async function start() {
  try {
    // Start HTTP server
    await app.listen({ port: PORT, host: HOST });

    // Initialize WebSocket tunnel server
    createTunnelServer(app.server);

    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║         MCP Bridge Cloud - Tunnel Relay Server                ║');
    console.log('╠════════════════════════════════════════════════════════════════╣');
    console.log(`║  HTTP Server: http://${HOST}:${PORT}                          ║`);
    console.log('║  WebSocket:   ws://localhost:8080/tunnel                      ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    console.log('✓ Server ready to accept tunnel connections');
    console.log('✓ Waiting for mcp-bridge clients to connect...\n');

  } catch (err) {
    console.error('❌ Error starting server:', err);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n\n🛑 Shutting down gracefully...');
  await app.close();
  console.log('✓ Server closed');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n\n🛑 SIGTERM received, shutting down...');
  await app.close();
  process.exit(0);
});

// Start the server
start();
