# Pingo

<!-- Badges -->

[![Last Commit](https://img.shields.io/github/last-commit/shin-sforzando/pingo)](https://github.com/shin-sforzando/pingo/graphs/commit-activity)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)

<!-- Synopsis -->

Pingo: Bingo game where AI judges based on photos

<!-- TOC -->

- [Prerequisites](#prerequisites)
  - [Tool](#tool)
- [How to](#how-to)
  - [Setup](#setup)
    - [Environment Variables](#environment-variables)
      - [.env](#env)
      - [.env.local](#envlocal)
    - [Google Cloud](#google-cloud)
      - [Application Default Credentials (ADC)](#application-default-credentials-adc)
      - [Google Cloud Storage (GCS) CORS Configuration](#google-cloud-storage-gcs-cors-configuration)
    - [Firebase](#firebase)
  - [Development](#development)
    - [Lint \& Format](#lint--format)
    - [i18n](#i18n)
  - [Storybook](#storybook)
  - [Build for Production](#build-for-production)
  - [Local Docker](#local-docker)
- [Test](#test)
- [Deploy](#deploy)
  - [Automated Deployment](#automated-deployment)
  - [Required Secrets in Secret Manager](#required-secrets-in-secret-manager)
  - [Manual Deployment](#manual-deployment)
  - [Deployment Configuration](#deployment-configuration)
- [Misc](#misc)

## Prerequisites

- Docker (v28.0.4 or higher)
- Node.js (v22 or higher)
- TypeScript (v5 or higher)
- [Next.js](https://nextjs.org) (v15.3.3)
  - [React](https://ja.react.dev) (v19.1.0)
  - [next-intl](https://next-intl.dev)
  - [@google/genai](https://googleapis.github.io/js-genai/release_docs/index.html) (v1.5.0)
  - Firebase
- [Storybook](https://storybook.js.org) (v8.6.14)
- [shadcn/ui](https://ui.shadcn.com)

### Tool

- [Biome](https://biomejs.dev) (v1.9.4) - Formatter and Linter
- [lefthook](https://github.com/evilmartians/lefthook) (v1.11.13) - Git hooks manager
- [git-secret](https://sobolevn.me/git-secret/) - A bash-tool to store your private data inside a git repository

## How to

### Setup

```shell
# Clone the repository
git clone https://github.com/shin-sforzando/pingo.git
cd pingo

# Reveal secrets
git secret reveal

# Install dependencies
npm install
```

> [!NOTE]
> If git-secret is not available, decrypt secrets one by one using GPG as in
> `gpg --output something --decrypt something.secret`

#### Environment Variables

##### .env

`.env` contains common environment variables that are safe to disclose.

```.env
NEXT_PUBLIC_FIREBASE_PROJECT_ID=pingo-456817
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCYXPVHEMWgIXpDc2j-qFuvzD79eI24dws
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=pingo-456817.firebaseapp.com
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=pingo-456817.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=617969816285
NEXT_PUBLIC_FIREBASE_APP_ID=1:617969816285:web:09a7ffe5ea531b45648134
```

##### .env.local

`.env.local` contains environment variables for the local development environment that cannot be disclosed.

```.env.local
GOOGLE_CLOUD_PROJECT_ID=XXXXXXXXXXXXXXXX
# Gemini API Key for local development
GEMINI_API_KEY=XXXXXXXXXXXXXXXX
# ADC Service account key for Google Cloud
GOOGLE_APPLICATION_CREDENTIALS=./XXXXXXXXXXXXXXXX.json
# Google Cloud Storage bucket for image uploads
GOOGLE_CLOUD_STORAGE_BUCKET=XXXXXXXXXXXXXXXX
```

#### Google Cloud

##### Application Default Credentials (ADC)

For most server-side operations interacting with Google Cloud (like Firestore access from API routes, or operations on Cloud Run), ADC is used. Set it up for local development:

```bash
# Create gcloud named configuration
gcloud config configurations create pingo-456817

# Initialize and Authorize
gcloud init

# Authenticate with Google Cloud
gcloud auth application-default login --disable-quota-project
```

> [!IMPORTANT]
> For generating **v4 Signed URLs** locally (used for direct GCS uploads), ADC with user credentials is **not sufficient**.
> You need to use a **Service Account Key**.

##### Google Cloud Storage (GCS) CORS Configuration

To allow the browser (running on `localhost:3000` or the deployed app URL) to directly upload files to the GCS bucket (`gcs-pingo`), you need to configure CORS (Cross-Origin Resource Sharing) on the bucket.

```shell
gsutil cors set gcs-pingo-cors-config.json gs://gcs-pingo
```

#### Firebase

Pingo uses Firebase for authentication and Firestore as the database.

**Local Development**:

Firebase Admin SDK is automatically initialized using the service account key specified in `GOOGLE_APPLICATION_CREDENTIALS` (`.env.local`).

**Production (Cloud Run)**:

Firebase credentials are retrieved from Google Cloud Secret Manager:

- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`

These secrets are automatically mounted as environment variables by Cloud Build (see `cloudbuild.yaml`).

### Development

```shell
# Start the development server with Turbopack and pretty-printed logs
npm run dev

# The application will be available at http://localhost:3000
```

#### Lint & Format

```shell
# Run Biome
npm run check
```

#### i18n

Pingo uses [next-intl](https://next-intl-docs.vercel.app/) for internationalization with support for Japanese (primary) and English.

**Translation Files**:

- `messages/ja.json` - Japanese translations
- `messages/en.json` - English translations

**Check for Missing or Unused Translations**:

```shell
# Verify translation completeness
npm run check:i18n
```

**Adding New Translations**:

1. Add new keys to both `messages/ja.json` and `messages/en.json`
2. Use the `useTranslations()` hook in components:

   ```tsx
   const t = useTranslations();
   <p>{t("YourSection.yourKey")}</p>
   ```

3. Run `npm run check:i18n` to verify

### Storybook

Pingo uses [Storybook](https://storybook.js.org) for UI component development and documentation.
Each UI component has a corresponding story that showcases its variants, sizes, and states.

```shell
# Start Storybook development server
npm run storybook

# The Storybook will be available at http://localhost:6006
```

### Build for Production

```shell
# Create an optimized production build
npm run build

# Start the production server
npm run start
```

### Local Docker

```shell
# Build image and run container
npm run docker
# The container will be exposed at http://localhost:3000
```

## Test

```shell
# Run Vitest watch mode
npm test

# Run Vitest only once
npm test:once
```

## Deploy

Pingo is deployed to **Google Cloud Run** (asia-northeast1 region) using **Google Cloud Build**.

### Automated Deployment

Deployment is triggered automatically via Cloud Build when changes are pushed to the repository.

**Build Configuration**: `cloudbuild.yaml`

**Deployment Steps**:

1. Build Docker image with secrets from Secret Manager
2. Push image to Artifact Registry
3. Deploy to Cloud Run service `pingo`

### Required Secrets in Secret Manager

The following secrets must be configured in Google Cloud Secret Manager:

- `FIREBASE_PROJECT_ID` - Firebase project ID
- `FIREBASE_CLIENT_EMAIL` - Service account email
- `FIREBASE_PRIVATE_KEY` - Service account private key
- `GEMINI_API_KEY` - Google Gemini API key

### Manual Deployment

To trigger a manual deployment:

```shell
# Trigger Cloud Build manually
gcloud builds submit --config=cloudbuild.yaml

# Or deploy using the Cloud Console
# https://console.cloud.google.com/cloud-build/triggers
```

### Deployment Configuration

- **Service Name**: `pingo`
- **Region**: `asia-northeast1`
- **Platform**: Cloud Run (managed)
- **Image Registry**: Artifact Registry (`asia-northeast1-docker.pkg.dev`)

For detailed configuration, see `cloudbuild.yaml` and `Dockerfile`.

## Misc

This repository is [Commitizen](https://commitizen.github.io/cz-cli/) friendly, following [GitHub flow](https://docs.github.com/en/get-started/quickstart/github-flow).
