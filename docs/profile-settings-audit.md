# Profile and Settings Audit

Date: 2026-05-19

## Profile

- Profile now loads from `GET /api/users/me` and summary from `GET /api/users/me/summary`.
- Header shows avatar initials, name, email, student status, country, currency, and Edit Profile.
- Student Setup shows country, yearly limit, default wage, university, and course.
- Your Progress shows total saved, work streak, expenses tracked, tasks completed, and active split groups.
- Account actions are connected: edit profile, linked accounts info, export data info, privacy info, delete account, and logout.
- Edit Profile persists through `PUT /api/users/me`.
- Delete account confirms first, then calls `DELETE /api/users/me` and logs out.
- Loading, error, and setup empty states are present.

## Settings

- Settings now loads from `GET /api/settings`.
- Notification toggles persist through `PUT /api/settings/notifications`.
- Preference choices persist through `PUT /api/settings/preferences`.
- AI settings persist through `PUT /api/settings/ai`; clear cache records a timestamp.
- Work settings persist through `PUT /api/settings/work`.
- Account rows are actionable and route or open a meaningful account/security state.
- Danger Zone includes working logout and confirmed delete account.

## Verification

- Server typecheck passed.
- Mobile typecheck passed.
- Prisma migration `20260519143000_profile_settings_completion` applied.
