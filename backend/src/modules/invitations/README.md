# Invitations Module

Sends contributor invitations via Brevo email.
The dashboard supports bulk imports from CSV/TSV files exported by Excel, Google Sheets, or school/department systems.

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/v1/goals/:goalId/invitations` | User | Send invitations |
| GET | `/api/v1/goals/:goalId/invitations` | User | List sent invitations |
| POST | `/api/v1/invitations/:token/accept` | Public | Accept invitation |

## Statuses

`sent`, `accepted`, `declined`, `expired`

## Bulk Import Shape

Bulk import files use `name` and `email` columns. The frontend parses the file, removes duplicate or invalid emails from the send list, and calls `POST /api/v1/goals/:goalId/invitations` with up to 1,000 recipients.
