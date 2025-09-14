# Pingo Project Overview

## Purpose
Pingo is an AI-powered photo bingo game where players take photos and AI judges whether they match the bingo subjects. Players create or join games, upload photos, and AI (Google Gemini) analyzes them to determine if they match the bingo board subjects.

## Tech Stack

### Frontend
- **Framework**: Next.js 15 (App Router) + React 19 + TypeScript 5
- **UI Library**: shadcn/ui + Radix UI components + Magic UI animations
- **Styling**: Tailwind CSS 4
- **Internationalization**: next-intl (Japanese/English)
- **State Management**: React Context API
- **Forms**: React Hook Form + Zod validation
- **AI Integration**: @google/genai (Google Gemini API)

### Backend & Services
- **Runtime**: Node.js 22
- **Database**: Firebase Firestore (real-time listeners)
- **Storage**: Google Cloud Storage (signed URLs for direct upload)
- **Authentication**: Firebase Authentication
- **AI/ML**: Google Gemini API for image analysis and subject generation
- **Deployment**: Docker → Google Cloud Run

### Development Tools
- **Code Quality**: Biome.js (linter + formatter)
- **Testing**: Vitest + @vitest/browser + Testing Library + Playwright
- **Component Development**: Storybook 8
- **Git Hooks**: Lefthook
- **CI/CD**: Google Cloud Build (deploy), GitHub Actions (test/lint)

## Architecture
- App Router with server-side AI processing
- Real-time updates via Firestore listeners
- Direct GCS uploads with signed URLs for images
- ULID for all IDs except 6-character game IDs
- Mobile-first responsive design
- Family-friendly content (all ages appropriate)

## Key Features
- Game creation with AI-generated subjects
- Photo upload and AI analysis
- Real-time bingo progress tracking
- QR code game sharing
- Multi-language support (Japanese primary, English secondary)