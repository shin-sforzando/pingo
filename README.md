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
  - [Development](#development)
  - [Build for Production](#build-for-production)
  - [Linting](#linting)
  - [Local Docker Testing](#local-docker-testing)
- [Deploy](#deploy)
- [Misc](#misc)

## Prerequisites

- Docker (v28.0.4 or higher)
- Node.js (v22 or higher)
- TypeScript (v5 or higher)
- [Next.js](https://nextjs.org) (v15.3.0)
  - [React](https://ja.react.dev) (v19.1.0)
<!-- - [Storybook](https://storybook.js.org) (v8.6.12) -->

### Tool

- [Biome](https://biomejs.dev) (v1.9.4) - Formatter and Linter
- [lefthook](https://github.com/evilmartians/lefthook) (v1.11.11) - Git hooks manager
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

### Development

```shell
# Start the development server with Turbopack and pretty-printed logs
npm run dev

# The application will be available at http://localhost:3000
```

<!-- ### Storybook

Pingo uses [Storybook](https://storybook.js.org) for UI component development and documentation.
Each UI component has a corresponding story that showcases its variants, sizes, and states.

```shell
# Start Storybook development server
npm run storybook

# The Storybook will be available at http://localhost:6006
``` -->

### Build for Production

```shell
# Create an optimized production build
npm run build

# Start the production server
npm run start
```

### Linting

```shell
# Run linter
npm run lint
```

### Local Docker Testing

```shell
# Build the Docker image
docker build -t pingo .

# Run the Docker container
# Replace 3000 with your desired host port if needed
docker run -p 3000:8080 pingo
```

## Deploy

(T. B. D.)

## Misc

This repository is [Commitizen](https://commitizen.github.io/cz-cli/) friendly, following [GitHub flow](https://docs.github.com/en/get-started/quickstart/github-flow).
