# Dockerfile for MCP Bridge Cloud Server with Dashboard
# Multi-stage build: Build dashboard, then run server

# Stage 1: Build Dashboard
FROM node:20-alpine AS dashboard-builder

WORKDIR /dashboard

# Copy dashboard package files
COPY dashboard/package*.json ./
RUN npm ci

# Copy dashboard source
COPY dashboard/ ./

# Build dashboard (creates /dashboard/dist)
RUN npm run build

# Stage 2: Production Server
FROM node:20-alpine

# Install ca-certificates for SSL/TLS
RUN apk add --no-cache ca-certificates

# Set working directory
WORKDIR /app

# Install server dependencies
COPY server/package*.json ./
RUN npm ci --only=production

# Copy server code
COPY server/ ./

# Copy built dashboard from Stage 1
COPY --from=dashboard-builder /dashboard/dist /app/dashboard/dist

# Expose port 8080 (Fly.io handles SSL on 443)
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/healthz', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start Node.js server
CMD ["node", "src/index.js"]
