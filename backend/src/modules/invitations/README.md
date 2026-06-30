# Invitations Module

Sends contributor invitations via Brevo email.

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/v1/goals/:goalId/invitations` | User | Send invitations |
| GET | `/api/v1/goals/:goalId/invitations` | User | List sent invitations |
| POST | `/api/v1/invitations/:token/accept` | Public | Accept invitation |

## Statuses

`sent`, `accepted`, `declined`, `expired`
