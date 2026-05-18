# Agent MAXX 006 production Dockerfile
# ====================================
# Multi-platform (linux/amd64 + linux/arm64)
# Next.js standalone output is enabled only for this container build.
# Coolify-ready: healthcheck, non-root user, proper signals
#
# Security note: one residual CVE may remain in the upstream node:22-alpine
# binary. OS packages are updated via 'apk upgrade' as best-effort mitigation.

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

# Provide a non-secret build placeholder. Real deployments must override this
# at runtime with the Coolify/Vercel secret value.
ARG NEXTAUTH_SECRET=agent-maxx-build-placeholder-change-at-runtime
ARG NEXTAUTH_URL=http://localhost:3000
ENV NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
ENV NEXTAUTH_URL=${NEXTAUTH_URL}
ENV NEXT_TELEMETRY_DISABLED=1
ENV MAXX_NEXT_STANDALONE=true

RUN npm run build

RUN test -f .next/standalone/server.js || \
  (echo "ERROR: .next/standalone/server.js not found. Ensure MAXX_NEXT_STANDALONE=true is set for container builds" && exit 1)

# ---- Stage 3: Production runner ----
FROM node:${NODE_VERSION}-alpine AS runner
LABEL org.opencontainers.image.title="Agent MAXX 006" \
      org.opencontainers.image.description="Cinematic Agent MAXX frontend"

RUN apk upgrade --no-cache && apk add --no-cache wget
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/ || exit 1

CMD ["node", "server.js"]
