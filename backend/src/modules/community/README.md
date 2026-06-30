# Community & Search Module

Filters goals by community/religious categories, and provides global search across goals, transactions, and contributors.

## Endpoints

| Method | Path | Auth | Status |
|--------|------|------|--------|
| GET    | `/api/v1/community-projects` | User | Available |
| GET    | `/api/v1/search?q=` | User | Available |

## Query Params

### `GET /community-projects`

| Param | Default | Description |
|-------|---------|-------------|
| `category` | `community_project,religious` | Comma-separated category filter |
| `page` / `per_page` | Pagination | |

### `GET /search`

| Param | Required | Description |
|-------|----------|-------------|
| `q` | Yes | Search term |
| `type` | No | `goals` \| `transactions` \| `contributors` (omit for all) |

## Notes

- The community router is mounted at two prefixes in `app.ts` and dispatches based on `req.baseUrl`.
- Search returns a grouped object: `{ goals: [...], transactions: [...], contributors: [...] }`.
- Requires DB tables: `goals`, `transactions`, `contributors`.
