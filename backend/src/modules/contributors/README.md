# Contributors Module

Contributor profiles and invitation management. Goal-scoped endpoints live inside the Goals module router.

## Endpoints

### Standalone (mounted at `/api/v1/contributors`)

| Method | Path | Auth | Status |
|--------|------|------|--------|
| GET    | `/api/v1/contributors` | User | Available |

### Nested inside Goals module (`/api/v1/goals/:id/...`)

| Method | Path | Auth | Status |
|--------|------|------|--------|
| GET    | `/api/v1/goals/:id/contributors` | User (owner) | Available |
| POST   | `/api/v1/goals/:id/contributors` | User (owner) | Available |
| POST   | `/api/v1/goals/:id/invitations` | User (owner) | Available |
| GET    | `/api/v1/goals/:id/invitations` | User (owner) | Available |

## Notes

- `POST /goals/:id/invitations` body: `{ recipients: [{email, name}], channel: "email"|"sms", message? }`.
- Email/SMS delivery is handled through the notifications module.
- Requires DB tables: `contributors`, `invitations`, `goals`, `transactions`.
