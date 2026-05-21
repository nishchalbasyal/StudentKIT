# Gesture Interaction Model - Updated

## Overview

The app has been updated to eliminate gesture conflicts by removing swipe-based card deck interactions from the homepage and replacing them with tap-based feature switching.

## Key Changes

### 1. Homepage (DashboardScreen)

**BEFORE:**

- Horizontal swipe card deck for switching between features
- Cards could be swiped left/right to navigate
- Conflicts with vertical swipe for main tabs

**AFTER:**

- Feature switcher with icon row (7 icons)
- Tap icon to select feature (tap-based, no swipe)
- Single card displayed at a time
- Normal vertical scroll for entire page
- No gesture conflicts

### 2. Quick View Feature Switcher

**New Component:** `QuickViewSwitcher`

- Shows 7 feature icons: Work, Money, Tasks, Grocery, Cleaning, AI, Goals
- Each icon has a label below
- Tapping icon switches the displayed card
- Selected icon shows visual feedback (green background, border)
- Horizontally scrollable if needed

### 3. Quick View Card

**New Component:** `QuickViewCard`

- Displays content for selected feature
- Shows title, subtitle, icon, stats
- Has 2 primary action buttons (e.g., "Add Shift", "Details")
- Has 3-dot menu button for additional options
- Tap action buttons to perform actions
- Tap 3-dot menu for more options

## Gesture Rules

### ✅ ALLOWED (Primary Interactions)

1. **Tap**
   - Open details
   - Switch features (icon switcher)
   - Perform primary actions
2. **Long Press**
   - Open context menu for list items
   - Show additional options

3. **Vertical Scroll**
   - Scroll through page content
   - Standard mobile behavior

### ❌ AVOIDED (Prevents Conflicts)

1. ~~Horizontal Swipe~~ (already used for main tabs)
2. ~~Vertical Swipe~~ (already used for main tab switching)
3. ~~Nested Gesture Conflicts~~ (each screen uses its own gestures)

## Page-by-Page Interaction Model

### 🏠 Homepage (Dashboard)

- Vertical scroll only
- Tap: Switch feature in Quick View
- Tap: Action buttons (Add/Details)
- Long press: 3-dot menu
- Tap: Calendar date to add
- Tap: Feed cards to navigate

### 💼 Work Page

- Vertical scroll only
- Tap: Filter dropdowns
- Tap: Company to view details
- Long press: Company menu
- Tap: Calendar day selector

### 💰 Money/Expenses Page

- Vertical scroll only
- Tap: Segment control tabs (Personal/Split/Coupons)
- Tap: Expense to view
- Long press: Expense menu

### ✅ Tasks Page

- Vertical scroll only
- Tap: Task to view
- Long press: Task menu
- Tap: Filter/sort controls

### 🛒 Groceries Page

- Vertical scroll only
- Tap: Item to view
- Long press: Item menu
- Tap: Checkmark to mark done

### 🧹 Cleaning Page

- Vertical scroll only
- Tap: Task to mark done
- Long press: Task menu
- Tap: Edit routine

### 🎓 Tasks/Classes Page

- Vertical scroll only
- Tap: Item to view
- Long press: Item menu
- Tap: Add new

### ⚙️ Calendar

- No swipe
- Tap: Select date
- Tap selected date: Open Quick Add
- Long press: Open day details
- Use arrows for month navigation

## List Item Interactions (Consistent Pattern)

Every list row should follow this pattern:

1. **Tap:** Open details/full view
2. **Long Press:** Open context menu with options
3. **3-dot Button:** Quick access menu
4. **Swipe (Optional):** Only if it doesn't conflict with existing gestures
   - Recommended to use 3-dot menu instead for reliability

## Best Practices

1. **No Nested Gestures** - Each screen has independent gesture set
2. **Consistent Patterns** - Tap for primary, long press for menu
3. **Clear Feedback** - Visual feedback for all interactions
4. **No Hidden Swipes** - All gestures are discoverable via UI
5. **Accessibility** - All interactions have tap alternatives

## Components Used

### QuickViewSwitcher.tsx

- Icon row for feature selection
- Horizontally scrollable
- Visual feedback for selected item
- Props: features, selectedId, onSelect

### QuickViewCard.tsx

- Displays feature content
- Shows stats and actions
- 3-dot menu for options
- Props: card data, options callback

### DashboardScreen.tsx

- Updated to use feature switcher
- Removed horizontal swipe card deck
- Maintains vertical scroll
- All interactions are tap-based

## Migration Guide for Other Screens

If any screen currently uses swipe as primary interaction:

1. **Replace horizontal swipe with:**
   - Tap-based segmented controls
   - Icon switcher (like Quick View)
   - Dropdown filters

2. **Replace vertical swipe with:**
   - Scroll buttons with arrows
   - Calendar date picker
   - Tap-based navigation

3. **For list row actions:**
   - Use long press for menu
   - Use 3-dot button for menu
   - Tap for primary action

## Benefits

1. ✅ Eliminates gesture conflicts
2. ✅ More discoverable interactions
3. ✅ Better accessibility
4. ✅ Simpler implementation
5. ✅ More intuitive for users
6. ✅ Reduced cognitive load
7. ✅ Maintains playful, modern feel
8. ✅ Consistent across app

## Future Considerations

1. Monitor user feedback on interactions
2. Add haptic feedback for confirmations
3. Consider animations for feature switches
4. Add tooltips for first-time users
5. Track most-used features for optimization
