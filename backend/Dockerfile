# Stage 1: Build stage
FROM node:20-slim AS builder

WORKDIR /app

# Install OpenSSL and certificates required by Prisma engine
RUN apt-get update -y && apt-get install -y openssl ca-certificates

# Copy dependency definitions
COPY package*.json ./

# Install all dependencies
RUN npm install

# Copy source code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build TypeScript to Javascript
RUN npm run build

# Stage 2: Production runner stage
FROM node:20-slim

WORKDIR /app

# Install OpenSSL and certificates for runtime
RUN apt-get update -y && apt-get install -y openssl ca-certificates

# Copy dependency definitions
COPY package*.json ./

# Install only production dependencies
RUN npm install --only=production

# Copy compiled files, tsconfig, and prisma schema
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

EXPOSE 4000

# Set environment to production
ENV NODE_ENV=production

# Run database sync and start the server
CMD ["sh", "-c", "npx prisma db push && node dist/app.js"]
