# Security Audit

Date: 2026-05-20

## Backend

- JWT remains required on protected routes.
- User profile and settings routes scope reads/writes to `req.user.id`.
- Split routes remain owner/member scoped.
- Group/member management remains owner-only.
- Expense and settlement validation remains member/group scoped.
- Zod validation remains active on request bodies and search query input.
- Global search requires JWT, uses user scoping, and now applies `userSearchRateLimit`.
- Auth rate limiting and AI rate limiting remain enabled.
- Helmet and env-based CORS remain enabled.
- Prisma client APIs are used; no raw SQL was introduced.

## Frontend

- No token logging was introduced.
- Existing API client 401 logout behavior remains in place.
- Destructive actions still use confirmation prompts.
- Form validation remains in the existing add/edit forms.
- Main-screen mutations invalidate through existing React Query hooks.

## Fixes This Pass

- `/api/search` now uses the existing search rate limiter.
- Google OAuth now uses a valid API error code and safe optional token payload handling.

## Residual Risk

- Full two-user split authorization QA is still required.
- Runtime Google OAuth smoke test is recommended.
- Dependency audit was not rerun as part of this UI pass.
