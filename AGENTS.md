**AGENTS.md**

- Build/Lint/Test Commands
  - Build: `npm run build`
  - Dev: `npm run dev`
  - Start: `npm run start`
  - Lint: `npm run lint`
  - Lint (fix): `npm run lint -- --fix`
  - Tests: No test script configured; when adding tests use framework CLI.
    - Jest: `npm test -- -t "test name"`
    - Vitest: `npx vitest run -t "test name"`
  - All tests (if configured): `npm test` or `npx vitest run`

- Code Style Guidelines
  - Imports: external first, internal, relative; rely on eslint-plugin-import/order
  - Formatting: follow project style (likely Prettier); run lint to catch issues
  - Types: prefer `type` for complex shapes; avoid `any`; explicit return types
  - Naming: components/types PascalCase; hooks use `use`; constants UPPER_SNAKE; vars camelCase
  - Error handling: throw errors with context; avoid swallowing; use custom error types when helpful
  - Async: await/try-catch; AbortController for fetch when possible
  - Testing: small, deterministic tests; descriptive names; avoid flaky tests

- Cursor/Copilot Rules
  - Cursor rules: none detected; add in `.cursor`/`.cursorrules` if present
  - Copilot rules: none detected; follow `.github/copilot-instructions.md` if present

- Quick Notes
  - Prefer named exports; keep modules cohesive; document public APIs with TS/JSDoc as needed
