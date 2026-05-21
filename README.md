# Student Kit App

Production-ready monorepo for an all-in-one productivity and finance app for international students in Germany.

## Product Scope

Student Kit combines expense tracking, work-hour and income tracking, class schedules, assignments, groceries, cleaning habits, reminders, and an optional AI assistant. The core rule is simple: one backend API owns the business logic, and every client uses it.

## Architecture

- `server`: Node.js, Express, TypeScript, Prisma, PostgreSQL, JWT auth, Zod validation.
- `apps/web`: React, Vite, TypeScript, Tailwind CSS, React Router, TanStack Query.
- `apps/mobile`: Expo React Native, TypeScript, React Navigation, TanStack Query, AsyncStorage.
- `packages/shared`: shared constants, TypeScript types, and Zod validators.
- `docs`: product, API, database, and roadmap documentation.

## Current Foundation

This first pass defines the production architecture and database model. The backend is designed so mobile, web, and a future Windows desktop app reuse the same API and calculations.

## Important Compliance Note

Germany work-limit rules are stored as configurable policy data. Current guidance used for the default Germany policy:

- Make it in Germany: https://www.make-it-in-germany.com/en/study-vocational-training/studies-in-germany/work
- BTU Cottbus-Senftenberg guidance referencing Residence Act Section 16b(3): https://www.b-tu.de/en/international/international-students/help-advice-on-all-aspects-of-studying/work-while-studying

The app should present work-limit output as planning guidance, not legal advice.

## Next Development Steps

1. Add server bootstrap, Prisma client, auth middleware, and error handling.
2. Implement Auth routes and services.
3. Implement Work Hours services and tested calculation utilities.
4. Add web and mobile dashboard shells that consume backend summaries.

