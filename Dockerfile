# Mustang Maxx 006 - Production Dockerfile (Coolify-Ready)
# =========================================================
# Uses output:'standalone' in next.config.js — bundles everything
# into .next/standalone for a minimal Docker image.
# Security note: 1 residual CVE exists in the node:22-alpine binary
# itself (upstream Node.js). No patched base image is available.
# OS packages are updated via 'apk upgrade' as a best-effort mitigation.

# ---- Stage 1: Install dependencies ----
FROM node:22-alpine AS deps
# Upgrade OS packages to patch any available CVEs
RUN apk upgrade --no-cache && apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --ignore-scripts

# ---- Stage 2: Build the app ----
FROM node:22-alpine AS builder
RUN apk upgrade --no-cache
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# Fail fast: verify standalone artifact was produced
RUN test -f .next/standalone/server.js || \
  (echo "ERROR: .next/standalone/server.js not found. Ensure next.config.js has output: 'standalone'" && exit 1)

# ---- Stage 3: Production runner ----
FROM node:22-alpine AS runner
RUN apk upgrade --no-cache
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

# Health check for Coolify monitoring
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD node -e "const h=require('http');h.get('http://localhost:3000',(r)=>{process.exit(r.statusCode===200?0:1)}).on('error',()=>process.exit(1))"

CMD ["node", "server.js"]
