# syntax=docker/dockerfile:1.6

FROM oven/bun:1.2 AS base
WORKDIR /app

FROM base AS deps
COPY apps/webapp/package.json apps/webapp/bun.lock ./
RUN bun install --frozen-lockfile

FROM deps AS builder
COPY apps/webapp ./
RUN bun run build

FROM oven/bun:1.2-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/bun.lock ./bun.lock
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./next.config.ts

EXPOSE 3000
CMD ["bun", "run", "start"]
