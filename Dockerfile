# Dockerfile for MCP Bridge Cloud Server
# TEMPORARY: Simplified for Fly.io HTTP service (Fly.io handles SSL)
# TODO: Switch back to Caddy version after Let's Encrypt rate limit expires (Oct 31, 2025)

FROM node:20-alpine

# Install ca-certificates for SSL/TLS
RUN apk add --no-cache ca-certificates

# Set working directory
WORKDIR /app

# Install Node.js dependencies first (for caching)
COPY server/package*.json ./
RUN npm ci --only=production

# Copy application code
COPY server/ ./

# Expose port 8080 (Fly.io will handle SSL on 443)
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/healthz', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start Node.js server directly
CMD ["node", "src/index.js"]
