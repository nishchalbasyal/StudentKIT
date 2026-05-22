# Backend Sync Audit

Date: 2026-05-21

## Scope

- Settings sync
- Budget sync
- Reminder sync
- Generic sync push / pull
- Guest-mode local-first behavior

## Findings

- Settings are persisted locally and now sync to the backend when authenticated.
- Budget CRUD uses the local-first mobile wrapper and now has backend sync support.
- Reminder CRUD stays local-first for guests and syncs through the backend queue when logged in.
- `POST /api/sync/push` accepts queue items and dispatches settings, budget, and reminder merges.
- `GET /api/sync/pull` returns a serialized snapshot for supported MVP entities.

## Residual

- Apply the new Prisma migration before running the new columns in a live database.
- Full entity-specific pull merge is still MVP-only for settings, budgets, and reminders.
- Device QA is still needed for offline-first round-trips and post-login reconciliation.
