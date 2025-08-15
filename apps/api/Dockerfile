FROM node:24-alpine AS alpine
RUN apk update
RUN apk add --no-cache libc6-compat

FROM alpine AS base

RUN npm install pnpm turbo --global && \
    pnpm config set store-dir ~/.pnpm-store

FROM base AS pruner

WORKDIR /app
COPY . .
RUN turbo prune --scope=@repo/api --docker

FROM base AS builder

WORKDIR /app
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=pruner /app/out/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=pruner /app/out/json/ .

RUN --mount=type=cache,id=pnpm,target=~/.pnpm-store pnpm install --frozen-lockfile
COPY --from=pruner /app/out/full/ .

# Copy the startup script to the builder stage
COPY apps/api/start.sh /app/apps/api/start.sh

# Generate Prisma client in the builder stage
WORKDIR /app/apps/api
RUN pnpx prisma generate
WORKDIR /app

RUN turbo build --filter=@repo/api
RUN --mount=type=cache,id=pnpm,target=~/.pnpm-store pnpm prune --prod --no-optional
RUN rm -rf ./**/*/src

FROM alpine AS runner

ARG API_PORT=3001

RUN npm install pnpm --global

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs
USER nodejs

WORKDIR /app
COPY --from=builder --chown=nodejs:nodejs /app .
WORKDIR /app/apps/api

# Set execute permission on the startup script
USER root
RUN chmod +x start.sh
USER nodejs

ENV NODE_ENV=production
EXPOSE ${API_PORT}

CMD ["./start.sh"]