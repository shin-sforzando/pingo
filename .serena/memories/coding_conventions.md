# Pingo Coding Conventions & Style Guide

## Core Development Rules
1. **Ask questions first** - If instructions are unclear, confirm before implementation
2. **All comments in English** - Explain "why", not "what"
3. **Type safety is critical** - Use TypeScript rigorously, no `any` types
4. **Test everything** - Don't proceed until tests pass
5. **Use standard libraries** when possible
6. **Never ignore linter warnings**
7. **All components need Storybook stories**

## Code Style (Biome Configuration)

### Formatting
- **Indentation**: Spaces (configured via .editorconfig)
- **Quotes**: Double quotes for JavaScript/TypeScript
- **Import organization**: Automatic with Biome
- **Line endings**: Auto-detected via .editorconfig

### Linting Rules (Strict)
- `noExplicitAny`: ERROR - No any types allowed
- `noNonNullAssertion`: ERROR - Avoid ! operator
- `noUnusedImports`: ERROR - Clean up unused imports
- `noUnusedVariables`: ERROR - Remove unused variables
- `noBannedTypes`: ERROR - Avoid problematic types

## TypeScript Conventions

### Configuration
- **Target**: ES2017
- **Strict mode**: Enabled
- **Path mapping**: `@/*` → `./src/*`
- **JSX**: preserve (Next.js handles compilation)

### Type Definitions
- Use Zod schemas for validation + TypeScript types
- ULID for all IDs except 6-character game IDs
- Firestore document interfaces separate from business logic types
- Proper timestamp handling with TimestampInterface

## Component Conventions

### File Structure
```
src/components/
├── ui/           # shadcn/ui components
├── magicui/      # Magic UI animations
├── auth/         # Authentication components
├── layout/       # Header, Footer, Navigation
└── game/         # Game-specific components
```

### Naming Patterns
- **Components**: PascalCase (e.g., `ImageUpload.tsx`)
- **Functions**: camelCase with descriptive prefixes
  - Event handlers: `handle` prefix (e.g., `handleClick`)
  - Utility functions: descriptive names
- **Interfaces**: PascalCase with descriptive suffixes
- **Constants**: UPPER_SNAKE_CASE

### Component Structure
```typescript
// 1. Imports (external, internal, types)
import { useState } from "react"
import { useTranslations } from "next-intl"
import type { ComponentProps } from "@/types"

// 2. Interface definitions
interface ComponentNameProps {
  prop: string
}

// 3. Component definition
export function ComponentName({ prop }: ComponentNameProps) {
  // Hooks first
  const t = useTranslations()
  const [state, setState] = useState<Type>(initialValue)

  // Event handlers
  const handleEvent = () => {
    // Implementation
  }

  // Render
  return (
    <div>
      {/* JSX */}
    </div>
  )
}
```

## Internationalization (next-intl)
- Use `useTranslations()` hook for component translations
- Translation keys in `messages/ja.json` and `messages/en.json`
- Japanese as primary language, English as secondary
- Consistent translation key naming

## Testing Conventions
- **Test files**: `*.test.tsx` or `*.browser.test.tsx`
- **Storybook files**: `*.stories.tsx`
- Use `@faker-js/faker` for test data
- ULID generation: `faker.string.ulid()`
- Clean up test data after each test

## Git & Branch Conventions
- Never work directly on `main` branch
- Branch naming: `{0-padded-3-digit-issue-number}_feature_name`
- Example: `019_prepare_github_actions` for Issue #19