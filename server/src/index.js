#!/usr/bin/env node

/**
 * MCP Bridge Cloud - Main Server
 *
 * Provides persistent HTTPS tunnels for mcp-bridge users.
 */

import 'dotenv/config';
import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createTunnelServer } from './tunnel-relay.js';
import { routeRequest, healthCheck, tunnelStatus } from './routing.js';
import {
  handleSignup,
  handleGetAccount,
  handleRegenerateKey,
  handleGetMetrics,
  handleCheckSubdomain,
} from './api-routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 8080;
const HOST = process.env.HOST || '0.0.0.0';

// Initialize Fastify
const app = Fastify({
  logger: process.env.NODE_ENV !== 'production',
  trustProxy: true, // Important for getting real IP behind Caddy
});

// Health check endpoint
app.get('/healthz', healthCheck);

// Dashboard API endpoints
app.post('/api/auth/signup', handleSignup);
app.get('/api/account', handleGetAccount);
app.post('/api/account/regenerate-key', handleRegenerateKey);
app.get('/api/account/metrics', handleGetMetrics);
app.get('/api/check-subdomain', handleCheckSubdomain);

// Tunnel status endpoint
app.get('/api/status/:subdomain', tunnelStatus);

// Serve static dashboard files for root domain only
const dashboardPath = path.join(__dirname, '../dashboard/dist');

// Check if dashboard is built
const dashboardExists = fs.existsSync(dashboardPath);
if (dashboardExists) {
  app.register(fastifyStatic, {
    root: dashboardPath,
    prefix: '/',
    constraints: {
      host: /^(mcp-bridge\.xyz|localhost|127\.0\.0\.1)(:\d+)?$/ // Only serve on root domain (with optional port)
    }
  });
  console.log('✓ Dashboard static files registered from:', dashboardPath);
} else {
  console.warn('⚠ Dashboard not built yet. Run: cd dashboard && npm install && npm run build');

  // Serve a simple message on root domain when dashboard not built
  app.get('/', async (req, reply) => {
    return reply.type('text/html').send(`
      <html>
        <body>
          <h1>MCP Bridge Cloud</h1>
          <p>Dashboard not built yet. Run: <code>cd dashboard && npm install && npm run build</code></p>
        </body>
      </html>
    `);
  });
}

// Main routing endpoint (handles all subdomain traffic)
// Note: This catches requests that don't match the static file constraints
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
