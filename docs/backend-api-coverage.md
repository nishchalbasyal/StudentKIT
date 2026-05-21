# Backend API Coverage

Date: 2026-05-19

## Covered Endpoints

- Companies, work shifts, expenses, budgets, classes, tasks, reminders, cleaning, groceries.
- Search: `GET /api/search?q=`.
- User search: `GET /api/users/search?q=`.
- Coupons/events read-only content.
- Splits: full groups, members, expenses, balances, settlements, friends, and activity surface.

## Split Data Model Changes

- `SplitGroup`: archive/image metadata, owner mapped to existing `userId` column.
- `SplitMember`: registered/manual metadata and optional `userId`.
- `SplitExpense`: amount cents, category, currency, creator, payer records.
- `SplitExpenseShare`: amount cents.
- `SplitSettlement`: amount cents, currency, creator.
- `SplitActivity`: group event timeline.

## Smoke Results

- Typechecks pass for server and mobile.
- Prisma migration `20260519120000_splitwise_completion` applied.
