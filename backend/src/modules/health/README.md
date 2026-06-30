# Health Module

Liveness and readiness probes for load balancers and deployment platforms.

## Endpoints

| Method | Path | Auth | Status |
|--------|------|------|--------|
| GET    | `/api/v1/health` | Public | Available |
| GET    | `/api/v1/health/ready` | Public | Available |
| GET    | `/health` | Public | Available |

> `/health` (no prefix) is also mounted in `app.ts` for load balancer compatibility.

## Responses

### `GET /health`
```json
{ "status": "ok" }
```

### `GET /health/ready`
```json
{
  "status": "ready",
  "checks": {
    "database": "ok",
    "nomba_api": "unknown"
  }
}
```
Returns `503` if the database is unreachable.

## Notes

- Add a Nomba API ping in `health.controller.ts` to make `nomba_api` meaningful.
