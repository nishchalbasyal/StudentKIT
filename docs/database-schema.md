# Database Schema

The MVP uses Prisma ORM with PostgreSQL. SQLite can be used for a local-only MVP later, but PostgreSQL is the production target.

## Model Groups

## Identity

- `User`: account, profile settings, default currency, default wage.
- `RefreshToken`: hashed refresh token storage for secure session renewal.

## Policy

- `WorkLimitPolicy`: country-specific and status-specific work-limit rules.

Germany default policy:

- 140 full-day units per calendar year.
- 280 half-day units per calendar year.
- Up to 4 hours counts as a half day.
- More than 4 hours counts as a full day.

The policy is configurable because legal and university guidance can change.

## Work

- `WorkShift`: one shift with job name, date, start/end time, break, wage, bonus, and notes.

Summaries are calculated from shifts and policy data.

## Finance

- `Expense`: one user expense.
- `Budget`: monthly budget, optionally per category.

Savings are calculated as monthly income minus monthly expenses.

## Study

- `ClassSchedule`: recurring weekly class.
- `Task`: homework, assignments, exams, personal, work, or other tasks.

Tasks can optionally link to a class.

## Groceries

- `GroceryItem`: reusable item definition.
- `GroceryPurchase`: purchase and price history.
- `ShoppingListItem`: current shopping list state.

Expected finish dates are computed from purchase date plus estimated days.

## Habits

- `CleaningTask`: cleaning or laundry habit with interval reminders.

## Reminders

- `Reminder`: central reminder table linked to any module.

## AI

- `AIInsight`: generated suggestion or summary. AI insights are records of advice, not automatic changes to user data.

## Indexing Rules

- Every user-owned table indexes `userId`.
- Date-heavy tables index `(userId, date)` or equivalent.
- Summary endpoints should query by indexed month/year ranges.
- Cascade delete is enabled from user to owned data.

See `server/prisma/schema.prisma` for the authoritative schema.

