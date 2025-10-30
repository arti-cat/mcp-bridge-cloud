import { supabase } from './supabaseClient.js';

/**
 * Get authorization header with current session token
 */
async function getAuthHeader() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('Not authenticated');
  }
  return {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  };
}

/**
 * Create new user account (called after Supabase auth signup)
 */
export async function createUserAccount(username, subdomain) {
  const headers = await getAuthHeader();
  const response = await fetch('/api/auth/signup', {
    method: 'POST',
    headers,
    body: JSON.stringify({ username, subdomain }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create account');
  }

  return response.json();
}

/**
 * Get user account information
 */
export async function getAccount() {
  const headers = await getAuthHeader();
  const response = await fetch('/api/account', {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch account');
  }

  return response.json();
}

/**
 * Regenerate API key
 */
export async function regenerateApiKey() {
  const headers = await getAuthHeader();
  const response = await fetch('/api/account/regenerate-key', {
    method: 'POST',
    headers,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to regenerate API key');
  }

  return response.json();
}

/**
 * Get usage metrics
 */
export async function getMetrics() {
  const headers = await getAuthHeader();
  const response = await fetch('/api/account/metrics', {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch metrics');
  }

  return response.json();
}

/**
 * Check subdomain availability
 */
export async function checkSubdomain(subdomain) {
  const response = await fetch(`/api/check-subdomain?subdomain=${encodeURIComponent(subdomain)}`, {
    method: 'GET',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to check subdomain');
  }

  return response.json();
}
