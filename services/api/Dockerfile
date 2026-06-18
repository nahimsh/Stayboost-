# StayBoost Core API (NestJS). Build context MUST be the repo root:
#   docker build -f services/api/Dockerfile -t stayboost-api .
FROM node:22-slim AS builder
RUN corepack enable && apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @stayboost/db generate
RUN pnpm --filter @stayboost/api build

FROM node:22-slim AS runner
RUN corepack enable && apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app /app
EXPOSE 4000
# Apply migrations on release, then start. (Railway: prefer a release command.)
CMD ["sh", "-c", "pnpm --filter @stayboost/db migrate:deploy && node services/api/dist/main.js"]
