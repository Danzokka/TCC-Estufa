---
applyTo: "**"
---

# Commit Message Generation Guidelines

## Conventional Commits Format

Use the Conventional Commits specification for all commit messages:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

## Types

- **feat**: new feature for the user
- **fix**: bug fix for the user
- **docs**: changes to documentation
- **style**: formatting, missing semicolons, etc (no code change)
- **refactor**: refactoring production code, no new functionality
- **perf**: code changes that improve performance
- **test**: adding missing tests, refactoring tests
- **chore**: updating build tasks, package manager configs, etc
- **ci**: changes to CI configuration files and scripts
- **build**: changes that affect the build system or external dependencies

## Scopes

- **api**: backend/NestJS changes
- **web**: frontend/Next.js changes
- **ui**: UI component changes
- **db**: database/Prisma changes
- **docker**: containerization changes
- **ci**: CI/CD pipeline changes
- **deps**: dependency updates
- **config**: configuration changes

## Guidelines

- Use imperative mood in the description ("add" not "added")
- Don't capitalize the first letter of description
- No period at the end of description
- Keep description under 72 characters
- Use body to explain what and why, not how
- Reference issues and breaking changes in footer

## Examples

```
feat(api): add user authentication endpoint
fix(web): resolve responsive layout issues on mobile devices
docs: update API documentation with new endpoints
refactor(api): optimize database queries for better performance
chore(deps): update Next.js to v15
ci: add automated testing pipeline
perf(web): optimize bundle size by lazy loading components
test(api): add unit tests for user service
```

## Breaking Changes

```
feat(api): change authentication flow

BREAKING CHANGE: authentication now requires refresh tokens
```

## Multi-line Body Example

```
feat(web): add user dashboard

Add comprehensive user dashboard with:
- Project overview cards
- Recent activity timeline
- Quick action buttons
- Responsive design for mobile

Closes #123
```
