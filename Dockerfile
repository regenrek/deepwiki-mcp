# Use pnpm official image for better caching and consistency
FROM node:22.12-alpine AS builder

# Install pnpm
RUN npm install -g pnpm@9.14.4

WORKDIR /app

# Copy package manifests and install dependencies (including dev for build)
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,target=/root/.local/share/pnpm/store pnpm install --frozen-lockfile

# Copy the rest of the application code
COPY . .

# Build the application (creates the dist folder)
RUN pnpm build

# Remove dev dependencies after build
RUN pnpm prune --prod

# --- Release Stage ---
FROM node:22-alpine AS release

WORKDIR /app

ENV NODE_ENV=production

# Copy necessary artifacts from the builder stage
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/bin ./bin
COPY --from=builder /app/package.json ./package.json

# Set the entrypoint to your CLI script
ENTRYPOINT ["node", "bin/cli.mjs"]
