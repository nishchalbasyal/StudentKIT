# API Coverage Report

Date: 2026-05-20

## Mobile Primary Tab Coverage

- Home: dashboard, work summary, tasks, AI insights.
- Work: work shifts create/update/delete, weekly summary, monthly summary, companies through existing work summary.
- Money: expenses create/update/delete, expense summary, budgets, budget summary, coupons.
- Splits: summary, groups create/update/delete, friends, activity, group detail, expenses create/update/delete, members, balances, settlements.
- Tasks: tasks create/update/delete/complete and reminders.
- More: groceries create/update, cleaning create/update/delete/complete, AI, coupons, events, settings, profile.

## API Routes Confirmed Present

- Auth: `/api/auth/register`, `/api/auth/login`, `/api/auth/refresh`, `/api/auth/me`, `/api/auth/google-signin`.
- User: `/api/users/me`, `/api/users/avatar`, `/api/users/me/summary`, `/api/users/search`.
- Settings: `/api/settings` and scoped settings update routes.
- Work: `/api/work-shifts`.
- Companies: `/api/companies`.
- Expenses: `/api/expenses`.
- Budgets: `/api/budgets`.
- Tasks: `/api/tasks`.
- Reminders: `/api/reminders`.
- Groceries: `/api/groceries`.
- Cleaning: `/api/cleaning`.
- AI: `/api/ai`.
- Global search: `/api/search`.
- Coupons: `/api/coupons`.
- Events: `/api/events`.
- Splits: `/api/split`.

## Verification

- Server typecheck passed.
- Mobile typecheck passed.

## Gaps / QA

- Runtime route smoke tests should be run with seeded data.
- Search result tap-through should be verified for every result type.
