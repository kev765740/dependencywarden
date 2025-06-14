# Multi-stage build for production deployment
FROM node:20-alpine AS base

# Security updates and dependencies
RUN apk update && apk upgrade && \
    apk add --no-cache git curl && \
    rm -rf /var/cache/apk/*

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
RUN npm ci --only=production --audit --fund=false && \
    npm cache clean --force

# Build the application
FROM base AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --audit --fund=false

# Copy source code and build
COPY . .
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Create non-root user for security
RUN addgroup --system --gid 1001 appgroup && \
    adduser --system --uid 1001 --ingroup appgroup appuser

# Create necessary directories with proper permissions
RUN mkdir -p /app/temp-repos /app/logs && \
    chown -R appuser:appgroup /app

# Copy built application with proper ownership
COPY --from=deps --chown=appuser:appgroup /app/node_modules ./node_modules
COPY --from=builder --chown=appuser:appgroup /app/dist ./dist
COPY --from=builder --chown=appuser:appgroup /app/package.json ./package.json
COPY --from=builder --chown=appuser:appgroup /app/production-health-check.js ./production-health-check.js

# Switch to non-root user
USER appuser

EXPOSE 5000

# Enhanced health check with proper endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1

# Use node directly for better signal handling
CMD ["node", "dist/server/index.js"]