# Analytics Module

Dashboard stats and chart data. This router is mounted at **both** `/api/v1/dashboard` and `/api/v1/analytics` so a single handler serves both prefixes.

## Endpoints

| Method | Path | Auth | Status |
|--------|------|------|--------|
| GET | `/api/v1/dashboard/overview` | User | Available |
| GET | `/api/v1/analytics/monthly-contributions` | User | Available |
| GET | `/api/v1/analytics/category-breakdown` | User | Available |
| GET | `/api/v1/analytics/top-contributors` | User | Available |
| GET | `/api/v1/analytics/goal-performance` | User | Available |

## Query Params

| Endpoint | Param | Default | Description |
|----------|-------|---------|-------------|
| `monthly-contributions` | `months` | `6` | How many months back to include |
| `top-contributors` | `limit` | `10` | Max contributors to return |

## Notes

- `overview` is the main dashboard stat card aggregation: total saved, active goals, contributor count, this-month amount.
- All endpoints are scoped to the authenticated user's goals only.
- Requires DB tables: `goals`, `transactions`.
