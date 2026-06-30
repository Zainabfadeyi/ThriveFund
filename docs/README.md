# ThriveFund Documentation

Technical documentation for the ThriveFund platform — a goal-based savings and payment reconciliation product built on **Nomba Dedicated Virtual Accounts**.

## Documents

| Document | Description |
|----------|-------------|
| [Architecture Overview](./architecture-overview.md) | System design, data model, payment flow, and tech stack |
| [API Endpoints](./api/endpoints.md) | Complete REST API reference (all endpoints) |
| [API Quick Reference](./api/quick-reference.md) | Endpoint summary table for fast lookup |
| [Webhook Specification](./api/webhooks.md) | Nomba webhook processing and reconciliation rules |
| [Backend Modules](./backend-modules.md) | Modular monolith architecture and payment flow |

## Base URLs

| Environment | URL |
|-------------|-----|
| Production | `https://api.thrivefund.ng` |
| Staging | `https://api-staging.thrivefund.ng` |
| Local | `http://localhost:8000` |

All API routes are prefixed with `/api/v1` unless noted otherwise (webhooks use `/api/webhooks`).

## Related

- [Frontend README](../frontend/README.md)
- [Nomba API Documentation](https://docs.nomba.com) — use during integration for exact payloads and auth
