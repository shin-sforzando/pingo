# Pingo Codebase Structure & Architecture

## Directory Structure

```
pingo/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── api/               # API routes
│   │   ├── game/              # Game-related pages
│   │   └── debug/             # Debug utilities
│   ├── components/            # React components
│   │   ├── ui/               # shadcn/ui base components
│   │   ├── magicui/          # Magic UI animations
│   │   ├── auth/             # Authentication components
│   │   ├── layout/           # Header, Footer, Navigation
│   │   └── game/             # Game-specific components
│   ├── contexts/             # React Context providers
│   ├── lib/                  # Utility libraries & configurations
│   ├── services/             # Business logic & API services
│   ├── types/                # TypeScript type definitions
│   ├── i18n/                 # Internationalization
│   ├── stories/              # Storybook stories
│   └── test/                 # Test utilities & fixtures
├── messages/                 # i18n translation files
├── docs/ (or cline_docs/)    # Project documentation
├── public/                   # Static assets
├── .storybook/              # Storybook configuration
└── scripts/                 # Build & utility scripts
```

## Key Architecture Patterns

### App Router Structure (Next.js 15)
- **Server Components**: Default for static content
- **Client Components**: For interactivity (marked with 'use client')
- **API Routes**: RESTful endpoints in `/app/api/`
- **Middleware**: Authentication & routing logic

### Component Architecture
- **UI Components**: Reusable shadcn/ui + Magic UI
- **Feature Components**: Game, Auth, Layout specific
- **Each component has**: 
  - TypeScript interface
  - Storybook story
  - Unit/integration tests
  - Proper internationalization

### Data Flow
```
Client → API Routes → Services → Firebase/Firestore
       ↖ Real-time ← Firestore Listeners ← Client
```

### Type System (src/types/)
- `common.ts`: Shared enums & utility types
- `schema.ts`: Zod schemas for validation
- `game.ts`, `user.ts`: Domain-specific types
- `firestore.ts`: Database document interfaces
- `index.ts`: Centralized exports

### State Management
- **React Context**: Global state (auth, game)
- **useState/useReducer**: Local component state
- **Firestore Listeners**: Real-time data updates
- **React Hook Form**: Form state management

## Critical Components

### Game Flow Components
- `ImageUpload.tsx`: Photo upload with HEIC support
- `BingoBoard.tsx`: Interactive bingo grid
- `BingoCell.tsx`: Individual cell with open/closed states
- `SubmissionResult.tsx`: AI analysis results display

### Authentication & Layout
- `AuthGuard.tsx`: Route protection wrapper
- `Header.tsx`: Navigation with auth state
- `UserMenu.tsx`: User profile dropdown
- `NotificationIcon.tsx` + `NotificationDrawer.tsx`: Real-time notifications

### Services Layer (src/services/)
- Database access via Firebase Admin SDK
- Image upload to Google Cloud Storage
- AI integration with Google Gemini
- Type-safe data transformation utilities

## Data Models

### Key Collections (Firestore)
- `users/`: User profiles & authentication
- `games/`: Game metadata & settings
- `game_participations/`: User-game relationships
- `games/{id}/playerBoards/`: Individual player progress
- `games/{id}/submissions/`: Photo submissions & AI analysis

### ID Conventions
- **ULID**: All internal IDs (users, submissions, etc.)
- **6-char Game IDs**: User-facing game codes (e.g., "ABCDEF")
- **Timestamps**: Firestore Timestamp with proper conversion utilities

## Critical Files to Understand

### Configuration
- `biome.json`: Linting & formatting rules
- `tsconfig.json`: TypeScript configuration
- `next.config.ts`: Next.js build configuration
- `vitest.config.mts`: Test configuration

### Entry Points
- `src/app/layout.tsx`: Root layout with providers
- `src/app/page.tsx`: Home page
- `src/middleware.ts`: Authentication middleware
- `src/lib/firebase/`: Firebase configuration & utilities

## Development Patterns
- **Mobile-first design**: Tailwind responsive classes
- **Component composition**: Reusable UI building blocks
- **Error boundaries**: Proper error handling
- **Loading states**: Skeleton components & spinners
- **Accessibility**: ARIA labels, keyboard navigation
- **Performance**: Image optimization, code splitting