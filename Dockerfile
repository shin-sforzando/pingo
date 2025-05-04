# Use an official Node.js runtime as a parent image (Node LTS recommended)
FROM node:22-slim AS base

# Set the working directory in the container
WORKDIR /app

# Install necessary dependencies for Next.js standalone output
# (This step might be adjusted based on actual standalone output needs)
# RUN apt-get update && apt-get install -y --no-install-recommends openssl

# Copy package.json and package-lock.json (or yarn.lock or pnpm-lock.yaml)
COPY package*.json ./

# Install dependencies
# Use --frozen-lockfile to ensure reproducibility
RUN npm ci

# Copy the rest of the application code
# Use .dockerignore to exclude unnecessary files
COPY . .

# Build the Next.js application
# This will generate the .next directory with the production build
RUN npm run build


# --- Production Stage ---
FROM node:22-slim AS production

WORKDIR /app

# Set environment variables
ENV NODE_ENV=production
# Next.js server runs on port 3000 by default, Cloud Run expects PORT env var
ENV PORT=8080

COPY --from=base /app/next.config.ts ./
COPY --from=base /app/messages ./messages
COPY --from=base /app/public ./public
COPY --from=base /app/.next/standalone ./
COPY --from=base /app/.next/static ./.next/static

# Expose the port the app runs on (defined by PORT env var)
EXPOSE 8080

# Command to run the application
# Uses the Node.js server included in the standalone output
CMD ["node", "server.js"]
