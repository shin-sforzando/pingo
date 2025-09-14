# Task Completion Checklist for Pingo

## Before Starting Any Task
1. **Ask clarifying questions** if instructions are unclear
2. **Read latest documentation** for external service integrations
3. **Check existing implementation patterns** before adding new features
4. **Create Git branch** (never work on main directly)
   - Format: `{0-padded-3-digit-issue}_feature_name`
   - Example: `019_prepare_github_actions` for Issue #19

## During Development
1. **Follow type safety** - No `any` types, proper TypeScript usage
2. **Write tests first or alongside implementation**
3. **Create Storybook stories** for all new components
4. **Use existing UI patterns** - shadcn/ui + Magic UI components
5. **Follow naming conventions** - PascalCase components, camelCase functions
6. **Add proper internationalization** - Use `useTranslations()` hook

## When Task is Complete

### MANDATORY Steps (Must Run)
```bash
# 1. Run tests (CRITICAL - use test:once, not test)
npm run test:once

# 2. Run linter and formatter
npm run check

# 3. Check i18n if translations were modified
npm run check:i18n
```

### Verification Steps
1. **Test passes** - All tests must pass before proceeding
2. **No linter warnings** - Biome check must be clean
3. **Storybook works** - New components have working stories
4. **Mobile compatibility** - Test on mobile if UI changes made
5. **Type safety** - No TypeScript errors
6. **i18n consistency** - Both Japanese and English translations work

### Before Committing
1. **Review changes** - Ensure no debug logs or temporary code
2. **Test key user flows** - Manually verify critical functionality
3. **Check for security issues** - No exposed API keys or secrets
4. **Verify mobile responsiveness** if UI changes were made

### Documentation Updates (If Applicable)
1. **Update CLAUDE.md** if new patterns or commands added
2. **Update component documentation** in Storybook
3. **Add inline comments** for complex business logic (in English)

## Production Readiness Checks
- **No console.log statements** in production code
- **Environment variables** properly configured
- **Error handling** implemented for all API calls
- **Loading states** and user feedback implemented
- **Rate limiting** considerations for API endpoints

## Common Gotchas to Avoid
- Don't use `npm test` (watch mode) - use `npm run test:once`
- Don't ignore Biome warnings - fix them immediately
- Don't skip Storybook stories for new components
- Don't commit without running the mandatory steps above
- Don't work directly on main branch
- Don't use `any` types or non-null assertions (`!`)

## When Blocked or Unsure
1. **Ask the user** for clarification rather than making assumptions
2. **Check existing codebase** for similar implementations
3. **Read component documentation** in Storybook
4. **Review CLAUDE.md** for project-specific guidelines