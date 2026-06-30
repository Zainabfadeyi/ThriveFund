# Admin Module

Platform-wide admin dashboard, reconciliation, webhook audit log, and management views. All endpoints require `role = admin`.

## Endpoints

| Method | Path | Auth | Status |
|--------|------|------|--------|
| GET    | `/api/v1/admin/overview` | Admin | Available |
| GET    | `/api/v1/admin/reconciliation` | Admin | Available |
| GET    | `/api/v1/admin/reconciliation/:id` | Admin | Available |
| POST   | `/api/v1/admin/reconciliation/:id/resolve` | Admin | Available |
| GET    | `/api/v1/admin/webhook-events` | Admin | Available |
| POST   | `/api/v1/admin/webhook-events/:id/retry` | Admin | Available |
| GET    | `/api/v1/admin/users` | Admin | Available |
| GET    | `/api/v1/admin/goals` | Admin | Available |
| GET    | `/api/v1/admin/transactions` | Admin | Available |

## Query Params

### `GET /reconciliation`

| Param | Description |
|-------|-------------|
| `status` | `matched` \| `unmatched` \| `failed` |
| `from` / `to` | ISO date range on `received_at` |

### `GET /webhook-events`

| Param | Description |
|-------|-------------|
| `processed` | `true` \| `false` |
| `event_type` | e.g. `payment.received` |

## Notes

- `POST /reconciliation/:id/resolve` body: `{ goal_id, action: "match", notes? }` — manually links an unmatched webhook event to a goal.
- `POST /webhook-events/:id/retry` re-queues a failed event for processing (queue integration pending).
- Requires DB tables: `users`, `goals`, `transactions`, `webhook_events`, `virtual_accounts`.
