# Transactions Module

Read-only view of payment records. Transactions are created by the Nomba webhook processor — never directly by the client.

## Endpoints

### Standalone routes (mounted at `/api/v1/transactions`)

| Method | Path | Auth | Status |
|--------|------|------|--------|
| GET    | `/api/v1/transactions` | User | Available |
| GET    | `/api/v1/transactions/export` | User | Available |
| GET    | `/api/v1/transactions/:id` | User (owner of linked goal) | Available |

### Nested route (mounted inside Goals module)

| Method | Path | Auth | Status |
|--------|------|------|--------|
| GET    | `/api/v1/goals/:id/transactions` | User (owner) | Available |

## Query Params (`GET /transactions`)

| Param | Description |
|-------|-------------|
| `goal_id` | Filter to one goal |
| `status` | `successful` \| `pending` \| `failed` \| `duplicate` \| `pending_review` |
| `from` | ISO date lower bound on `paid_at` |
| `to` | ISO date upper bound on `paid_at` |
| `q` | Text search on contributor name |
| `page` / `per_page` | Pagination |

## Notes

- `/export` returns `text/csv` and is registered before `/:id` in Express.
- Transactions are owned by the user who owns the linked goal.
- Requires DB tables: `transactions`, `goals`.
