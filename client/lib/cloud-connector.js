/**
 * Cloud Connector - WebSocket Client
 *
 * Connects mcp-bridge local adapter to the cloud tunnel service.
 * Receives HTTP requests from cloud, forwards to local adapter, sends response back.
 */

import WebSocket from 'ws';
import http from 'http';

export class CloudConnector {
  constructor(options = {}) {
    this.apiKey = options.apiKey || process.env.MCP_CLOUD_API_KEY;
    this.tunnelUrl = options.tunnelUrl || process.env.MCP_CLOUD_URL || 'ws://localhost:8080';
    this.localPort = options.localPort || 3000;
    this.debug = options.debug || false;

    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectDelay = 1000; // Start with 1 second
    this.connected = false;
    this.persistentUrl = null;
  }

  /**
   * Connect to cloud tunnel service
   */
  async connect() {
    return new Promise((resolve, reject) => {
      if (!this.apiKey) {
        return reject(new Error('API key required. Set MCP_CLOUD_API_KEY or pass apiKey option.'));
      }

      const wsUrl = `${this.tunnelUrl}/tunnel?api_key=${this.apiKey}`;
      this.log(`Connecting to cloud: ${this.tunnelUrl}`);

      this.ws = new WebSocket(wsUrl);

      this.ws.on('open', () => {
        this.log('✓ Connected to cloud tunnel');
        this.connected = true;
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;
      });

      this.ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleMessage(message, resolve);
        } catch (err) {
          this.log('Error parsing message:', err);
        }
      });

      this.ws.on('close', () => {
        this.log('❌ Disconnected from cloud');
        this.connected = false;
        this.attemptReconnect();
      });

      this.ws.on('error', (error) => {
        this.log('WebSocket error:', error.message);
        reject(error);
      });

      // Timeout after 10 seconds
      setTimeout(() => {
        if (!this.connected) {
          reject(new Error('Connection timeout'));
        }
      }, 10000);
    });
  }

  /**
   * Handle incoming messages from cloud
   */
  async handleMessage(message, connectResolve) {
    const { type } = message;

    switch (type) {
      case 'connected':
        this.persistentUrl = message.url;
        this.log(`✓ Persistent URL: ${this.persistentUrl}`);
        if (connectResolve) {
          connectResolve({ url: this.persistentUrl, subdomain: message.subdomain });
        }
        break;

      case 'http_request':
        await this.handleHttpRequest(message);
        break;

      case 'ping':
        this.ws.send(JSON.stringify({ type: 'pong' }));
        break;

      default:
        this.log(`Unknown message type: ${type}`);
    }
  }

  /**
   * Handle HTTP request from cloud (forward to local adapter)
   */
  async handleHttpRequest(message) {
    const { requestId, method, url, headers, body } = message;

    this.log(`→ HTTP ${method} ${url}`);

    try {
      const response = await this.forwardToLocalAdapter({
        method,
        url,
        headers,
        body,
      });

      // Send response back to cloud
      this.ws.send(JSON.stringify({
        type: 'http_response',
        requestId,
        statusCode: response.statusCode,
        headers: response.headers,
        body: response.body,
      }));

      this.log(`← HTTP ${response.statusCode}`);

    } catch (error) {
      this.log(`Error forwarding request: ${error.message}`);

      // Send error response
      this.ws.send(JSON.stringify({
        type: 'http_response',
        requestId,
        error: error.message,
      }));
    }
  }

  /**
   * Forward request to local HTTP adapter
   */
  forwardToLocalAdapter({ method, url, headers, body }) {
    return new Promise((resolve, reject) => {
      // FIX Bug #2: Always convert body to string consistently
      let bodyStr = null;
      if (body !== null && body !== undefined) {
        // If body is already a string, use it as-is
        // If body is an object, stringify it
        // This ensures consistent handling regardless of how Fastify parsed it
        bodyStr = typeof body === 'string' ? body : JSON.stringify(body);
      }

      // Update Content-Length header if we have a body
      const requestHeaders = { ...headers };
      if (bodyStr) {
        requestHeaders['Content-Length'] = Buffer.byteLength(bodyStr, 'utf8');
      } else {
        // Remove Content-Length if no body
        delete requestHeaders['Content-Length'];
      }

      const options = {
        hostname: 'localhost',
        port: this.localPort,
        path: url,
        method,
        headers: requestHeaders,
      };

      const req = http.request(options, (res) => {
        // FIX Bug #7: Use Buffer.concat instead of string concatenation
        const chunks = [];

        res.on('data', (chunk) => {
          chunks.push(chunk);
        });

        res.on('end', () => {
          // Concatenate all chunks properly, then convert to string
          const responseBody = Buffer.concat(chunks).toString('utf8');

          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: responseBody,
          });
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      if (bodyStr) {
        req.write(bodyStr, 'utf8');
      }

      req.end();
    });
  }

  /**
   * Attempt to reconnect with exponential backoff
   */
  attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.log('❌ Max reconnect attempts reached. Giving up.');
      return;
    }

    this.reconnectAttempts++;
    this.log(`Reconnecting in ${this.reconnectDelay}ms (attempt ${this.reconnectAttempts})...`);

    setTimeout(() => {
      this.connect().catch((err) => {
        this.log(`Reconnect failed: ${err.message}`);
      });
    }, this.reconnectDelay);

    // Exponential backoff: 1s, 2s, 4s, 8s, 16s, 32s (max 32s)
    this.reconnectDelay = Math.min(this.reconnectDelay * 2, 32000);
  }

  /**
   * Disconnect from cloud
   */
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.connected = false;
  }

  /**
   * Get connection status
   */
  isConnected() {
    return this.connected && this.ws && this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * Get persistent URL
   */
  getUrl() {
    return this.persistentUrl;
  }

  /**
   * Debug logging
   */
  log(...args) {
    if (this.debug) {
      console.log('[CloudConnector]', ...args);
    }
  }
}

export default CloudConnector;
