# Mobile Upgrade Audit

Date: 2026-05-17

## Implemented Changes

- Upgraded the mobile home screen into a Daily Life Control Center.
- Added smart greeting, Today Focus, swipe action deck, quick capture modal, financial health, company work summary, AI suggestions, smart timeline, student feed, monthly goals, and small wins.
- Added swipe actions using React Native `PanResponder` to avoid adding heavy gesture or carousel dependencies.
- Added haptic-style feedback with React Native `Vibration` and Android toast feedback for swipe actions.
- Added work-hours company grouping using existing `WorkShift.jobName` as the company name.
- Extended the backend monthly work summary response with `monthKey`, `companies`, `remainingLimitDays`, and `remainingLimitHours`.
- Added support for `GET /api/work-shifts/summary/monthly?month=YYYY-MM` while preserving existing `year` and numeric `month` query support.
- Added cached AI insight retrieval at `GET /api/ai/insights/latest`.
- Added homepage engines for priority focus, finite student feed, insight formatting, swipe direction, and notification rules.
- Added Work tab filters for this month, this week, and company/job selection.
- Added recent-month selection on the Work tab so company breakdowns can be checked beyond the current month without changing backend contracts.
- Aligned mobile work-shift bonus types with the backend enum, including `NIGHT_SHIFT` and `CUSTOM`.
- Added duplicate guardrails to AI generation so the same prompt/type returns the cached insight for the current UTC day instead of creating repeated records.
- Added tap feedback to Quick Capture actions.

## Files Changed

Backend:
- `server/src/modules/work-hours/workHours.schemas.ts`
- `server/src/modules/work-hours/workHours.service.ts`
- `server/src/modules/ai/ai.routes.ts`
- `server/src/modules/ai/ai.controller.ts`
- `server/src/modules/ai/ai.service.ts`

Mobile existing files:
- `apps/mobile/src/api/ai.api.ts`
- `apps/mobile/src/api/work.api.ts`
- `apps/mobile/src/constants/categories.ts`
- `apps/mobile/src/types/work.types.ts`
- `apps/mobile/src/validators/work.schema.ts`
- `apps/mobile/src/navigation/MainTabs.tsx`
- `apps/mobile/src/screens/dashboard/DashboardScreen.tsx`
- `apps/mobile/src/screens/work/WorkHoursScreen.tsx`
- `apps/mobile/src/hooks/useWorkHours.ts`
- `apps/mobile/src/utils/notifications.ts`
- `apps/mobile/src/components/home/QuickCaptureModal.tsx`

Mobile new files:
- `apps/mobile/src/components/home/AIInsightCard.tsx`
- `apps/mobile/src/components/home/FinancialHealthCard.tsx`
- `apps/mobile/src/components/home/MonthlyGoalCard.tsx`
- `apps/mobile/src/components/home/QuickCaptureModal.tsx`
- `apps/mobile/src/components/home/SmartGreetingHeader.tsx`
- `apps/mobile/src/components/home/SmartTimelineCard.tsx`
- `apps/mobile/src/components/home/StreakCard.tsx`
- `apps/mobile/src/components/home/StudentFeedCard.tsx`
- `apps/mobile/src/components/home/TodayFocusCard.tsx`
- `apps/mobile/src/components/home/WorkCompanySummaryCard.tsx`
- `apps/mobile/src/components/swipe/SwipeActionDeck.tsx`
- `apps/mobile/src/components/swipe/SwipeCard.tsx`
- `apps/mobile/src/components/swipe/SwipeHint.tsx`
- `apps/mobile/src/components/swipe/swipeActions.ts`
- `apps/mobile/src/hooks/useAIInsights.ts`
- `apps/mobile/src/hooks/useCompanyWorkSummary.ts`
- `apps/mobile/src/hooks/useHomeSummary.ts`
- `apps/mobile/src/hooks/useStudentFeed.ts`
- `apps/mobile/src/hooks/useSwipeActions.ts`
- `apps/mobile/src/utils/feedEngine.ts`
- `apps/mobile/src/utils/homePriorityEngine.ts`
- `apps/mobile/src/utils/insightFormatter.ts`
- `apps/mobile/src/utils/notificationRules.ts`
- `apps/mobile/src/utils/swipeEngine.ts`
- `apps/mobile/src/utils/workMath.ts`

## Architecture Check

- No folder structure was broken. New files were added inside existing `components`, `hooks`, and `utils` areas.
- Backend contracts were preserved. Existing monthly work summary fields still exist.
- No database migration was added. `jobName` remains the source for company/job grouping.
- No business logic was duplicated from backend calculations. Mobile only groups already returned calculated shift data for filtering and display.
- AI is not called automatically from the homepage. The home screen reads cached AI insights and falls back to local deterministic insights.
- Repeated manual AI requests for the same insight type and unchanged prompt are cached per UTC day.

## TypeScript And API Check

- Server typecheck passed with `npm run typecheck` in `server`.
- Mobile typecheck passed with `npm run typecheck` in `apps/mobile`.
- Android Metro export passed with `npx expo export --platform android --output-dir .expo-export-test`.
- New API route `GET /api/ai/insights/latest` uses existing auth middleware.
- New work summary month-string parsing accepts `month=YYYY-MM` and the older `year=2026&month=5` shape.

## UI And UX Check

- Home opens with immediate daily context instead of a static dashboard.
- Today Focus is limited to the most important items.
- Quick capture gives one-tap access to expense, work shift, task, grocery, cleaning, and voice-note placeholder.
- Swipe deck exposes add/details/insight/tip actions with visible hints.
- Work tab now supports company filtering, week/month switching, and recent month selection.
- Student feed is finite and useful, not infinite or social.
- Goal and streak cards are lightweight and non-punitive.

## Performance Check

- No heavy chart or carousel library was added.
- Swipe uses built-in React Native primitives.
- TanStack Query caching is preserved and stale times were added for home summary queries.
- AI calls are avoided on home load and repeated same-day AI generations reuse the cached record.
- Derived homepage content is memoized.

## Potential Bugs Fixed

- Reduced risk of Expo/Metro import breakage by continuing to bundle from `apps/mobile/index.ts`.
- Added fallback company grouping so the mobile UI still works even if an older backend response lacks `companies`.
- Added notification guardrails for quiet hours, max daily reminders, disabled categories, and completed reminders.
- Fixed a mobile/backend enum mismatch for work-shift bonus types.

## Remaining Risks

- Monthly goals are currently derived local goals, not persisted user-configurable goals.
- Voice note is a placeholder action.
- Weather, offers, news, and coupons are placeholders until trusted data sources are added.
- "Tomorrow classes" is displayed as zero because the current dashboard API only returns today's classes.
- Mark cleaning done opens the Cleaning screen rather than completing a selected routine from the modal.
- Full dark mode tokens are not implemented yet; existing color constants remain light-first.

## Future Improvements

- Add a persistent `Goal` model and CRUD API.
- Add optional `Company` model with nullable `companyId` on `WorkShift`, then backfill from `jobName`.
- Add a dedicated cached daily AI insight endpoint that proactively builds compact summaries when the product is ready for background insight generation.
- Add real notification settings UI for quiet hours and category toggles.
- Add trusted student events/offers/news sources with manual moderation or strict source allowlists.
- Add a lightweight toast component for consistent success feedback on iOS and Android.
