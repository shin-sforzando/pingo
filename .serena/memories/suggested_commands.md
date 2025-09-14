# Essential Development Commands for Pingo

## Primary Development Commands

### Development Server

```bash
npm run dev                # Start Next.js dev server with Turbopack
```

### Testing (CRITICAL - Always use test:once in development)

```bash
npm run test:once          # Single test run (preferred for development)
npm run test               # Watch mode (avoid in Claude Code)
npm run test:e2e           # Playwright E2E tests
npm run test:e2e:mobile    # Mobile Safari E2E tests
npm run test:e2e:debug     # Debug E2E tests with headed browser
```

### Code Quality (Run before every commit)

```bash
npm run check              # Biome lint + format with --write --unsafe
npm run check:i18n         # Check i18n translations consistency
```

### Build & Deploy

```bash
npm run build              # Production build
npm run start              # Start production server
npm run docker             # Build and run Docker container
```

### Component Development

```bash
npm run storybook          # Start Storybook on port 6006
npm run build-storybook    # Build Storybook for production
```

### Maintenance Commands

```bash
npm run ncu                # Check for dependency updates
npm run knip               # Find unused dependencies/exports
npm run repomix            # Generate codebase summary
```

## Development Workflow

1. Always run `npm run test:once` after making changes
2. Run `npm run check` to lint and format code
3. Use `npm run storybook` for UI component development
4. Test mobile compatibility with `npm run test:e2e:mobile`

## System Commands (Darwin/macOS)

- `git` - Version control
- `ls`, `cd`, `pwd` - File navigation
- `grep`, `find` - Text/file search
- `brew` - Package manager (if available)
