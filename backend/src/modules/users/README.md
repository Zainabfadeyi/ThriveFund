# Users Module

User profile management and notification preferences.

## Endpoints

| Method | Path | Auth | Status |
|--------|------|------|--------|
| GET    | `/api/v1/users/me` | User | Available |
| PATCH  | `/api/v1/users/me` | User | Available |
| PATCH  | `/api/v1/users/me/password` | User | Available |
| GET    | `/api/v1/users/me/notification-preferences` | User | Available |
| PATCH  | `/api/v1/users/me/notification-preferences` | User | Available |

## Notes

- `PATCH /me` accepts partial updates (any subset of `first_name`, `last_name`, `phone_number`).
- `PATCH /me/password` requires `current_password` for verification before changing.
- Notification prefs upserted — first request creates the row with provided fields + defaults for the rest.
- Requires DB tables: `users`, `notification_preferences`.
