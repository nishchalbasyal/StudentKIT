# Product Requirements

## Vision

Student Kit is a lightweight, fast, student-friendly app for international students in Germany. It helps students understand their time, money, study load, groceries, home routines, and upcoming reminders in one place.

## Target User

- International student living in Germany.
- Often balancing classes, part-time work, groceries, rent, cleaning, and assignments.
- Needs simple English and low-friction input.
- May use mobile daily and web for weekly planning.

## MVP Goals

- Track work shifts and calculate monthly income.
- Warn about configurable student work limits.
- Track expenses, budgets, and monthly savings.
- Manage classes, assignments, and reminders.
- Keep grocery shopping lists with price history.
- Track cleaning and laundry habits.
- Generate optional AI suggestions from real user data only.

## Non-Goals for MVP

- Bank integration.
- Payroll compliance automation.
- Legal or tax advice.
- Offline-first conflict resolution.
- Multi-user households.
- AI actions that directly change user data.

## Core Product Principles

- One backend API owns calculations and business rules.
- Frontends are clients, not duplicate business-logic engines.
- AI can suggest, summarize, and warn, but never directly modifies data.
- Every module has empty, loading, error, and success states.
- Forms stay short and readable.

## Dashboard Requirements

The dashboard shows:

- Today's classes.
- Today's tasks.
- Monthly income.
- Monthly expenses.
- Monthly savings.
- Work-limit warning.
- Pending grocery items.
- Cleaning reminders.
- Latest AI insight if enabled.

## Work-Limit Requirement

The Germany policy must be configurable. The default Germany policy should support the current 140 full days or 280 half-days per year model. A day with up to four hours counts as a half day in the default policy. University auxiliary work and other exceptions should be represented as policy notes and future fields, not hardcoded assumptions.

## AI Requirements

- AI is optional.
- Ollama is the first provider.
- OpenAI can be added later through the same provider interface.
- AI prompts are built by backend services from database facts.
- AI must say when data is missing.
- AI output is stored as an insight and presented for user confirmation or action.

