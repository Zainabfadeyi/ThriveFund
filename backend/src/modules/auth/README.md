# Auth Module

Handles user registration, login, token management, and password reset.

## Endpoints

| Method | Path | Auth | Status |
|--------|------|------|--------|
| POST | `/api/v1/auth/register` | Public | Available |
| POST | `/api/v1/auth/login` | Public | Available |
| POST | `/api/v1/auth/refresh` | Public | Available |
| POST | `/api/v1/auth/logout` | User (JWT) | Available |
| POST | `/api/v1/auth/forgot-password` | Public | Available |
| POST | `/api/v1/auth/reset-password` | Public | Available |
| GET  | `/api/v1/auth/me` | User (JWT) | Available |

## Notes

- `POST /register` returns `201` with user + token pair.
- `POST /login` returns `200` with user + token pair.
- `POST /forgot-password` always returns `200` (no email enumeration).
- `POST /logout` deletes the refresh token from `refresh_tokens` table.
- Password reset flow: `forgot-password` → email link with token → `reset-password`.
- Requires DB tables: `users`, `refresh_tokens`, `password_resets`.
