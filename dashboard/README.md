# MCP Bridge Cloud - Dashboard

Self-service web dashboard for user account management.

## Features

- **User Authentication**: Signup/login via Supabase Auth
- **Account Management**: View subdomain, API key, tunnel status
- **Usage Metrics**: Track request counts and connection status
- **API Key Management**: Copy and regenerate API keys
- **Real-time Status**: Live tunnel connection monitoring

## Tech Stack

- **Framework**: Svelte 4 + Vite
- **Authentication**: Supabase Auth
- **Styling**: CSS custom properties (no framework)
- **Build**: Vite (ES modules, fast HMR)

## Development Setup

### Prerequisites

- Node.js 18+
- Supabase project with auth enabled
- Running MCP Bridge Cloud server

### 1. Install Dependencies

```bash
cd dashboard
npm install
```

### 2. Configure Environment

Create `.env` file:

```bash
cp .env.example .env
```

Edit `.env` with your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

**Note**: API calls proxy to `http://localhost:8080` (configure in `vite.config.js`)

### 4. Build for Production

```bash
npm run build
```

Output: `dashboard/dist/`

## Project Structure

```
dashboard/
├── src/
│   ├── main.js                    # Entry point
│   ├── App.svelte                 # Root component (routing)
│   ├── lib/
│   │   ├── supabaseClient.js      # Supabase browser client
│   │   └── api.js                 # API client for server
│   ├── routes/
│   │   ├── Login.svelte           # Login page
│   │   ├── Signup.svelte          # Signup page
│   │   └── Dashboard.svelte       # User dashboard
│   ├── components/
│   │   ├── TunnelStatus.svelte    # Connection status widget
│   │   ├── ApiKeyDisplay.svelte   # API key with copy/regenerate
│   │   └── UsageMetrics.svelte    # Request count stats
│   └── styles/
│       └── global.css             # Global styles
├── public/
│   └── favicon.svg
├── index.html
├── vite.config.js
└── package.json
```

## API Integration

Dashboard communicates with server via REST API:

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/auth/signup` | POST | Yes | Create user account |
| `/api/account` | GET | Yes | Get account info |
| `/api/account/regenerate-key` | POST | Yes | Regenerate API key |
| `/api/account/metrics` | GET | Yes | Get usage stats |
| `/api/check-subdomain` | GET | No | Check subdomain availability |
| `/api/status/:subdomain` | GET | No | Get tunnel status |

**Authentication**: JWT token in `Authorization: Bearer <token>` header

## User Signup Flow

1. User enters email, password, username, subdomain
2. Supabase Auth creates auth user → returns JWT
3. Dashboard calls `/api/auth/signup` with JWT to create database record
4. Server generates 64-char API key
5. Server inserts into `users` table
6. Dashboard displays API key and tunnel URL
7. Admin manually provisions SSL cert: `flyctl certs add subdomain.mcp-bridge.xyz`

## Environment Variables

### Development (`.env`)

- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Supabase anon/public key

### Production (Build-time)

Pass via Docker build args or fly.toml secrets:

```dockerfile
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
```

## Deployment

Dashboard is built and served by the main server:

1. `npm run build` creates `dashboard/dist/`
2. Server serves static files via `@fastify/static`
3. Deployed together in Dockerfile multi-stage build

See main [README.md](../README.md) for deployment instructions.

## Styling

Uses CSS custom properties for theming:

```css
:root {
  --primary: #3b82f6;
  --success: #10b981;
  --error: #ef4444;
  --text: #111827;
  --bg: #ffffff;
}
```

No external CSS framework - keeps bundle small (~15KB Svelte + styles).

## Development Tips

### Hot Module Replacement

Vite provides instant HMR. Edit components and see changes immediately.

### API Proxy

Development server proxies `/api/*` to `http://localhost:8080`. Start server first:

```bash
cd server && npm run dev
```

### Debugging Supabase Auth

Check browser console for auth errors. Common issues:

- Invalid Supabase URL/key in `.env`
- Email not verified (check Supabase auth settings)
- JWT expired (refresh page to get new token)

### Testing Without Server

Mock API responses in `src/lib/api.js` for UI development.

## Production Considerations

### SSL Certificate Provisioning

After user signup, admin must run:

```bash
flyctl certs add subdomain.mcp-bridge.xyz --app mcp-bridge-cloud
```

Takes 30-60 seconds. Dashboard shows "Provisioning..." message.

**Future**: Automate via Fly.io API or migrate to Caddy wildcard SSL (Nov 1+).

### Session Management

- Sessions stored in browser localStorage
- Auto-refresh tokens enabled
- Session persists across page reloads

### Security

- Passwords never sent to our server (Supabase handles auth)
- API keys generated server-side with crypto.randomBytes
- JWT validated on every API request
- Row Level Security enforces data isolation

## Troubleshooting

### "Failed to fetch" errors

- Check server is running on port 8080
- Verify proxy config in `vite.config.js`
- Check CORS headers in server

### Auth not persisting

- Check browser localStorage is enabled
- Verify Supabase session settings
- Clear localStorage and re-login

### Build errors

```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Dashboard not loading in production

- Verify `dashboard/dist/` exists
- Check server logs for static file serving
- Ensure Dockerfile copies dist correctly

## License

MIT - Same as mcp-bridge-cloud
