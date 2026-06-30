# Virtual Accounts Module

One dedicated Nomba virtual account per goal. Creation calls Nomba API; all incoming payments flow back via webhook.

## Endpoints

### Standalone routes (mounted at `/api/v1/virtual-accounts`)

| Method | Path | Auth | Status |
|--------|------|------|--------|
| GET    | `/api/v1/virtual-accounts` | User | Available |
| GET    | `/api/v1/virtual-accounts/:id` | User (owner) | Available |

### Nested routes (mounted inside Goals module at `/api/v1/goals/:id/...`)

| Method | Path | Auth | Status |
|--------|------|------|--------|
| POST   | `/api/v1/goals/:id/virtual-account` | User | Available |
| GET    | `/api/v1/goals/:id/virtual-account` | User (owner) | Available |

## Notes

- `POST /goals/:id/virtual-account` returns `409` if an active account already exists for that goal.
- `POST /goals/:id/virtual-account` returns `502` if the Nomba API call fails.
- Requires DB tables: `virtual_accounts`, `goals`.
