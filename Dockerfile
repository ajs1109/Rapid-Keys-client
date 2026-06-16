# Stage 1: Install dependencies
FROM node:22.12.0-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Stage 2: Build the application
FROM node:22.12.0-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Dummy build-time environment variables to satisfy Next.js build checks
ENV JWT_SECRET=dummy_secret_for_build
ENV TOKEN_SECRET=dummy_token_secret_for_build
ENV REFRESH_SECRET=dummy_refresh_secret_for_build
ENV DATABASE_URL=postgresql://localhost/dummy_db

RUN npm run build

# Stage 3: Production runner
FROM node:22.12.0-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/server.ts ./server.ts
COPY --from=builder /app/src ./src

# Install only production dependencies
RUN npm ci --omit=dev

EXPOSE 8080

CMD ["npm", "run", "start:prod"]
