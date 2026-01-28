# Development stage
FROM node:24.13.0-alpine AS development

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies)
RUN npm ci

# Copy source code
COPY . .
# copy env files if any
COPY .env.* ./
# Generate Prisma client
RUN npm run prisma:generate

# Expose port
EXPOSE 3000

# Start in development mode with hot reloading
# Use a custom script that handles the dist directory properly
CMD ["sh", "-c", "npm run start:dev"]

# Production build stage
FROM node:24.13.0-alpine AS build

ENV HUSKY=0

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies
RUN npm ci --omit=dev

# Copy source code
COPY . .
COPY .env.* ./

# Generate Prisma client
RUN npm run prisma:generate

# Build the application
RUN npm run build

# Production stage
FROM node:24.13.0-alpine AS production

WORKDIR /app

# Use production environment
ENV NODE_ENV=production

# Copy package files
COPY package*.json ./

# Copy production node_modules built earlier
COPY --from=build /app/node_modules ./node_modules

# Copy built application from build stage
COPY --from=build /app/dist ./dist

# Copy prisma directory for migrations
COPY prisma ./prisma

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001

# Change ownership of the app directory
RUN chown -R nestjs:nodejs /app
USER nestjs

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "run", "start:prod"]
