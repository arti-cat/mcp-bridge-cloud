/**
 * Supabase Database Client
 *
 * Handles all database operations for user management and tunnel tracking
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * User Management
 */

export async function getUserByApiKey(apiKey) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('api_key', apiKey)
    .single();

  if (error) {
    console.error('Error fetching user by API key:', error);
    return null;
  }

  return data;
}

export async function getUserBySubdomain(subdomain) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('subdomain', subdomain)
    .single();

  if (error) {
    console.error('Error fetching user by subdomain:', error);
    return null;
  }

  return data;
}

export async function getUserById(userId) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching user by ID:', error);
    return null;
  }

  return data;
}

export async function createUser({ id, email, username, subdomain, apiKey }) {
  const { data, error } = await supabase
    .from('users')
    .insert([
      {
        id, // Use Supabase auth user ID
        email,
        username,
        subdomain,
        api_key: apiKey,
      }
    ])
    .select()
    .single();

  if (error) {
    console.error('Error creating user:', error);
    throw error;
  }

  return data;
}

export async function regenerateApiKey(userId, newApiKey) {
  const { data, error } = await supabase
    .from('users')
    .update({ api_key: newApiKey, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error regenerating API key:', error);
    throw error;
  }

  return data;
}

/**
 * Tunnel Management
 */

export async function updateTunnelStatus(userId, subdomain, status) {
  const { data, error } = await supabase
    .from('tunnels')
    .upsert(
      {
        user_id: userId,
        subdomain,
        status,
        last_seen: new Date().toISOString(),
      },
      {
        onConflict: 'user_id,subdomain',
      }
    )
    .select()
    .single();

  if (error) {
    console.error('Error updating tunnel status:', error);
    return null;
  }

  return data;
}

export async function incrementRequestCount(subdomain) {
  const { error } = await supabase
    .rpc('increment_tunnel_requests', { p_subdomain: subdomain });

  if (error) {
    console.error('Error incrementing request count:', error);
  }
}

export async function getTunnelStats(userId) {
  const { data, error } = await supabase
    .from('tunnels')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching tunnel stats:', error);
    return [];
  }

  return data;
}

/**
 * Database Schema Setup (run once)
 */

export const SCHEMA_SQL = `
-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  subdomain VARCHAR(50) UNIQUE NOT NULL,
  api_key VARCHAR(64) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Tunnels table
CREATE TABLE IF NOT EXISTS tunnels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  subdomain VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'disconnected',
  last_seen TIMESTAMP DEFAULT NOW(),
  requests_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, subdomain)
);

CREATE INDEX IF NOT EXISTS idx_tunnels_subdomain ON tunnels(subdomain);
CREATE INDEX IF NOT EXISTS idx_tunnels_user_id ON tunnels(user_id);

-- Function to increment request count
CREATE OR REPLACE FUNCTION increment_tunnel_requests(p_subdomain VARCHAR)
RETURNS VOID AS $$
BEGIN
  UPDATE tunnels
  SET requests_count = requests_count + 1,
      last_seen = NOW()
  WHERE subdomain = p_subdomain;
END;
$$ LANGUAGE plpgsql;
`;

export default {
  supabase,
  getUserByApiKey,
  getUserBySubdomain,
  getUserById,
  createUser,
  regenerateApiKey,
  updateTunnelStatus,
  incrementRequestCount,
  getTunnelStats,
};
