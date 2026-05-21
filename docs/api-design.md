# API Design

## Base URL

All routes are under:

```text
/api
```

## Response Format

Success:

```json
{
  "data": {}
}
```

Error:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": {}
  }
}
```

## Authentication

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `GET /api/auth/me`
- `PATCH /api/auth/me`

Access tokens are short-lived JWTs. Refresh tokens are stored hashed in the database and can be revoked.

## Work Hours

- `GET /api/work-shifts`
- `POST /api/work-shifts`
- `GET /api/work-shifts/summary/monthly`
- `GET /api/work-shifts/summary/weekly`
- `PUT /api/work-shifts/:id`
- `DELETE /api/work-shifts/:id`

Backend responsibilities:

- Calculate worked hours.
- Calculate shift income.
- Calculate weekly and monthly totals.
- Calculate student work-limit usage and warning state.

## Expenses

- `GET /api/expenses`
- `POST /api/expenses`
- `GET /api/expenses/summary/monthly`
- `GET /api/expenses/category-summary`
- `PUT /api/expenses/:id`
- `DELETE /api/expenses/:id`
- `GET /api/budgets`
- `POST /api/budgets`
- `PUT /api/budgets/:id`
- `DELETE /api/budgets/:id`

Backend responsibilities:

- Monthly expense total.
- Monthly savings from income minus expenses.
- Category-wise totals.
- Budget comparison.

## Classes

- `GET /api/classes`
- `POST /api/classes`
- `GET /api/classes/week`
- `PUT /api/classes/:id`
- `DELETE /api/classes/:id`

Backend responsibilities:

- Weekly calendar data.
- Today's classes.
- Priority and attendance-aware suggestions.

## Tasks

- `GET /api/tasks`
- `POST /api/tasks`
- `GET /api/tasks/upcoming`
- `PUT /api/tasks/:id`
- `PATCH /api/tasks/:id/complete`
- `DELETE /api/tasks/:id`

Backend responsibilities:

- Upcoming deadlines.
- Completion state.
- Reminder creation.
- Linked class context.

## Groceries

- `GET /api/groceries/items`
- `POST /api/groceries/items`
- `PUT /api/groceries/items/:id`
- `DELETE /api/groceries/items/:id`
- `GET /api/groceries/shopping-list`
- `POST /api/groceries/shopping-list`
- `PATCH /api/groceries/shopping-list/:id/bought`
- `PATCH /api/groceries/shopping-list/:id/skipped`
- `GET /api/groceries/items/:id/price-history`
- `POST /api/groceries/items/:id/purchases`

Backend responsibilities:

- Expected finish date.
- Price history and trend.
- Auto shopping reminder suggestions.

## Cleaning

- `GET /api/cleaning`
- `POST /api/cleaning`
- `PATCH /api/cleaning/:id/complete`
- `PUT /api/cleaning/:id`
- `DELETE /api/cleaning/:id`

Backend responsibilities:

- Days since last done.
- Next reminder date.
- Completion updates.

## Reminders

- `GET /api/reminders`
- `POST /api/reminders`
- `PATCH /api/reminders/:id/complete`
- `DELETE /api/reminders/:id`

Backend responsibilities:

- Central reminder list.
- Link reminders to classes, tasks, groceries, cleaning, work, and custom items.

## AI

- `POST /api/ai/expense-advice`
- `POST /api/ai/weekly-summary`
- `POST /api/ai/grocery-advice`
- `POST /api/ai/study-plan`
- `POST /api/ai/work-limit-warning`

Backend responsibilities:

- Fetch only the needed user data.
- Build numeric summaries.
- Ask provider for suggestions.
- Store `AIInsight`.
- Never mutate source records without explicit user action.

