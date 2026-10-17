# ==============================================================================
# Daybreak - Production Multi-Stage Dockerfile
# Optimized for Google Cloud Run, Container Orchestrators, and High Performance
# ==============================================================================

# --- Stage 1: Build & Bundle ---
FROM node:20-alpine AS builder

WORKDIR /app

# Install build tools if native packages require compilation
RUN apk add --no-cache python3 make g++

# Install dependencies using reproducible lockfile
COPY package*.json ./
RUN npm ci

# Copy source code and build production assets
COPY . .
RUN npm run lint
RUN npm run build

# --- Stage 2: Production Runtime ---
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

# Install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy built distribution bundle and server code from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server
COPY --from=builder /app/shared ./shared
COPY --from=builder /app/server.ts ./server.ts
COPY --from=builder /app/tsconfig.json ./tsconfig.json

# Ensure data directory exists and assign non-root ownership
RUN mkdir -p /app/data && chown -R node:node /app

# Run as non-privileged user for container security
USER node

EXPOSE 8080

# Start server using tsx
CMD ["npx", "tsx", "server.ts"]
