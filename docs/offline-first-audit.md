# Offline-First Audit

Date: May 20, 2026

## Result

StudentKit now has a local-first foundation for guest and offline use.

## Covered

- App can enter Guest Mode without login after onboarding.
- Core local collections exist for tasks, reminders, work entries, companies, expenses, budgets, groceries, cleaning routines, split groups, split members, split expenses, settings, onboarding preferences, and sync queue.
- Existing AsyncStorage dependency is used for local persistence to avoid adding native SQLite risk mid-pass.
- TanStack Query remains an API/cache layer, not the primary local store.
- Tasks, reminders, work, expenses, budgets, groceries, cleaning, companies, dashboard, and basic split groups now fall back to local storage when logged out or offline.
- Login flow asks whether local data should sync after authentication.
- Local data is preserved if sync fails.

## Notes

- SQLite is still the recommended next persistence upgrade for larger datasets and relational queries.
- MVP conflict rule is local latest updatedAt wins on the client; deeper server merge policy is documented for future work.
