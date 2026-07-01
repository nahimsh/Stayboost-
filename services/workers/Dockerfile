FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate
WORKDIR /app

# Install dependencies using the workspace lockfile
FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/config/package.json ./packages/config/package.json
COPY packages/db/package.json ./packages/db/
COPY packages/domain/package.json ./packages/domain/
COPY services/workers/package.json ./services/workers/
RUN pnpm install --frozen-lockfile --filter @stayboost/workers...

# Build
FROM deps AS builder
COPY packages/ ./packages/
COPY services/workers/ ./services/workers/
RUN pnpm --filter @stayboost/db generate
RUN pnpm --filter @stayboost/workers build

# Runtime
FROM base AS runner
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/services/workers/dist ./services/workers/dist
COPY --from=builder /app/services/workers/package.json ./services/workers/package.json
WORKDIR /app/services/workers
CMD ["node", "dist/index.js"]
