# MCP Bridge Cloud - Database Schema Documentation

**Generated:** 2025-11-01
**Database:** Supabase PostgreSQL
**Project URL:** https://owdanycanctdmagpsoxj.supabase.co

---

## Overview

The MCP Bridge Cloud database consists of two main tables:
1. **users** - User account and authentication data
2. **tunnels** - WebSocket tunnel connection tracking and metrics

---

## Tables

### `users` Table

Stores user account information, authentication credentials, and subdomain assignments.

#### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | NO | `uuid_generate_v4()` | Primary key, links to Supabase auth.users |
| `email` | VARCHAR(255) | NO | - | User email address (unique) |
| `username` | VARCHAR(50) | NO | - | Username for display (unique) |
| `subdomain` | VARCHAR(50) | NO | - | Assigned subdomain (e.g., "testuser" for testuser.mcp-bridge.xyz) (unique) |
| `api_key` | VARCHAR(64) | NO | - | API key for tunnel authentication (unique, 64-char random string) |
| `created_at` | TIMESTAMP | NO | `NOW()` | Account creation timestamp |
| `updated_at` | TIMESTAMP | NO | `NOW()` | Last update timestamp |

#### Constraints

- **Primary Key:** `id`
- **Unique Constraints:**
  - `email` (unique)
  - `username` (unique)
  - `subdomain` (unique)
  - `api_key` (unique)

#### Security

- **Row Level Security (RLS):** ENABLED
- **Policies:** Users can only view their own data (authenticated via `auth.uid()`)

#### Sample Data

```json
{
  "id": "d493a53a-3f2e-4479-813a-e1a36bd6229a",
  "email": "test@example.com",
  "username": "testuser",
  "subdomain": "testuser",
  "api_key": "test_api_key_123",
  "created_at": "2025-10-29T19:21:39.346919",
  "updated_at": "2025-10-29T19:21:39.346919"
}
```

#### Database Functions

**Related Functions:**
- `getUserByApiKey(apiKey)` - Look up user by API key
- `getUserBySubdomain(subdomain)` - Look up user by subdomain
- `getUserById(userId)` - Look up user by ID
- `createUser({id, email, username, subdomain, apiKey})` - Create new user
- `regenerateApiKey(userId, newApiKey)` - Update user's API key

---

### `tunnels` Table

Tracks WebSocket tunnel connection status, metrics, and last activity.

#### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | NO | `uuid_generate_v4()` | Primary key |
| `user_id` | UUID | YES | - | Foreign key to users.id (CASCADE on delete) |
| `subdomain` | VARCHAR(50) | NO | - | Subdomain this tunnel serves |
| `status` | VARCHAR(20) | YES | `'disconnected'` | Connection status ('connected' or 'disconnected') |
| `last_seen` | TIMESTAMP | YES | `NOW()` | Last heartbeat/activity timestamp |
| `requests_count` | INTEGER | YES | `0` | Total HTTP requests processed |
| `created_at` | TIMESTAMP | YES | `NOW()` | Tunnel record creation timestamp |

#### Constraints

- **Primary Key:** `id`
- **Foreign Key:** `user_id` REFERENCES `users(id)` ON DELETE CASCADE
- **Unique Constraint:** `(user_id, subdomain)` - One tunnel per user per subdomain

#### Indexes

- `idx_tunnels_subdomain` - Index on `subdomain` (for fast routing lookups)
- `idx_tunnels_user_id` - Index on `user_id` (for user-specific queries)

#### Sample Data

```json
{
  "id": "b54fbbe9-a0d8-40ec-948c-c323eac05e3d",
  "user_id": "d493a53a-3f2e-4479-813a-e1a36bd6229a",
  "subdomain": "testuser",
  "status": "disconnected",
  "last_seen": "2025-10-30T14:07:31.378",
  "requests_count": 1,
  "created_at": "2025-10-29T21:25:18.925506"
}
```

#### Database Functions

**Related Functions:**
- `updateTunnelStatus(userId, subdomain, status)` - Update/insert tunnel status (UPSERT)
- `incrementRequestCount(subdomain)` - Atomically increment request counter
- `getTunnelStats(userId)` - Get all tunnel stats for a user

---

## PostgreSQL Functions

### `increment_tunnel_requests(p_subdomain VARCHAR)`

Atomically increments the request count and updates last_seen timestamp for a tunnel.

```sql
CREATE OR REPLACE FUNCTION increment_tunnel_requests(p_subdomain VARCHAR)
RETURNS VOID AS $$
BEGIN
  UPDATE tunnels
  SET requests_count = requests_count + 1,
      last_seen = NOW()
  WHERE subdomain = p_subdomain;
END;
$$ LANGUAGE plpgsql;
```

**Purpose:** Ensures thread-safe request counting even under high concurrency.

**Usage:** Called via `supabase.rpc('increment_tunnel_requests', { p_subdomain: 'testuser' })`

---

## Relationships

```
users (1) ──< tunnels (many)
  └─ id ──────> user_id
```

