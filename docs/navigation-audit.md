# Navigation Audit

Date: 2026-05-20

## Top Header

- Avatar opens `Profile`.
- Search opens `GlobalSearch`.
- AI sparkle opens `AIAssistant` unless a screen overrides it.
- Settings opens `Settings`.
- `AppTopBar` now delegates to `AppHeader`, so older screens inherit the same behavior.

## Primary Tabs

- Home: Quick Add sheet routes to AI, Work, Expense, Task, Grocery, and Cleaning.
- Work: FAB routes to `AddWorkShift`; rows route to `WorkEntryDetail`; Edit passes `workShiftId`; Duplicate passes `duplicateFromId`; company rows route to `CompanyDetail`.
- Money: FAB routes to `AddExpense`; expense rows route to `ExpenseDetail`; Edit passes `expenseId`; Duplicate passes `duplicateFromId`; budgets route to budget settings; coupons route to coupon detail.
- Splits: FAB remains context-aware; groups, friends, and activity route to detail/settlement flows.
- Tasks: FAB routes to `AddTask`; task rows route to `TaskDetail`; Edit passes `taskId`; Duplicate passes `duplicateFromId`; reminders route to `ReminderDetail`.
- More: all grouped rows route to real screens; Grocery Detail now has an id-aware Edit Item action; Cleaning routines now open a real add/edit/delete screen.

## Watch Items

- `AddEditReminder` still routes to a placeholder stack screen outside the primary tab redesign.
- Device QA should verify every row action sheet path after API data is present.
- On physical Android over USB, keep `adb reverse tcp:4000 tcp:4000` active before using API-backed save flows.

## Verification

- Mobile typecheck passed.
