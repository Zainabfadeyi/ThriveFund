# Goals Module

Core resource — savings/contribution goals with full CRUD, nested sub-resource routes, and share link.

## Endpoints

| Method | Path | Auth | Status |
|--------|------|------|--------|
| POST   | `/api/v1/goals` | User | Available |
| GET    | `/api/v1/goals` | User | Available |
| GET    | `/api/v1/goals/:id` | User (owner) | Available |
| PATCH  | `/api/v1/goals/:id` | User (owner) | Available |
| DELETE | `/api/v1/goals/:id` | User (owner) | Available |
| POST   | `/api/v1/goals/:id/close` | User (owner) | Available |
| GET    | `/api/v1/goals/:id/share` | User (owner) | Available |

### Nested — Virtual Accounts

| Method | Path | Auth | Status |
|--------|------|------|--------|
| POST   | `/api/v1/goals/:id/virtual-account` | User | Available |
| GET    | `/api/v1/goals/:id/virtual-account` | User (owner) | Available |

### Nested — Transactions

| Method | Path | Auth | Status |
|--------|------|------|--------|
| GET    | `/api/v1/goals/:id/transactions` | User (owner) | Available |

### Nested — Contributors & Invitations

| Method | Path | Auth | Status |
|--------|------|------|--------|
| GET    | `/api/v1/goals/:id/contributors` | User (owner) | Available |
| POST   | `/api/v1/goals/:id/contributors` | User (owner) | Available |
| POST   | `/api/v1/goals/:id/invitations` | User (owner) | Available |
| GET    | `/api/v1/goals/:id/invitations` | User (owner) | Available |

## Notes

- `DELETE` returns `409` if pending transactions exist.
- `POST /close` sets `status = 'completed'`.
- All `:id` routes verify the goal belongs to the requesting user.
- Virtual account, transaction, and contributor controllers are imported here for the nested routes.
- Requires DB tables: `goals`, `virtual_accounts`, `transactions`, `contributors`, `invitations`.
