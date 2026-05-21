# Settings And Reminders Audit

Date: May 20, 2026

## Settings

- Settings load from local storage for guest/offline use.
- Settings save locally immediately.
- Logged-in settings updates attempt backend sync and enqueue if sync fails.
- Push notification permission is requested only when Push Notifications is enabled.
- Country work-limit field is now a searchable selector backed by `src/config/countries.ts`.
- Germany selection applies 140 yearly limit days, EUR, and 24h defaults while still allowing manual overrides.
- Currency options include EUR, USD, GBP, and NPR.
- Profile/Settings show Guest Mode versus logged-in mode and selected modules.

## Unified Reminders

- Added local unified reminder model fields: sourceType, sourceId, remindAt, repeatRule, isEnabled, deliveryType, syncedAt.
- Reminder engine creates reminders from:
  - tasks with due/reminder date
  - groceries with estimated lifespan or shopping reminder date
  - cleaning routines and mark-done updates
  - work shifts
  - split settlements
- If push is disabled or category is disabled, reminders remain in-app.
- Backend supports GET, POST, PUT, DELETE, complete, and POST `/api/reminders/sync`.

## Remaining QA

- Device notification scheduling should be tested in a development build, especially Android where Expo Go limits notifications.
- Calendar delivery is modeled but not fully implemented for all reminder sources yet.
