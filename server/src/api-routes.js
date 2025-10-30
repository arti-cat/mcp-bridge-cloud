/**
 * API Routes for Dashboard
 *
 * Provides REST API endpoints for user account management
 */

import { createClient } from '@supabase/supabase-js';
import {
  createUser,
  getUserById,
  getUserBySubdomain,
  regenerateApiKey,
  getTunnelStats,
} from './db.js';
import { isConnected } from './tunnel-relay.js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

/**
 * Middleware: Validate JWT and extract user
 */
export async function validateAuth(req, reply) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split('Bearer ')[1];

  if (!token) {
    return reply.code(401).send({
      error: 'Unauthorized',
      message: 'No token provided',
    });
  }

  // Create Supabase client and validate token
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return reply.code(401).send({
      error: 'Unauthorized',
      message: 'Invalid token',
    });
  }

  // Attach user to request
  req.authUser = user;
}

/**
 * POST /api/auth/signup
 * Create user account after Supabase auth signup
 */
export async function handleSignup(req, reply) {
  await validateAuth(req, reply);
  if (reply.sent) return;

  const { username, subdomain } = req.body;

  if (!username || !subdomain) {
    return reply.code(400).send({
      error: 'Bad Request',
      message: 'username and subdomain are required',
    });
  }

  // Validate subdomain format
  if (!/^[a-z0-9-]+$/.test(subdomain)) {
    return reply.code(400).send({
      error: 'Bad Request',
      message: 'Subdomain can only contain lowercase letters, numbers, and hyphens',
    });
  }

  if (subdomain.length < 3) {
    return reply.code(400).send({
      error: 'Bad Request',
      message: 'Subdomain must be at least 3 characters',
    });
  }

  // Check if subdomain already exists
  const existingUser = await getUserBySubdomain(subdomain);
  if (existingUser) {
    return reply.code(409).send({
      error: 'Conflict',
      message: 'Subdomain already taken',
    });
  }

  try {
    // Generate API key
    const crypto = await import('crypto');
    const apiKey = crypto.randomBytes(32).toString('hex');

    // Create user in database
    const user = await createUser({
      id: req.authUser.id,
      email: req.authUser.email,
      username,
      subdomain,
      apiKey,
    });

    return reply.code(201).send({
      success: true,
      user: {
        username: user.username,
        subdomain: user.subdomain,
        api_key: user.api_key,
        url: `https://${user.subdomain}.mcp-bridge.xyz`,
      },
      message: 'Account created successfully. SSL certificate provisioning may take 30-60 seconds.',
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return reply.code(500).send({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
}

/**
 * GET /api/account
 * Get user account information
 */
export async function handleGetAccount(req, reply) {
  await validateAuth(req, reply);
  if (reply.sent) return;

  try {
    const user = await getUserById(req.authUser.id);

    if (!user) {
      return reply.code(404).send({
        error: 'Not Found',
        message: 'User account not found',
      });
    }

    return reply.send({
      username: user.username,
      subdomain: user.subdomain,
      api_key: user.api_key,
      email: user.email,
      created_at: user.created_at,
      url: `https://${user.subdomain}.mcp-bridge.xyz`,
    });
  } catch (error) {
    console.error('Error fetching account:', error);
    return reply.code(500).send({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
}

/**
 * POST /api/account/regenerate-key
 * Regenerate API key
 */
export async function handleRegenerateKey(req, reply) {
  await validateAuth(req, reply);
  if (reply.sent) return;

  try {
    // Generate new API key
    const crypto = await import('crypto');
    const newApiKey = crypto.randomBytes(32).toString('hex');

    // Update in database
    await regenerateApiKey(req.authUser.id, newApiKey);

    return reply.send({
      success: true,
      api_key: newApiKey,
      message: 'API key regenerated successfully',
    });
  } catch (error) {
    console.error('Error regenerating API key:', error);
    return reply.code(500).send({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
}

/**
 * GET /api/account/metrics
 * Get usage metrics
 */
export async function handleGetMetrics(req, reply) {
  await validateAuth(req, reply);
  if (reply.sent) return;

  try {
    const user = await getUserById(req.authUser.id);
    if (!user) {
      return reply.code(404).send({
        error: 'Not Found',
        message: 'User not found',
      });
    }

    const tunnelStats = await getTunnelStats(user.id);
    const tunnel = tunnelStats[0] || {
      requests_count: 0,
      status: 'disconnected',
      last_seen: null,
    };

    // Check real-time connection status
    const connected = isConnected(user.subdomain);

    return reply.send({
      requests_count: tunnel.requests_count,
      status: connected ? 'connected' : 'disconnected',
      last_seen: tunnel.last_seen,
    });
  } catch (error) {
    console.error('Error fetching metrics:', error);
    return reply.code(500).send({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
}

/**
 * GET /api/check-subdomain
 * Check if subdomain is available
 */
export async function handleCheckSubdomain(req, reply) {
  const { subdomain } = req.query;

  if (!subdomain) {
    return reply.code(400).send({
      error: 'Bad Request',
      message: 'subdomain query parameter is required',
    });
  }

  const user = await getUserBySubdomain(subdomain);

  return reply.send({
    subdomain,
    available: !user,
  });
}

export default {
  handleSignup,
  handleGetAccount,
  handleRegenerateKey,
  handleGetMetrics,
  handleCheckSubdomain,
};
