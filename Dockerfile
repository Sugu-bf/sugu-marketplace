# ============================================================
# Stage 1: Dependencies
# ============================================================
FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit

# ============================================================
# Stage 2: Build
# ============================================================
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build arguments: every value the bundle inlines (NEXT_PUBLIC_*) or that is
# fixed at build time. next.config validates them (src/lib/env/build-env.ts):
# the build fails on a missing or malformed one. Set them per environment in
# Coolify as build variables; there are no production defaults here.
ARG NEXT_PUBLIC_API_BASE_URL
# The site's own public origin (canonical URLs, sitemap, Origin checks).
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_GOOGLE_CLIENT_ID_WEB
# Optional: without them, no Meta Pixel / no WhatsApp channel link.
ARG NEXT_PUBLIC_META_PIXEL_ID
ARG NEXT_PUBLIC_WHATSAPP_CHANNEL_URL
# Realtime (Reverb). The key is the backend's public REVERB_APP_KEY, never its
# secret. The host is per environment (production: ws.mysugu.com, staging:
# ws-zk47m.mysugu.com), never the API host.
ARG NEXT_PUBLIC_REVERB_APP_KEY
ARG NEXT_PUBLIC_REVERB_HOST
ARG NEXT_PUBLIC_REVERB_PORT=443
ARG NEXT_PUBLIC_REVERB_SCHEME=https
# Pre-launch wall, fixed at build time (src/lib/coming-soon.ts): switching it
# means a rebuild, then a CDN purge.
ARG COMING_SOON_ENABLED=false
# Content-Security-Policy: Report-Only until set to true (security-headers.ts).
ARG CSP_ENFORCE=false
# Payment providers the browser may be sent to (comma-separated hostnames,
# exact match). Any other payment URL from the API is refused.
ARG NEXT_PUBLIC_PAYMENT_REDIRECT_HOSTS=app.ligdicash.com,api.sugupay.net

ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_GOOGLE_CLIENT_ID_WEB=$NEXT_PUBLIC_GOOGLE_CLIENT_ID_WEB
ENV NEXT_PUBLIC_META_PIXEL_ID=$NEXT_PUBLIC_META_PIXEL_ID
ENV NEXT_PUBLIC_WHATSAPP_CHANNEL_URL=$NEXT_PUBLIC_WHATSAPP_CHANNEL_URL
ENV NEXT_PUBLIC_REVERB_APP_KEY=$NEXT_PUBLIC_REVERB_APP_KEY
ENV NEXT_PUBLIC_REVERB_HOST=$NEXT_PUBLIC_REVERB_HOST
ENV NEXT_PUBLIC_REVERB_PORT=$NEXT_PUBLIC_REVERB_PORT
ENV NEXT_PUBLIC_REVERB_SCHEME=$NEXT_PUBLIC_REVERB_SCHEME
ENV COMING_SOON_ENABLED=$COMING_SOON_ENABLED
ENV CSP_ENFORCE=$CSP_ENFORCE
ENV NEXT_PUBLIC_PAYMENT_REDIRECT_HOSTS=$NEXT_PUBLIC_PAYMENT_REDIRECT_HOSTS
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# ============================================================
# Stage 3: Production Runner
# ============================================================
# Runtime secrets are never build arguments: SUGU_EDGE_SECRET (and
# TRUSTED_PROXIES_EXTRA) are set as runtime variables (see .env.example).
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Liveness only (/api/health calls nothing else): a backend outage must not
# get this container restarted.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/api/health').then(r=>process.exit(r.ok?0:1),()=>process.exit(1))"

CMD ["node", "server.js"]
