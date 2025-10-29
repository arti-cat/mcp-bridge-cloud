/**
 * Routing Logic
 *
 * Extracts subdomain from incoming HTTP requests and routes to appropriate WebSocket tunnel.
 */

import { getUserBySubdomain, incrementRequestCount } from './db.js';
import { forwardHttpRequest, isConnected } from './tunnel-relay.js';

/**
 * Extract subdomain from hostname
 * Examples:
 *   username.mcpbridge.io → username
 *   localhost → null (for testing)
 */
export function extractSubdomain(hostname) {
  // For local testing
  if (hostname === 'localhost' || hostname.startsWith('127.0.0.1')) {
    return process.env.TEST_SUBDOMAIN || null;
  }

  // Extract subdomain from *.mcpbridge.io
  const parts = hostname.split('.');
  if (parts.length >= 3 && parts[parts.length - 2] === 'mcpbridge') {
    return parts[0];
  }

  return null;
}

/**
 * Route incoming HTTP request to tunnel
 */
export async function routeRequest(req, reply) {
  // Add CORS headers for all responses
  reply.header('Access-Control-Allow-Origin', '*');
  reply.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  reply.header('Access-Control-Allow-Headers', '*');

  // Handle OPTIONS preflight requests
  if (req.method === 'OPTIONS') {
    return reply.code(200).send();
  }

  const hostname = req.headers.host || '';
  const subdomain = extractSubdomain(hostname);

  if (!subdomain) {
    return reply.code(400).send({
      error: 'Invalid subdomain',
      message: 'Please use format: https://username.mcpbridge.io',
    });
  }

  // Verify user exists
  const user = await getUserBySubdomain(subdomain);
  if (!user) {
    return reply.code(404).send({
      error: 'User not found',
      message: `No user found for subdomain: ${subdomain}`,
    });
  }

  // Check if tunnel is connected
  if (!isConnected(subdomain)) {
    return reply.code(503).send({
      error: 'Tunnel offline',
      message: `User ${subdomain} is not connected. Please start mcp-bridge with --cloud flag.`,
    });
  }

  try {
    // Forward request through tunnel
    const response = await forwardHttpRequest(subdomain, {
      method: req.method,
      url: req.url,
      headers: req.headers,
      body: req.body,
    });

    // Increment request count (async, don't wait)
    incrementRequestCount(subdomain).catch(err => {
      console.error('Error incrementing request count:', err);
    });

    // Send response back to ChatGPT
    reply
      .code(response.statusCode || 200)
      .headers(response.headers || {})
      .send(response.body);

  } catch (error) {
    console.error(`Error forwarding request for ${subdomain}:`, error);

    return reply.code(502).send({
      error: 'Gateway error',
      message: error.message,
    });
  }
}

/**
 * Health check endpoint
 */
export async function healthCheck(req, reply) {
  return reply.send({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'mcp-bridge-cloud',
  });
}

/**
 * Status endpoint (for a specific subdomain)
 */
export async function tunnelStatus(req, reply) {
  const { subdomain } = req.params;

  if (!subdomain) {
    return reply.code(400).send({ error: 'Subdomain required' });
  }

  const user = await getUserBySubdomain(subdomain);
  if (!user) {
    return reply.code(404).send({ error: 'User not found' });
  }

  const connected = isConnected(subdomain);

  return reply.send({
    subdomain,
    username: user.username,
    status: connected ? 'connected' : 'disconnected',
    url: `https://${subdomain}.mcpbridge.io`,
  });
}

export default {
  extractSubdomain,
  routeRequest,
  healthCheck,
  tunnelStatus,
};
