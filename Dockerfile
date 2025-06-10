# ---------------- Build Stage ----------------
FROM node:lts-slim AS base

# Define build arguments
ARG FIREBASE_PROJECT_ID
ARG FIREBASE_CLIENT_EMAIL
ARG FIREBASE_PRIVATE_KEY
ARG GEMINI_API_KEY
ARG GOOGLE_CLOUD_STORAGE_BUCKET="pingo-456817-images"

# Set non-public environment variables
ENV FIREBASE_PROJECT_ID=${FIREBASE_PROJECT_ID}
ENV FIREBASE_CLIENT_EMAIL=${FIREBASE_CLIENT_EMAIL}
ENV FIREBASE_PRIVATE_KEY=${FIREBASE_PRIVATE_KEY}
ENV GEMINI_API_KEY=${GEMINI_API_KEY}

# Set publishable environment variables
ENV GOOGLE_CLOUD_STORAGE_BUCKET=${GOOGLE_CLOUD_STORAGE_BUCKET}
ENV NEXT_PUBLIC_BASE_URL="http://localhost:8080"
ENV NEXT_PUBLIC_FIREBASE_PROJECT_ID="pingo-456817"
ENV NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSyCYXPVHEMWgIXpDc2j-qFuvzD79eI24dws"
ENV NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="pingo-456817.firebaseapp.com"
ENV NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="pingo-456817.firebasestorage.app"
ENV NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="617969816285"
ENV NEXT_PUBLIC_FIREBASE_APP_ID="1:617969816285:web:09a7ffe5ea531b45648134"


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


# ---------------- Production Stage ----------------
FROM node:lts-slim AS production

# Define build arguments for Firebase credentials in production stage
ARG FIREBASE_PROJECT_ID
ARG FIREBASE_CLIENT_EMAIL
ARG FIREBASE_PRIVATE_KEY

ENV NODE_ENV=production

# Next.js server runs on port 3000 by default, Cloud Run expects PORT env var
ENV PORT=8080

# Set non-public credentials for production stage
ENV FIREBASE_PROJECT_ID=${FIREBASE_PROJECT_ID}
ENV FIREBASE_CLIENT_EMAIL=${FIREBASE_CLIENT_EMAIL}
ENV FIREBASE_PRIVATE_KEY=${FIREBASE_PRIVATE_KEY}
ENV GEMINI_API_KEY=${GEMINI_API_KEY}

# Set publishable environment variables for production stage
ENV GOOGLE_CLOUD_STORAGE_BUCKET=${GOOGLE_CLOUD_STORAGE_BUCKET}
ENV NEXT_PUBLIC_BASE_URL=http://localhost:8080
ENV NEXT_PUBLIC_FIREBASE_PROJECT_ID="pingo-456817"
ENV NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSyCYXPVHEMWgIXpDc2j-qFuvzD79eI24dws"
ENV NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="pingo-456817.firebaseapp.com"
ENV NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="pingo-456817.firebasestorage.app"
ENV NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="617969816285"
ENV NEXT_PUBLIC_FIREBASE_APP_ID="1:617969816285:web:09a7ffe5ea531b45648134"

# Set the working directory in the container
WORKDIR /app

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
