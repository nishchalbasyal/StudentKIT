# Sync Audit

Date: May 20, 2026

## Result

StudentKit now has an MVP sync queue for local-first behavior.

## Covered

- SyncQueue model fields exist locally: id, entityType, entityId, operation, payload, status, retryCount, lastError, createdAt, updatedAt.
- Offline or failed logged-in mutations enqueue sync work.
- After login, the app asks whether to sync local device data.
- Sync queue posts to backend `/api/sync`.
- Backend accepts generic sync items and has specific reminder merge handling.
- Reminder sync endpoint exists at `/api/reminders/sync`.

## Conflict Rule

MVP conflict rule: local latest updatedAt wins. If backend sync fails, local data remains intact and the queue item is marked failed for retry.

## Future Work

- Add entity-specific backend merge for tasks, work entries, expenses, groceries, cleaning routines, and splits.
- Add server-side duplicate detection using stable localId fields for all entities.
- Add a manual Sync Now screen with per-entity failure details.
