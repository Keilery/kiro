# ─── Build stage ──────────────────────────────────────────
FROM node:22-alpine AS build
WORKDIR /app

# Install deps separately for better layer caching
COPY package.json package-lock.json* ./
RUN npm ci

# Copy source and build
COPY tsconfig.json ./
COPY prisma ./prisma
COPY src ./src
RUN npx prisma generate && npm run build

# ─── Production stage ─────────────────────────────────────
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Only production deps
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy built artifacts and Prisma client
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/node_modules/@prisma ./node_modules/@prisma

# Drop privileges
RUN addgroup -S nexus && adduser -S nexus -G nexus
USER nexus

EXPOSE 4000
CMD ["node", "dist/server.js"]
