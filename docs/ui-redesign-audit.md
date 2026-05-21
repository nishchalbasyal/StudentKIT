# Student Kit UI Redesign Audit

Date: 2026-05-18

## Fixed Problems

- Reduced oversized typography through shared tokens for titles, card titles, body text, captions, and tab labels.
- Replaced harsh local card styling with consistent white cards, soft borders, 18-24px radius, and light shadows.
- Changed bottom navigation to Home, Work, Money, Tasks, and More.
- Moved Profile out of the daily tab bar and into More.
- Redesigned Home around a greeting card, compact weekly calendar, one horizontal swipe card at a time, capped smart feed, and a clear floating Quick Add button.
- Replaced the confusing "What's new?" modal with "Quick Add".
- Made the Magic action open AI Assistant/Add with AI instead of being ambiguous.
- Made Search open a Global Search screen with recent searches and a coming-soon state.
- Split Money into three distinct tab experiences: Personal, Split, and Coupons.
- Made Coupons read-only from the user perspective, with list and details screens.
- Added Events list and details screens as read-only public/admin content.
- Reworked Work main screen into summaries, filters, weekly row, company breakdown, recent entries, and a Log Hours action.
- Moved the large work form out of the Work main screen and tightened Add Work Entry with a step-oriented frame.
- Reworked Tasks into compact Tasks and Reminders modes with Today/Upcoming/Overdue/Completed filters.
- Added More page sections for Life, Discover, and Account.
- Redesigned Groceries, Cleaning, AI Assistant, Settings, and Profile screens.
- Added actionable empty states for work, money, tasks, groceries, cleaning, coupons, events, and search.
- Added press scale states, haptic feedback on key add/complete actions, and confirmation-first AI preview behavior.

## Files Changed

- `apps/mobile/src/constants/colors.ts`
- `apps/mobile/src/navigation/MainTabs.tsx`
- `apps/mobile/src/navigation/RootNavigator.tsx`
- `apps/mobile/src/navigation/types.ts`
- `apps/mobile/src/components/ui/AppScreen.tsx`
- `apps/mobile/src/components/ui/AppCard.tsx`
- `apps/mobile/src/components/ui/AppButton.tsx`
- `apps/mobile/src/components/ui/AppTopBar.tsx`
- `apps/mobile/src/components/ui/EmptyState.tsx`
- `apps/mobile/src/components/home/QuickCaptureModal.tsx`
- `apps/mobile/src/components/forms/WorkShiftForm.tsx`
- `apps/mobile/src/screens/dashboard/DashboardScreen.tsx`
- `apps/mobile/src/screens/work/WorkHoursScreen.tsx`
- `apps/mobile/src/screens/work/AddWorkShiftScreen.tsx`
- `apps/mobile/src/screens/expenses/ExpensesScreen.tsx`
- `apps/mobile/src/screens/tasks/TasksScreen.tsx`
- `apps/mobile/src/screens/more/MoreScreen.tsx`
- `apps/mobile/src/screens/groceries/GroceryScreen.tsx`
- `apps/mobile/src/screens/cleaning/CleaningScreen.tsx`
- `apps/mobile/src/screens/ai/AIAssistantScreen.tsx`
- `apps/mobile/src/screens/coupons/CouponsListScreen.tsx`
- `apps/mobile/src/screens/coupons/CouponDetailsScreen.tsx`
- `apps/mobile/src/screens/events/EventsListScreen.tsx`
- `apps/mobile/src/screens/events/EventDetailsScreen.tsx`
- `apps/mobile/src/screens/search/GlobalSearchScreen.tsx`
- `apps/mobile/src/screens/settings/SettingsScreen.tsx`
- `apps/mobile/src/screens/profile/ProfileScreen.tsx`

## Remaining Issues

- Coupons and events currently use local placeholder data because no dedicated mobile server endpoints were present.
- Date long-press currently routes to Global Search as a placeholder instead of a full Day Details screen.
- Add Work Entry is visually step-framed, but the underlying form still renders as one scrollable form. A true progressive stepper should be the next pass.
- Global Search is intentionally a coming-soon screen until cross-module search is implemented.
- Some older swipe/action helper hooks still reference nested More routes that are no longer the primary navigation path.

## Future Improvements

- Add server-backed coupons and events APIs with admin-only creation.
- Build Day Details with work shifts, classes, tasks, expenses, and reminders by date.
- Convert Add Work Entry into a real multi-step wizard with validation per step.
- Add real global search across work, expenses, tasks, groceries, classes, and reminders.
- Add skeleton loaders per screen instead of generic loading components.
- Add toast feedback and animated progress/check states once a toast/animation utility is chosen.

## Verification

- `npm --workspace @student-kit/mobile run typecheck` passes.
