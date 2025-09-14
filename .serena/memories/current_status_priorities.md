# Pingo Current Status & Priority Tasks

## Current Development Status

### ✅ Completed Features

- **Game Creation**: Full flow with AI-generated subjects via Gemini
- **Image Upload**: HEIC support, resize/compression, GCS integration
- **Game Main Screen**: Bingo board, real-time updates, AI analysis
- **Authentication**: Firebase Auth with user management
- **UI Foundation**: shadcn/ui + Magic UI components with Storybook
- **Internationalization**: Japanese/English support via next-intl
- **Real-time Updates**: Firestore listeners for live game state
- **Bingo Line Detection**: Automatic row/column/diagonal completion detection

### ❌ Critical Missing Features

#### 1. Game Join Functionality (URGENT - Completely Missing)

**Status**: Referenced in UI but pages/APIs don't exist

- `/game/join` page returns 404 error
- No join API endpoints implemented
- QR code scanning not implemented
- Public games list missing
- **Impact**: Users cannot join existing games (core feature broken)

#### 2. Insufficient Test Coverage (HIGH PRIORITY)

**Current**: 28 test files exist, but critical components untested

- `src/components/game/ImageUpload.tsx` (no tests)
- `src/services/image-upload.ts` (no tests)
- `src/app/api/image/upload/route.ts` (no tests)
- `src/app/api/game/[gameId]/submission/analyze/route.ts` (no tests)
- **Impact**: Production reliability at risk

#### 3. Security & Production Hardening (HIGH PRIORITY)

- No rate limiting on API endpoints
- Debug logs present in production code
- API key security review needed
- Input validation improvements needed
- **Impact**: Security vulnerabilities & scalability issues

## Next Sprint Priorities

### Sprint 1: Game Join Implementation

1. Create `/game/join` page with QR scanning
2. Implement join API endpoints
3. Add public games list functionality
4. Test end-to-end join flow

### Sprint 2: Test Coverage & Quality

1. Add comprehensive tests for ImageUpload component
2. Test image upload service & API routes
3. Add integration tests for game join flow
4. Achieve >70% test coverage target

### Sprint 3: Production Readiness

1. Implement API rate limiting
2. Security audit & improvements
3. Remove debug logging
4. Performance optimization
5. Error handling improvements

## Development Context Notes

### Working Environment

- **Target Users**: Mobile-first (smartphone primary)
- **Content Policy**: Family-friendly, all-ages appropriate
- **Languages**: Japanese primary, English secondary
- **AI Integration**: Google Gemini for image analysis & subject generation

### Technical Constraints

- **Mobile Compatibility**: iOS Safari must work perfectly
- **Performance Targets**:
  - Image analysis: <3s (max 5s)
  - Page load: <2s
  - Max 50 players per game
  - Max 1000 concurrent users
- **Data Limits**: Max 30 image submissions per player per game

### Development Workflow Reminders

- Never work directly on `main` branch
- Always run `npm run test:once` before committing
- All components need Storybook stories
- Use ULID for all IDs except 6-character game IDs
- Follow existing patterns in similar components
