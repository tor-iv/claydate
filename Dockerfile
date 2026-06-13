# syntax=docker/dockerfile:1

# ──────────────────────────────────────────
# Stage 1: deps — install all dependencies
# (native build tools required for better-sqlite3)
# ──────────────────────────────────────────
FROM node:22-alpine AS deps
WORKDIR /app

# Native build deps for better-sqlite3
RUN apk add --no-cache python3 make g++

# Enable pnpm via corepack
RUN corepack enable && corepack prepare pnpm@10.17.1 --activate

# Copy manifests only (cache-friendly layer)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Install all deps; pnpm will rebuild native modules (better-sqlite3, sharp)
# for the current platform (linux/musl/arm64 or linux/musl/x64).
# --config.minimum-release-age=0 disables the "too new" safety check that
# fires in CI when packages in the lockfile were published within the last 24h.
RUN pnpm install --frozen-lockfile --config.minimum-release-age=0


# ──────────────────────────────────────────
# Stage 2: build — compile the Next.js app
# ──────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.17.1 --activate

# Bring in node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy full source
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

# SESSION_SECRET is checked at module-init time; supply a dummy 32-char value
# so `next build` can collect page data without throwing. The real secret is
# injected at runtime via the container's SESSION_SECRET env var.
ENV SESSION_SECRET=build-time-placeholder-not-used-in-prod

RUN pnpm build


# ──────────────────────────────────────────
# Stage 3: runner — minimal production image
# ──────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create a non-root user for security
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

# Copy standalone server output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./

# Copy static assets into the standalone tree where Next.js expects them
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# ── Native module fixup ────────────────────────────────────────────────────
# Next.js standalone tracing does NOT reliably follow the .pnpm virtual-store
# for scoped @img/* packages (sharp platform binaries) or re-include the
# better-sqlite3 .node binary built for this platform.
# Explicitly copy the pieces standalone tracing misses.
#
# better-sqlite3: copy the full module (binding.gyp references internals)
COPY --from=builder --chown=nextjs:nodejs \
     /app/node_modules/.pnpm/better-sqlite3@12.10.0/node_modules/better-sqlite3 \
     ./node_modules/better-sqlite3

# sharp: copy the main package and ALL @img/* scoped platform packages
COPY --from=builder --chown=nextjs:nodejs \
     /app/node_modules/.pnpm/sharp@0.35.1/node_modules/sharp \
     ./node_modules/sharp

# Copy every @img scoped package that pnpm installed for this platform
# (linuxmusl-arm64 on arm64 hosts, linuxmusl-x64 on x86_64 hosts — pnpm
#  only installs the ones matching the current OS/arch)
RUN mkdir -p ./node_modules/@img
COPY --from=builder --chown=nextjs:nodejs \
     /app/node_modules/.pnpm \
     /tmp/pnpm-store

# Flatten all @img+* packages from the .pnpm store into node_modules/@img/
RUN for dir in /tmp/pnpm-store/@img+*; do \
      [ -d "$dir" ] || continue; \
      # Extract "sharp-linuxmusl-arm64@0.35.1" → "sharp-linuxmusl-arm64"
      pkgname=$(basename "$dir" | sed 's/@[^@]*$//; s/^@img+//'); \
      src="$dir/node_modules/@img/$pkgname"; \
      [ -d "$src" ] && cp -r "$src" "./node_modules/@img/$pkgname" || true; \
    done \
 && rm -rf /tmp/pnpm-store

# ── Persistent data directory ──────────────────────────────────────────────
# Volume mount point; the app mkdirs DB_PATH and DATA_DIR at runtime,
# but pre-creating /app/data ensures the mount lands with correct ownership.
RUN mkdir -p /app/data && chown nextjs:nodejs /app/data

EXPOSE 3000

USER nextjs

CMD ["node", "server.js"]
