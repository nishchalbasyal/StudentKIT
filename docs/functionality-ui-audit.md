# Student Kit Functionality UI Audit

Date: 2026-05-18

## Interaction

- Home main cards use horizontal swipe only. Tap opens the primary action. Long press opens an action menu.
- Work company cards open Company Detail and long press exposes View/Edit actions.
- Work recent entries open Work Entry Detail and long press exposes View/Edit/Duplicate/Delete.
- Money summary numbers are clickable: income opens Work Summary, expenses opens Expense Report, savings/budget opens Budget Settings.
- Money category chips open Category Settings.
- Recent expenses open Expense Detail with edit/delete actions.
- Split group cards open Split Group Detail. Split action buttons open create group, add split expense, and settlement flows.
- Task rows open Task Detail and long press exposes View/Complete/Edit/Delete.
- Reminder cards open Reminder Detail.
- Grocery rows open Grocery Detail.
- Cleaning rows open Cleaning Routine Detail.
- Search and Magic icons navigate to Global Search and AI Assistant.

## Forms

- Add Expense uses smart suggestions from previous expenses for titles, amounts, category, and payment method.
- Add Work Entry company card is clickable and opens a company picker.
- Company picker applies previous wage, break, and shift time suggestions when available.
- Add Task uses title suggestions, due date chips, reminder chips, and optional date/time picker fallback.
- Date/time typing is no longer the only path for task and work input.

## Work

- Work main screen shows summary, filters, weekly row, log-hours action, company breakdown, and recent entries.
- Entries support detail and delete through existing work shift API hooks.
- Company Detail is derived from existing work-shift data until a company API exists.
- Work History lists existing entries and opens detail screens.

## Money

- Personal, Split, and Coupons tabs are separate experiences.
- Personal uses real expense summary and expense data where available.
- Expense Detail supports real delete through existing expense API hooks.
- Category Settings is present and explains default category behavior.
- Coupons remain read-only/admin content.

## Split

- Split screens are wired: group detail, add/edit group, add split expense, split expense detail, settlement, and member balance.
- Split API endpoints are not present yet, so screens are honest backend-ready shells rather than fake settlement data.

## Tasks

- Tasks and reminders are clickable.
- Task Detail supports mark complete and delete through existing task API hooks.
- Reminder Detail exposes mark done, snooze, and edit controls.
- Calendar sync is visible as a permission-gated option in Add Task.

## Home

- No vertical swipe is used inside Home cards.
- Feature carousel uses horizontal swipe.
- Smart feed remains finite and scrolls normally.
- Quick Add opens the bottom sheet.
- AI flow still previews before save.

## AI

- AI Assistant includes Add with AI input, examples, preview, and confirmation controls.
- AI does not save directly.
- Suggestion engine uses previous user data for local form autofill where available.

## Backend/Data Sources

- Existing backend-backed flows used: work shifts, expenses, tasks, groceries, cleaning.
- Backend missing or not connected: split groups, companies as first-class records, coupons API, events API, global search API, suggestion API.
- Missing backend flows use Coming Soon or backend-ready screens with explanations, not silent dead buttons.

## Performance

- Home feed is capped and not infinite.
- No repeated AI calls were added.
- Suggestion engine is memoized through `useSmartSuggestions`.
- Secondary screens are stack routes and loaded only when navigated to.

## Remaining Work

- Add real Split API integration.
- Add Company API integration for create/edit/delete and defaults.
- Add global search endpoint integration.
- Add real coupon/event endpoints.
- Add native calendar permission and event creation.
- Add true swipe-row gestures with a gesture library or custom PanResponder.
- Convert Add Work Entry into fully collapsible step cards.

## Verification

- `npm --workspace @student-kit/mobile run typecheck` passes.
