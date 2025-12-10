# Development stage
FROM node:20-bookworm-slim AS development
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy source code
COPY . .

# Create uploads directory
RUN mkdir -p uploads && chown -R node:node uploads

# Switch to non-root user
USER node

EXPOSE 3000

# Start in development mode
CMD ["npm", "run", "dev"]

# Production stage (keep your existing production stage)
FROM node:20-bookworm-slim AS production
WORKDIR /app

# Set NODE_ENV for runtime optimizations
ENV NODE_ENV=production

# Copy package files and install production dependencies only
COPY package.json package-lock.json ./
RUN npm ci --production --no-audit --no-fund

# Copy built application
COPY --from=development /app/dist ./dist
COPY --from=development /app/uploads ./uploads

# Create and switch to non-root user
RUN mkdir -p uploads && chown -R node:node /app
USER node

EXPOSE 3000

# Start the application
CMD ["node", "dist/index.js"]