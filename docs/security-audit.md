# Security Audit

Date: 2026-05-21

## Backend

- JWT remains required on protected routes.
- Settings, budgets, reminders, sync, AI, features, search, and split routes all scope reads/writes to the authenticated user id.
- Zod validation remains active on the touched write routes.
- AI request routes now return a coming-soon placeholder and do not call a paid provider.
- Sync push/pull is authenticated and server-side user scoped.
- Helmet and env-based CORS remain enabled.

## Frontend

- No token logging was introduced.
- Existing API client 401 logout behavior remains in place.
- Destructive actions still use confirmation prompts.
- The new local-first budget and settings wrappers only sync when authenticated.

## Residual Risk

- Apply the new Prisma migration before using the new columns in a live database.
- Rate limiting for sync and feature discovery could be tightened further for production.
- Device QA is still required for guest-mode local data, login sync prompts, and destructive actions.
