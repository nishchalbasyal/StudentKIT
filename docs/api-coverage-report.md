# API Coverage Report

Date: 2026-05-21

## Mobile Primary Tab Coverage

- Home: dashboard, work summary, tasks, AI insights.
- Work: work shifts create/update/delete, weekly summary, monthly summary.
- Money: expenses create/update/delete, expense summary, budgets, budget summary, coupons.
- Splits: summary, groups create/update/delete, friends, activity, group detail, expenses create/update/delete, members, balances, settlements.
- Tasks: tasks create/update/delete/complete and reminders.
- More: groceries create/update, cleaning create/update/delete/complete, AI, coupons, events, settings, profile.

## API Routes Confirmed Present

- Auth: `/api/auth/register`, `/api/auth/login`, `/api/auth/refresh`, `/api/auth/me`, `/api/auth/google-signin`.
- User: `/api/users/me`, `/api/users/avatar`, `/api/users/me/summary`, `/api/users/search`.
- Settings: `/api/settings`, `/api/settings/modules`, `/api/settings/notifications`, `/api/settings/preferences`, `/api/settings/ai`, `/api/settings/work`.
- Budgets: `/api/budgets`, `/api/budgets/current`, `/api/budgets/summary`, `/api/budgets/sync`.
- Reminders: `/api/reminders`, `/api/reminders/sync`.
- Sync: `/api/sync/push`, `/api/sync/pull`.
- Features: `/api/features`.
- AI: `/api/ai/status`, `/api/ai/request`.
- Work, companies, expenses, tasks, groceries, cleaning, coupons, events, split, and search remain present.

## Verification

- Server typecheck passed.
- Prisma client regenerated successfully.
- Mobile integration files in this pass passed typecheck.

## Gaps / QA

- Runtime route smoke tests should be run with seeded data.
- The new Prisma migration must be applied before live database validation.
- Search result tap-through should still be verified for every result type.
