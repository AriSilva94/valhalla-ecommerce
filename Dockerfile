# syntax=docker/dockerfile:1

# ---------- Dependencies ----------
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---------- Build ----------
FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# next.config.ts reads this to build images.remotePatterns, and Next bakes the
# resolved config into .next/required-server-files.json at build time. Setting
# it only at runtime has no effect — next/image would reject every remote host
# with a 400. It must arrive as a build arg.
ARG NEXT_PUBLIC_MEDIA_HOST
ENV NEXT_PUBLIC_MEDIA_HOST=$NEXT_PUBLIC_MEDIA_HOST

ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ---------- Runtime ----------
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup -g 1001 -S nodejs \
    && adduser -S nextjs -u 1001

# Standalone output: server + minimal node_modules, static assets, public
COPY --from=build /app/public ./public
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

CMD ["node", "server.js"]
