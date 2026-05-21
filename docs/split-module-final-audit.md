# Split Module Final Audit

Date: 2026-05-19

## Completed

- Splits is a main tab with Groups, Friends, and Activity segments.
- Groups show real cards with member count, expense count, latest activity date, current user balance, View/Add Expense actions, and action menu.
- Group action menu includes Edit Group, Add Member, View Balances, Archive Group, Delete Group.
- Friends show person-wise balances across split groups, expose Settle Up, and open FriendDetail.
- Activity shows chronological backend activity and opens related group/expense details.
- Group detail shows user-focused status, summary metrics, simplified debts, expenses, members, and settlements.
- Add Expense supports group picker, paid by any member, selected split members, equal split, custom split, notes, and cents-based submission.
- Expense detail shows amount, group, payer, split shares, balance effect, and delete/edit actions.
- Settlement flow records from/to member, amount, date, and note.
- Group settings supports registered user search and manual member add.
- Top-bar avatar/search/AI/settings actions are functional.

## Backend

- Uses integer cents for split service calculations.
- Applies settlements as balance transfers.
- Simplifies positive/negative member balances into debtor-creditor rows.
- Creates split activity for group, member, expense, and settlement changes.
- Supports owner or registered member reads.
- Restricts group/member management to owner.

## Verification

- Server TypeScript: passed.
- Mobile TypeScript: passed.
- Prisma migration: applied.

## Remaining QA

- Simulator/device tap-through for all split flows.
- Two-account registered-member authorization check.
- Small Android viewport safe-area/FAB/keyboard checks.
