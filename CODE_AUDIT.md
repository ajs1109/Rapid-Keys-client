# Rapid-Keys Client Code Audit

Date: 2026-04-04
Branch: Test-Cloud

## Scope
- Runtime/startup verification for full-stack dev flow.
- Static checks with lint and TypeScript.
- Targeted review of auth, middleware, socket server, API routes, and config.

## Fixes Applied In This Pass
1. Startup path-alias reliability for custom server:
   - Updated imports in `server.ts` to runtime-safe relative imports.
2. Stabilized backend dev command:
   - `dev:socket` now uses `tsx` in `package.json`.
3. Added clean startup helper for stale Next cache cases:
   - Added `dev:socket:clean` script in `package.json`.
4. Fixed TypeScript error in profile edit API:
   - Replaced `user._id.toString()` with `String(user._id)` and improved error typing in `src/app/api/edit/route.ts`.
5. Cleaned middleware lint/type issues:
   - Removed unused `User` import and `userData` variable in `src/middleware.ts`.
   - Removed unused catch parameter.
6. Improved TS config portability:
   - Enabled `forceConsistentCasingInFileNames` in `tsconfig.json`.

## Validation Results
- `npx tsc --noEmit`: PASS after fixes.
- `npm run dev:socket:clean`: PASS (server starts on configured port).
- Route smoke test (`/auth`): HTTP 200.
- Runtime issue `ENOENT ... .next/server/edge/chunks/...` no longer reproduced after clean-start and script changes.

## Phase 2 Update (Completed)
- Resolved all ESLint errors reported in the previous run.
- Kept only non-blocking React Hook dependency warnings in gameplay components.
- `npx tsc --noEmit`: PASS.
- `npm run lint`: PASS with warnings only.

### Remaining Warnings
1. `src/app/(authProtected)/multi-player/page.tsx`
   - `react-hooks/exhaustive-deps` warnings on effects around socket/game lifecycle.
2. `src/components/singleplayer.tsx`
   - `react-hooks/exhaustive-deps` warnings on timer and typing calculation effects.

These warnings should be handled carefully with `useCallback` or refactoring effect boundaries to avoid behavior changes in real-time game flow.

## Findings (Prioritized)

### Critical
1. Hardcoded credentials and weak secret fallbacks in `src/config.ts`.
   - `MONGO_URI` includes an embedded Atlas username/password fallback.
   - `JWT_SECRET`, `TOKEN_SECRET`, and `REFRESH_SECRET` use weak defaults.
   - Risk: secret leakage, unauthorized access, and insecure production behavior when env vars are missing.
   - Recommendation:
     - Remove hardcoded real credentials from source.
     - Move all secrets to environment variables.
     - Fail fast in production if required env vars are absent.
     - Add `.env.example` with placeholder values only.

### High
1. Middleware performs network call to app API on every matched route in `src/middleware.ts` via `verifyUser`.
   - Risk: extra latency on every navigation, potential cascading failures if API is slow, difficult edge runtime debugging.
   - Recommendation:
     - Validate token directly in middleware (lightweight verification), or move auth check server-side per page/API route.

2. Sensitive request details are logged in auth verify route (`src/app/api/auth/verify/route.ts`).
   - Current logs print headers and flow details (`req.headers`, debug strings).
   - Risk: token/header leakage in logs and noisy production output.
   - Recommendation:
     - Remove debug logs or guard them behind development-only logging.

### Medium
1. Lint debt remains significant (`npm run lint` currently fails with many errors/warnings).
   - Main categories:
     - unused variables/imports
     - `any` usage
     - missing React hook dependencies
     - unescaped apostrophe in JSX
     - image optimization warning (`<img>` vs `next/image`)
   - Recommendation:
     - Triage by category and fix in small PRs.
     - Start with API routes and shared utils to reduce risk quickly.

2. Duplicate and inconsistent auth helper APIs in `src/lib/api.ts`.
   - Multiple overlapping token refresh/verify helpers (`refreshAuthToken`, `refreshAccessToken`, `refreshAccToken`, `verifyTokenFromServer`).
   - Risk: confusion, dead code, divergent behavior.
   - Recommendation:
     - Consolidate into one clear refresh flow and remove unused helpers.

3. Custom server + frontend command confusion.
   - Using `npm run dev` and `npm run dev:socket` simultaneously can create port/build cache conflicts.
   - Recommendation:
     - Prefer one primary dev command for full-stack local dev (`dev:socket`).
     - Keep frontend-only script clearly labeled (`dev:frontend`) if needed.

## Improvement Plan (Suggested Order)
1. Security hardening:
   - Remove hardcoded secrets and add strict env validation.
2. Logging cleanup:
   - Strip debug logs in auth paths and middleware-related APIs.
3. Lint cleanup wave 1:
   - Fix unused imports/vars and explicit `any` in API routes/utils.
4. Lint cleanup wave 2:
   - Resolve hook dependency warnings and UI lint warnings.
5. API layer simplification:
   - Consolidate duplicate auth utility functions in `src/lib/api.ts`.

## Run Commands (Recommended)
- Full stack (Next + Socket custom server):
  - `npm run dev:socket`
- Clean full-stack start if chunk/cache issues appear:
  - `npm run dev:socket:clean`