- One user can have multiple tunnel records (though typically one active tunnel per subdomain)
- Deleting a user cascades to delete all their tunnel records

---

## Schema Creation SQL

The complete schema is defined in `server/src/db.js` as `SCHEMA_SQL`:

```sql
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
```

---

## Data Flow

### User Registration Flow

1. User signs up via Supabase Auth (creates `auth.users` record)
2. Dashboard calls `createUser()` to create `users` record with same UUID
3. System generates unique subdomain and API key
4. User receives API key for tunnel authentication

### Tunnel Connection Flow

1. Client connects to WebSocket with API key
2. Server validates API key via `getUserByApiKey()`
3. Server calls `updateTunnelStatus(userId, subdomain, 'connected')`
4. Tunnel record is UPSERTED (created if not exists, updated if exists)

### HTTP Request Flow

1. ChatGPT sends request to `https://testuser.mcp-bridge.xyz`
2. Server extracts subdomain "testuser"
3. Server looks up active WebSocket connection for subdomain
4. Server calls `incrementRequestCount('testuser')` to track metrics
5. Request is proxied through WebSocket to user's local machine

### Disconnection Flow

1. WebSocket closes (timeout or client disconnect)
2. Server calls `updateTunnelStatus(userId, subdomain, 'disconnected')`
3. `last_seen` timestamp preserved for status monitoring

---

## Performance Considerations

### Indexes

- **Subdomain index** (`idx_tunnels_subdomain`) is critical for routing performance
  - Every incoming HTTP request performs `WHERE subdomain = ?` lookup
  - Index ensures O(log n) lookup time instead of O(n) table scan

- **User ID index** (`idx_tunnels_user_id`) optimizes dashboard queries
  - Users viewing their tunnel stats: `WHERE user_id = ?`
  - Supports efficient JOIN operations between users and tunnels

### UPSERT Pattern

The `updateTunnelStatus()` function uses UPSERT (INSERT ... ON CONFLICT):
- Avoids race conditions when multiple connections start simultaneously
- Ensures exactly one tunnel record per (user_id, subdomain) pair
- Atomic operation prevents duplicate records

### Request Counter

The `increment_tunnel_requests()` function uses atomic UPDATE:
- Thread-safe increment even under high concurrency
- Updates both counter and timestamp in single transaction
- No risk of lost increments or race conditions

---

## Security Notes

### Row Level Security (RLS)

- **Enabled on `users` table** to prevent users from seeing other users' data
- **Policy:** Users can only SELECT their own records via `auth.uid() = id`
- Service role key bypasses RLS for server operations

### API Key Security

- API keys are 64-character random strings
- Stored in plaintext (not hashed) as they function like bearer tokens
- **TODO:** Consider adding rate limiting based on API key
- **TODO:** Consider API key rotation policy (expire old keys)

### Sensitive Data

The following fields should NEVER be exposed in public APIs:
- `users.api_key` - Only show to authenticated owner
- `users.email` - Only show to authenticated owner

---

## Migration History

No formal migration system in place. Schema changes are applied manually via Supabase SQL Editor.

**Current Version:** Initial schema (v1)
**Last Modified:** 2025-10-29

---

## Monitoring Queries

### Active Tunnels

```sql
SELECT u.username, u.subdomain, t.status, t.last_seen, t.requests_count
FROM users u
LEFT JOIN tunnels t ON u.id = t.user_id
WHERE t.status = 'connected'
ORDER BY t.last_seen DESC;
```

### Inactive Users (no recent activity)

```sql
SELECT u.username, u.subdomain, t.last_seen
FROM users u
LEFT JOIN tunnels t ON u.id = t.user_id
WHERE t.last_seen < NOW() - INTERVAL '7 days'
  OR t.last_seen IS NULL
ORDER BY t.last_seen DESC NULLS LAST;
```

### Top Users by Request Volume

```sql
SELECT u.username, u.subdomain, SUM(t.requests_count) as total_requests
FROM users u
LEFT JOIN tunnels t ON u.id = t.user_id
GROUP BY u.id, u.username, u.subdomain
ORDER BY total_requests DESC
LIMIT 10;
```

---

## Future Enhancements

### Potential Schema Additions

1. **Usage Limits Table**
   - Track monthly request quotas
   - Enforce rate limits per tier (free/pro/team)

2. **Request Logs Table**
   - Store request/response metadata for debugging
   - Support user-facing request history in dashboard

3. **Billing Table**
   - Track subscriptions, payments, tier changes
   - Link to Stripe customer IDs

4. **Audit Log Table**
   - Track API key regenerations
   - Track subdomain changes
   - Security event logging

### Performance Optimizations

- Add materialized view for usage analytics
- Partition `request_logs` table by month if implemented
- Add composite indexes for common query patterns

---

## References

- Supabase Project: https://owdanycanctdmagpsoxj.supabase.co
- Schema Definition: `server/src/db.js`
- Database Functions: `server/src/db.js` (JavaScript wrappers)
- Row Level Security Policies: Configured in Supabase Dashboard
