/**
 * Tunnel Relay - WebSocket Server
 *
 * Accepts WebSocket connections from users running mcp-bridge locally.
 * Routes HTTP requests from ChatGPT → user's WebSocket → local adapter → back.
 */

import { WebSocketServer } from 'ws';
import { randomUUID } from 'crypto';
import { getUserByApiKey, updateTunnelStatus } from './db.js';

// Active connections: subdomain → WebSocket connection
const activeConnections = new Map();

// Session IDs: subdomain → sessionId (persists across tunnel lifetime)
const sessionIds = new Map();

// Pending HTTP requests: requestId → { resolve, reject, timeout }
const pendingRequests = new Map();

const REQUEST_TIMEOUT = 30000; // 30 seconds

/**
 * Initialize WebSocket server
 */
export function createTunnelServer(httpServer) {
  const wss = new WebSocketServer({ server: httpServer, path: '/tunnel' });

  wss.on('connection', async (ws, req) => {
    console.log('New WebSocket connection attempt');

    // Extract API key from query params or headers
    const url = new URL(req.url, `http://${req.headers.host}`);
    const apiKey = url.searchParams.get('api_key') || req.headers['x-api-key'];

    if (!apiKey) {
      console.log('❌ Connection rejected: No API key provided');
      ws.close(1008, 'API key required');
      return;
    }

    // Validate API key and get user
    const user = await getUserByApiKey(apiKey);
    if (!user) {
      console.log('❌ Connection rejected: Invalid API key');
      ws.close(1008, 'Invalid API key');
      return;
    }

    const subdomain = user.subdomain;
    console.log(`✓ User connected: ${user.username} (${subdomain})`);

    // Check if subdomain already has active connection
    if (activeConnections.has(subdomain)) {
      console.log(`⚠ Closing existing connection for ${subdomain}`);
      const existingWs = activeConnections.get(subdomain);
      existingWs.close(1000, 'New connection from same user');
    }

    // Store connection
    activeConnections.set(subdomain, ws);
    ws.subdomain = subdomain;
    ws.userId = user.id;
    ws.isAlive = true;

    // Generate session ID if not exists (persists across reconnections)
    if (!sessionIds.has(subdomain)) {
      sessionIds.set(subdomain, randomUUID());
      console.log(`Generated session ID for ${subdomain}: ${sessionIds.get(subdomain)}`);
    }

    // Update tunnel status in database
    await updateTunnelStatus(user.id, subdomain, 'connected');

    // Handle pong responses (for heartbeat)
    ws.on('pong', () => {
      ws.isAlive = true;
    });

    // Handle messages from client (responses to HTTP requests)
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        handleClientMessage(ws, message);
      } catch (err) {
        console.error('Error parsing message:', err);
      }
    });

    // Handle disconnection
    ws.on('close', async () => {
      console.log(`❌ User disconnected: ${subdomain}`);
      activeConnections.delete(subdomain);
      await updateTunnelStatus(user.id, subdomain, 'disconnected');

      // Reject all pending requests for this connection
      pendingRequests.forEach((pending, requestId) => {
        if (pending.subdomain === subdomain) {
          clearTimeout(pending.timeout);
          pending.reject(new Error('Connection closed'));
          pendingRequests.delete(requestId);
        }
      });
    });

    // Handle errors
    ws.on('error', (error) => {
      console.error(`WebSocket error for ${subdomain}:`, error);
    });

    // Send welcome message
    ws.send(JSON.stringify({
      type: 'connected',
      subdomain,
      url: `https://${subdomain}.mcp-bridge.xyz`
    }));
  });

  // Heartbeat: ping all connections every 30s
  const heartbeatInterval = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (ws.isAlive === false) {
        console.log(`💔 Terminating inactive connection: ${ws.subdomain}`);
        return ws.terminate();
      }

      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on('close', () => {
    clearInterval(heartbeatInterval);
  });

  console.log('✓ WebSocket tunnel server initialized');
  return wss;
}

/**
 * Handle messages from client (HTTP response)
 */
function handleClientMessage(ws, message) {
  const { type, requestId, statusCode, headers, body, error } = message;

  if (type !== 'http_response') {
    console.log(`Unknown message type: ${type}`);
    return;
  }

  const pending = pendingRequests.get(requestId);
  if (!pending) {
    console.log(`⚠ No pending request for ID: ${requestId}`);
    return;
  }

  // Clear timeout
  clearTimeout(pending.timeout);
  pendingRequests.delete(requestId);

  if (error) {
    pending.reject(new Error(error));
  } else {
    pending.resolve({ statusCode, headers, body });
  }
}

/**
 * Forward HTTP request to user's local adapter via WebSocket
 */
export async function forwardHttpRequest(subdomain, req) {
  const ws = activeConnections.get(subdomain);

  if (!ws || ws.readyState !== 1) { // 1 = OPEN
    throw new Error('Tunnel not connected');
  }

  return new Promise((resolve, reject) => {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Set timeout
    const timeout = setTimeout(() => {
      pendingRequests.delete(requestId);
      reject(new Error('Request timeout'));
    }, REQUEST_TIMEOUT);

    // Store pending request
    pendingRequests.set(requestId, {
      resolve,
      reject,
      timeout,
      subdomain,
    });

    // Send request to client
    const message = {
      type: 'http_request',
      requestId,
      method: req.method,
      url: req.url,
      headers: req.headers,
      body: req.body,
    };

    ws.send(JSON.stringify(message));
  });
}

/**
 * Get connection status for a subdomain
 */
export function isConnected(subdomain) {
  const ws = activeConnections.get(subdomain);
  return ws && ws.readyState === 1;
}

/**
 * Get all active connections
 */
export function getActiveConnections() {
  return Array.from(activeConnections.keys());
}

/**
 * Get session ID for a subdomain
 */
export function getSessionId(subdomain) {
  return sessionIds.get(subdomain) || null;
}

export default {
  createTunnelServer,
  forwardHttpRequest,
  isConnected,
  getActiveConnections,
  getSessionId,
};
