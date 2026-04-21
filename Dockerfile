# Use official Node.js LTS image
FROM node:18-alpine

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    bash \
    postgresql-client

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci

# Copy prisma schema
COPY prisma ./prisma/

# Copy source code
COPY . .

# Generate Prisma client and build
RUN npx prisma generate && npm run build

# Remove dev dependencies after build
RUN npm prune --production

# Create directories for uploads and backups
RUN mkdir -p /app/data/uploads /app/backups

# Copy entrypoint script
COPY scripts/entrypoint.sh /app/scripts/entrypoint.sh
RUN chmod +x /app/scripts/entrypoint.sh

ENV NODE_ENV="production"

# Expose port
EXPOSE 3000

CMD ["/app/scripts/entrypoint.sh"]
