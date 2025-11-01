/**
 * Routing Logic
 *
 * Extracts subdomain from incoming HTTP requests and routes to appropriate WebSocket tunnel.
 */

import { getUserBySubdomain, incrementRequestCount } from './db.js';
import { forwardHttpRequest, isConnected, getSessionId } from './tunnel-relay.js';

/**
 * Extract subdomain from hostname
 * Examples:
 *   username.mcp-bridge.xyz → username
 *   localhost → null (for testing)
 */
export function extractSubdomain(hostname) {
  // For local testing
  if (hostname === 'localhost' || hostname.startsWith('127.0.0.1')) {
    return process.env.TEST_SUBDOMAIN || null;
  }

  // Extract subdomain from hostname
  const parts = hostname.split('.');
  if (parts.length >= 3) {
    // Check for mcp-bridge.xyz (parts: subdomain, mcp-bridge, xyz)
    if (parts[parts.length - 2] === 'mcp-bridge' && parts[parts.length - 1] === 'xyz') {
      return parts[0];
    }
    // Check for fly.dev (username-mcp-bridge-cloud.fly.dev format)
    if (parts[parts.length - 2] === 'fly' && parts[parts.length - 1] === 'dev') {
      // For username-mcp-bridge-cloud.fly.dev format
      if (parts.length === 3) {
        const appName = parts[0]; // e.g., "articat-mcp-bridge-cloud"
        // Extract username from "username-mcp-bridge-cloud"
        const match = appName.match(/^(.+)-mcp-bridge-cloud$/);
        if (match) {
          return match[1]; // Returns "articat"
        }
        // Fallback for base mcp-bridge-cloud.fly.dev
        if (appName === 'mcp-bridge-cloud') {
          return process.env.DEFAULT_SUBDOMAIN || 'articat';
        }
      }
    }
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
      message: 'Please use format: https://username.mcp-bridge.xyz',
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
    // Filter dangerous headers that shouldn't be forwarded
    const filteredHeaders = {};
    const dangerousHeaders = new Set([
      'host', 'connection', 'transfer-encoding', 'content-length',
      'keep-alive', 'proxy-connection', 'upgrade', 'http2-settings'
    ]);

    for (const [key, value] of Object.entries(req.headers)) {
      if (!dangerousHeaders.has(key.toLowerCase())) {
        filteredHeaders[key] = value;
      }
    }

    // Add correct Host header for local adapter
    // Configurable via LOCAL_ADAPTER_HOST env variable (default: localhost:3000)
    filteredHeaders.host = process.env.LOCAL_ADAPTER_HOST || 'localhost:3000';

    // Forward request through tunnel
    const response = await forwardHttpRequest(subdomain, {
      method: req.method,
      url: req.url,
      headers: filteredHeaders,
      body: req.body,
    });

    // Increment request count (async, don't wait)
    incrementRequestCount(subdomain).catch(err => {
      console.error('Error incrementing request count:', err);
    });

    // Filter response headers - remove hop-by-hop headers
    const responseHeaders = {};
    if (response.headers) {
      for (const [key, value] of Object.entries(response.headers)) {
        if (!dangerousHeaders.has(key.toLowerCase())) {
          responseHeaders[key] = value;
        }
      }
    }

    // Add MCP session ID header (required by ChatGPT)
    const sessionId = getSessionId(subdomain);
    if (sessionId) {
      responseHeaders['Mcp-Session-Id'] = sessionId;
      // CORS: expose the session header to browser clients
      responseHeaders['Access-Control-Expose-Headers'] = 'Mcp-Session-Id';
    }

    // Send response back to ChatGPT
    reply
      .code(response.statusCode || 200)
      .headers(responseHeaders)
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
    url: `https://${subdomain}.mcp-bridge.xyz`,
  });
}

export default {
  extractSubdomain,
  routeRequest,
  healthCheck,
  tunnelStatus,
};
