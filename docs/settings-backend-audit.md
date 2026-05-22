# Settings Backend Audit

Date: 2026-05-21

## Scope

- Local settings persistence
- Backend settings sync
- Module preference persistence
- Guest mode compatibility

## Findings

- `GET /api/settings` and `PUT /api/settings` remain the main settings contract.
- `PUT /api/settings/modules` now persists module preferences into `selectedModules`.
- Local storage mirrors the backend settings shape and keeps guest mode functional.
- Module choices now include coupons and events in addition to the core app modules.

## Residual

- Apply the new Prisma migration before expecting `selectedModules` to exist in the database.
- Device QA is still needed for settings toggles, module enable/disable, and login sync prompts.
