# Reminder Sync Audit

Date: 2026-05-21

## Scope

- Unified reminder model
- Local reminder engine
- Backend reminder sync
- Guest-mode fallback

## Findings

- Reminders now carry `localId`, `sourceType`, `sourceId`, `repeatRule`, `isEnabled`, `deliveryType`, and `syncedAt`.
- `GET /api/reminders`, `POST /api/reminders`, `PUT /api/reminders/:id`, `DELETE /api/reminders/:id`, and `POST /api/reminders/sync` remain available.
- Reminder sync still falls back to local-first behavior for guests.
- Local reminder creation remains the source of truth for scheduled notifications.

## Residual

- Apply the new Prisma migration before relying on the new reminder columns in a live database.
- Device QA is still needed for notification scheduling, repeat rules, and sync conflict handling.
