# Latest UI + Functionality Audit

Date: 2026-05-18

## Verified Fixes

- Task form now uses native date, time, and date-time pickers. No ISO date placeholder is shown to users.
- Work entry uses picker-only date/start/end fields, supports overnight shifts, shows income, and warns for invalid/long shifts.
- Company picker now fetches backend companies, has search, Add New Company, empty CTA, and edit/archive actions.
- Work summary and work lists no longer use fake McDonald's/Bakery fallback data.
- Money page tabs are now Personal, Budgets, Coupons. Split was removed from Money because Splits is a main tab.
- Splits tab now supports backend-backed group creation, members, expenses, balances, and settlements.
- Add Shared Expense handles missing `groupId` with a friendly group selector/CTA instead of crashing.
- Global Search is connected to `GET /api/search?q=`.
- Coupons and events are loaded from backend read-only endpoints.
- Home Quick View is one row: Work, Money, Tasks, Grocery, Search.

## Verification

- `npm --workspace @student-kit/server run typecheck` passed.
- `npm --workspace @student-kit/mobile run typecheck` passed.
- `npx prisma migrate dev` applied `20260518170000_student_kit_repair`.
- API smoke tests passed for login, companies, coupons, events, search, split group creation, split expense creation, balances, and cleanup.

## Remaining Manual QA

- Test native picker behavior on an actual iOS/Android simulator.
- Confirm Expo Calendar permission UX on device.
- Walk through edit/delete work entry flows on device.
