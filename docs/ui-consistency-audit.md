# UI Consistency Audit

Date: 2026-05-20

## Brand System

- Primary green: `#1F8F2E`.
- Bright green: `#36D900`.
- Deep green: `#0B6B2A`.
- Soft green background: `#EAFBE7`.
- App background: `#F7F9F5`.
- Surface cards/rows: `#FFFFFF`.

## Shared Components

- `AppHeader` owns avatar, title, AI, search, and settings actions.
- `ListRow` owns WhatsApp-like row density, avatar/icon circle, title/subtitle/meta, right text, chevron, and 3-dot action.
- `SegmentedTabs` owns the tab styling used by Work, Money, Splits, and Tasks.
- `FloatingActionButton` owns green 56px contextual create action.
- `ActionSheet` owns lightweight bottom action menus.

## Screen Alignment

- Home, Work, Money, Tasks, Splits, and More use the shared shell language.
- Profile and Settings remain backend-backed from the previous pass and inherit shared header behavior through `AppTopBar`.
- Bottom navigation remains six tabs with green active state and gray inactive state.

## Remaining Visual QA

- Confirm row heights, text truncation, and FAB spacing on small Android.
- Confirm web preview does not stretch content awkwardly.
- Confirm all long localized strings fit in buttons and right-side row text.
