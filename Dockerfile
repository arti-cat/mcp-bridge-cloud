# Dockerfile for MCP Bridge Cloud Server

FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install dependencies first (for caching)
COPY server/package*.json ./
RUN npm ci --only=production

# Copy application code
COPY server/ ./

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/healthz', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start server
CMD ["node", "src/index.js"]
