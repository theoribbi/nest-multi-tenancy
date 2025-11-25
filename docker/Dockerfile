# Development Dockerfile with hot reload
FROM node:20-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install all dependencies (including dev dependencies for hot reload)
RUN pnpm install --frozen-lockfile

# Copy configuration files needed for NestJS
COPY tsconfig.json tsconfig.build.json nest-cli.json ./

# Expose port
EXPOSE 3000

# Set NODE_ENV to development
ENV NODE_ENV=development

# Start the application in watch mode for hot reload
CMD ["pnpm", "start:dev"]

