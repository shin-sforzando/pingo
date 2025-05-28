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
- [Misc](#misc)

## Prerequisites

- Docker (v28.0.4 or higher)
- Node.js (v22 or higher)
- TypeScript (v5 or higher)
- [Next.js](https://nextjs.org) (v15.3.0)
  - [React](https://ja.react.dev) (v19.1.0)
  - [next-intl](https://next-intl.dev)
  - [@google/genai](https://googleapis.github.io/js-genai/release_docs/index.html) (v1.0.1)
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
npm install --legacy-peer-deps
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

```shell
gcloud auth application-default login
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

T. B. D.

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

(T. B. D.)

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

(T. B. D.)

## Misc

This repository is [Commitizen](https://commitizen.github.io/cz-cli/) friendly, following [GitHub flow](https://docs.github.com/en/get-started/quickstart/github-flow).
