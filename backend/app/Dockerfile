# Backend Dockerfile - Production Ready
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production && npm cache clean --force

# Development dependencies for build (if needed)
FROM base AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# Production image
FROM base AS runner
WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV PORT=5000

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 expressjs

# Copy dependencies and application
COPY --from=deps --chown=expressjs:nodejs /app/node_modules ./node_modules
COPY --chown=expressjs:nodejs . .

# Switch to non-root user
USER expressjs

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["node", "server.js"]
