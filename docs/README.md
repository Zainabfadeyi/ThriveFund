# ThriveFund Documentation

Technical documentation for ThriveFund, a live campaign collection and payment reconciliation platform built on **Nomba dedicated virtual accounts**.

## Documents

| Document | Description |
|----------|-------------|
| [Submission Overview](../DEMO.md) | Live product summary, demo flow, Nomba usage, and production readiness |
| [Architecture Overview](./architecture-overview.md) | System design, data model, payment flow, and tech stack |
| [API Endpoints](./api/endpoints.md) | Complete REST API reference (all endpoints) |
| [API Quick Reference](./api/quick-reference.md) | Endpoint summary table for fast lookup |
| [Webhook Specification](./api/webhooks.md) | Nomba webhook processing and reconciliation rules |
| [Nomba Withdrawal Flow](./api/nomba-withdrawals.md) | How campaign virtual accounts, sub-account balance, and payout transfers fit together |
| [Backend Modules](./backend-modules.md) | Modular monolith architecture and payment flow |

## Base URLs

| Environment | URL |
|-------------|-----|
| Production | `https://api.thrivefund.live` |
| Local | `http://localhost:3001` |

All API routes are prefixed with `/api/v1` unless noted otherwise (webhooks use `/api/webhooks`).

## Related

- [Frontend README](../frontend/README.md)
- [Nomba Developer Documentation](https://developer.nomba.com)
