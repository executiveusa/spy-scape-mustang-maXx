# Mustang Maxx 006 — Production Dockerfile
# ==========================================
# Multi-platform (linux/amd64 + linux/arm64)
# Next.js output:'standalone' for minimal image size
# Coolify-ready: healthcheck, non-root user, proper signals
#
# Security note: 1 residual CVE exists in the node:22-alpine binary
# itself (upstream Node.js). No patched base image is available.
# OS packages are updated via 'apk upgrade' as best-effort mitigation.

# ---- Stage 1: Install dependencies ----
ARG NODE_VERSION=22
FROM --platform=$BUILDPLATFORM node:${NODE_VERSION}-alpine AS deps
RUN apk upgrade --no-cache && apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --ignore-scripts

# ---- Stage 2: Build the app ----
FROM --platform=$BUILDPLATFORM node:${NODE_VERSION}-alpine AS builder
RUN apk upgrade --no-cache
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# Fail fast: verify standalone artifact was produced
RUN test -f .next/standalone/server.js || \
  (echo "ERROR: .next/standalone/server.js not found. Ensure next.config.js has output:'standalone'" && exit 1)

# ---- Stage 3: Production runner ----
FROM node:${NODE_VERSION}-alpine AS runner
LABEL org.opencontainers.image.title="Mustang Maxx 006" \
      org.opencontainers.image.description="SpyScape-inspired scroll experience" \
      org.opencontainers.image.source="https://github.com/executiveusa/spy-scape-mustang-maXx"

RUN apk upgrade --no-cache && apk add --no-cache wget
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy public assets
COPY --from=builder /app/public ./public

# Copy standalone output (Next.js bundles everything here)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

# Use wget (always available in Alpine) rather than inline Node.js
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/ || exit 1

CMD ["node", "server.js"]
