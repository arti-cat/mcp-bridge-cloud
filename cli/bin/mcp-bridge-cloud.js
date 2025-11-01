#!/usr/bin/env node

/**
 * mcp-bridge-cloud CLI
 *
 * Start local MCP server with persistent cloud tunnel
 *
 * Usage:
 *   mcp-bridge-cloud --api-key YOUR_API_KEY
 *   mcp-bridge-cloud --api-key YOUR_API_KEY --port 3000
 *   mcp-bridge-cloud --api-key YOUR_API_KEY --dir ~/Documents
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import killPort from 'kill-port';
import { CloudConnector } from 'mcp-bridge-cloud-client';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Colors
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function parseArgs() {
  const args = process.argv.slice(2);
  const config = {
    port: 3000,
    dir: process.cwd(),
    apiKey: process.env.MCP_CLOUD_API_KEY || null,
    tunnelUrl: process.env.MCP_CLOUD_URL || 'wss://mcp-bridge.xyz',
    debug: process.env.DEBUG === '1',
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--port':
      case '-p':
        config.port = parseInt(args[++i], 10);
        break;
      case '--dir':
      case '-d':
        config.dir = args[++i];
        break;
      case '--api-key':
      case '-k':
        config.apiKey = args[++i];
        break;
      case '--tunnel-url':
      case '-t':
        config.tunnelUrl = args[++i];
        break;
      case '--debug':
        config.debug = true;
        break;
      case '--help':
      case '-h':
        showHelp();
        process.exit(0);
        break;
    }
  }

  return config;
}

function showHelp() {
  log('\nmcp-bridge-cloud', colors.bright);
  log('='.repeat(60), colors.bright);
  log('\nPersistent cloud tunnels for MCP servers\n');

  log('Usage:', colors.cyan);
  log('  mcp-bridge-cloud --api-key YOUR_API_KEY [options]\n');

  log('Options:', colors.cyan);
  log('  -k, --api-key <key>        API key from mcp-bridge.xyz (required)');
  log('  -p, --port <number>        Port for adapter (default: 3000)');
  log('  -d, --dir <path>           Root directory to serve (default: current dir)');
  log('  -t, --tunnel-url <url>     Cloud server URL (default: wss://mcp-bridge.xyz)');
  log('  --debug                    Enable debug logging');
  log('  -h, --help                 Show this help\n');

  log('Environment Variables:', colors.cyan);
  log('  MCP_CLOUD_API_KEY         API key (alternative to --api-key)');
  log('  MCP_CLOUD_URL             Cloud server URL');
  log('  DEBUG=1                   Enable debug mode\n');

  log('Examples:', colors.cyan);
  log('  mcp-bridge-cloud --api-key abc123');
  log('  mcp-bridge-cloud --api-key abc123 --dir ~/Documents');
  log('  mcp-bridge-cloud --api-key abc123 --port 3001\n');

  log('Get API Key:', colors.cyan);
  log('  Sign up at https://mcp-bridge.xyz/dashboard\n');
}

async function startAdapter(config) {
  return new Promise(async (resolve, reject) => {
    log('\n🚀 Starting MCP filesystem adapter...', colors.bright);
    log(`   Root directory: ${config.dir}`, colors.cyan);
    log(`   Port: ${config.port}`, colors.cyan);

    // Kill any existing process on the port
    try {
      await killPort(config.port);
    } catch (err) {
      // Ignore errors if port is not in use
    }

    const adapterPath = join(__dirname, '../lib/adapter.js');

    const adapter = spawn('node', [adapterPath], {
      env: {
        ...process.env,
        PORT: config.port.toString(),
        ALLOWED_DIR: config.dir,
        DEBUG: config.debug ? '1' : '0',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let started = false;

    adapter.stdout?.on('data', (data) => {
      const output = data.toString();
      if (config.debug) {
        console.log('[ADAPTER]', output);
      }
      if (output.includes('Adapter Running') || output.includes('listening')) {
        if (!started) {
          started = true;
          log('✓ Adapter running', colors.green);
          resolve(adapter);
        }
      }
    });

    adapter.stderr?.on('data', (data) => {
      if (config.debug) {
        console.error('[ADAPTER ERROR]', data.toString());
      }
    });

    adapter.on('error', (err) => {
      reject(err);
    });

    adapter.on('exit', (code, signal) => {
      log(`⚠ Adapter exited (code: ${code}, signal: ${signal})`, colors.yellow);
    });

    // Give it 5 seconds to start
    setTimeout(() => {
      if (!started) {
        log('✓ Adapter started', colors.green);
        resolve(adapter);
      }
    }, 5000);
  });
}

async function connectCloud(config) {
  log('\n🌐 Connecting to MCP Bridge Cloud...', colors.bright);

  const client = new CloudConnector({
    apiKey: config.apiKey,
    tunnelUrl: config.tunnelUrl,
    localPort: config.port,
    debug: config.debug,
  });

  const result = await client.connect();

  log(`✓ Connected to cloud`, colors.green);
  log(`   Your persistent URL: ${result.url}`, colors.green + colors.bright);

  return { client, url: result.url, subdomain: result.subdomain };
}

async function main() {
  const config = parseArgs();

  log('\n╔═══════════════════════════════════════════════════════════╗', colors.bright);
  log('║              MCP Bridge Cloud                             ║', colors.bright);
  log('║         Persistent Tunnels for MCP Servers                ║', colors.bright);
  log('╚═══════════════════════════════════════════════════════════╝', colors.bright);

  // Validate API key
  if (!config.apiKey) {
    log('\n✗ Error: API key required', colors.red);
    log('\nProvide API key via:', colors.cyan);
    log('  --api-key YOUR_KEY');
    log('  or set MCP_CLOUD_API_KEY environment variable\n');
    log('Get your API key at: https://mcp-bridge.xyz/dashboard\n', colors.cyan);
    process.exit(1);
  }

  let adapter, cloudConnection;

  try {
    // Start adapter
    adapter = await startAdapter(config);

    // Wait for adapter to initialize
    log('   Waiting for adapter to initialize...', colors.cyan);
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Connect to cloud
    cloudConnection = await connectCloud(config);

    // Success!
    log('\n' + '═'.repeat(60), colors.green);
    log('✓ Server Ready!', colors.green + colors.bright);
    log('═'.repeat(60), colors.green);

    log('\n📋 Configuration:', colors.bright);
    log(`   Adapter Port: ${config.port}`, colors.cyan);
    log(`   Root Directory: ${config.dir}`, colors.cyan);
    log(`   Subdomain: ${cloudConnection.subdomain}`, colors.cyan);
    log(`   Persistent URL: ${cloudConnection.url}`, colors.cyan);

    log('\n🎯 Next Steps:', colors.bright);
    log('\n   1. Copy your persistent URL:', colors.cyan);
    log(`      ${cloudConnection.url}`, colors.green + colors.bright);

    log('\n   2. Add to ChatGPT:', colors.cyan);
    log('      • Settings → Apps & Connectors → Developer Mode');
    log('      • Add Remote MCP Server');
    log(`      • URL: ${cloudConnection.url}`);
    log('      • Protocol: HTTP (streaming)');
    log('      • Authentication: None');

    log('\n   3. Your URL persists across restarts!', colors.cyan);
    log('      No need to reconfigure ChatGPT every time ✨');

    log('\n' + '─'.repeat(60), colors.cyan);
    log('Press Ctrl+C to stop\n', colors.yellow);

    // Handle graceful shutdown
    const cleanup = () => {
      log('\n\n🛑 Shutting down...', colors.yellow);

      if (cloudConnection?.client) {
        cloudConnection.client.disconnect();
        log('✓ Cloud connection closed', colors.green);
      }

      if (adapter) {
        adapter.kill();
        log('✓ Adapter stopped', colors.green);
      }

      log('\nGoodbye! 👋\n', colors.cyan);
      process.exit(0);
    };

    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);

  } catch (error) {
    log(`\n✗ Error: ${error.message}`, colors.red);

    if (cloudConnection?.client) cloudConnection.client.disconnect();
    if (adapter) adapter.kill();

    process.exit(1);
  }
}

main().catch((err) => {
  log(`\nFatal error: ${err.message}`, colors.red);
  process.exit(1);
});
