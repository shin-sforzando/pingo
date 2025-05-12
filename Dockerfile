FROM node:lts-slim

# Define build arguments for Firebase credentials
ARG FIREBASE_PROJECT_ID
ARG FIREBASE_CLIENT_EMAIL
ARG FIREBASE_PRIVATE_KEY

# Set environment variables for Firebase credentials
ENV FIREBASE_PROJECT_ID=$FIREBASE_PROJECT_ID
ENV FIREBASE_CLIENT_EMAIL=$FIREBASE_CLIENT_EMAIL
ENV FIREBASE_PRIVATE_KEY="$FIREBASE_PRIVATE_KEY"

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

# Set environment variables
ENV NODE_ENV=production

# Next.js server runs on port 3000 by default, Cloud Run expects PORT env var
ENV PORT=8080

# Expose the port the app runs on (defined by PORT env var)
EXPOSE 8080

# Command to run the application
# Uses the Node.js server included in the standalone output
CMD ["node", "server.js"]
