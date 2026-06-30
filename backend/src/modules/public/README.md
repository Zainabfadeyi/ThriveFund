# Public Module

Unauthenticated endpoints for the shareable contribution page visible to external contributors.

## Endpoints

| Method | Path | Auth | Status |
|--------|------|------|--------|
| GET    | `/api/v1/public/goals/:slug` | Public | Available |
| GET    | `/api/v1/public/goals/:slug/virtual-account` | Public | Available |

## Notes

- `:slug` can be either the goal's `slug` field or its `id` (service handles both).
- Only returns goals with `status = 'active'`.
- `/virtual-account` returns only `account_number`, `account_name`, `bank_name` — no sensitive data.
- Requires DB tables: `goals`, `virtual_accounts`.
