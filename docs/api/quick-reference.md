# API Endpoints — Quick Reference

Base path: `/api/v1` · Auth: `Authorization: Bearer <access_token>`

## Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | Public | Create user account |
| POST | `/auth/login` | Public | Login, return JWT tokens |
| POST | `/auth/refresh` | Public | Refresh access token |
| POST | `/auth/logout` | User | Invalidate refresh token |
| POST | `/auth/forgot-password` | Public | Request password reset email |
| POST | `/auth/reset-password` | Public | Reset password with token |
| GET | `/auth/me` | User | Get current authenticated user |

## Users & Settings

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/users/me` | User | Get profile |
| PATCH | `/users/me` | User | Update profile |
| PATCH | `/users/me/password` | User | Change password |
| GET | `/users/me/notification-preferences` | User | Get notification settings |
| PATCH | `/users/me/notification-preferences` | User | Update notification settings |

## Goals

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/goals` | User | Create goal |
| GET | `/goals` | User | List user goals |
| GET | `/goals/{id}` | User | Goal details, balance, summary |
| PATCH | `/goals/{id}` | User | Update goal |
| DELETE | `/goals/{id}` | User | Delete goal (if no pending txns) |
| POST | `/goals/{id}/close` | User | Mark goal completed/closed |
| POST | `/goals/{id}/close-out` | User | Transfer collected funds out and expire virtual account |
| GET | `/goals/{id}/share` | User | Share link + QR metadata |

## Banks

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/banks/supported` | Public | Fetch supported Nomba transfer banks |
| POST | `/banks/lookup` | User | Verify recipient account name before close-out transfer |

## Virtual Accounts

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/goals/{id}/virtual-account` | User | Generate dedicated virtual account |
| GET | `/goals/{id}/virtual-account` | User | Get virtual account for goal |
| GET | `/virtual-accounts` | User | List all virtual accounts |
| GET | `/virtual-accounts/{id}` | User | Virtual account details |

## Transactions

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/transactions` | User | List all user transactions |
| GET | `/transactions/{id}` | User | Transaction detail |
| GET | `/goals/{id}/transactions` | User | Transactions for a goal |
| GET | `/transactions/export` | User | Export transactions as CSV |

## Contributors

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/contributors` | User | List contributors across goals |
| GET | `/goals/{id}/contributors` | User | Contributors for a goal |
| POST | `/goals/{id}/contributors` | User | Add contributor profile |
| POST | `/goals/{id}/invitations` | User | Send email/SMS invitation |
| GET | `/goals/{id}/invitations` | User | List sent invitations |

## Dashboard & Analytics

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/dashboard/overview` | User | Stats: total saved, active goals, contributors |
| GET | `/analytics/monthly-contributions` | User | Monthly contribution chart data |
| GET | `/analytics/category-breakdown` | User | Contributions by category |
| GET | `/analytics/top-contributors` | User | Top donors |
| GET | `/analytics/goal-performance` | User | Goal progress comparison |

## Notifications

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/notifications` | User | List notifications |
| GET | `/notifications/unread-count` | User | Unread count (sidebar badge) |
| PATCH | `/notifications/{id}/read` | User | Mark one as read |
| POST | `/notifications/read-all` | User | Mark all as read |

## Community & Search

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/community-projects` | User | Community/religious goals |
| GET | `/search` | User | Search goals, transactions, contributors |

## Public (Contributor-facing)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/public/goals/{slug}` | Public | Public goal page (share link) |
| GET | `/public/goals/{slug}/virtual-account` | Public | Account details for payment |

## Categories & Content

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/categories` | Public | Goal categories list |
| GET | `/banks/supported` | Public | Supported partner banks |
| GET | `/content/faqs` | Public | FAQ content (landing page) |

## Webhooks (Provider)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/webhooks/nomba` | Nomba signature | Receive Nomba payment events |

## Admin

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/admin/overview` | Admin | Admin dashboard overview |
| GET | `/admin/reconciliation` | Admin | Reconciliation logs |
| GET | `/admin/reconciliation/{id}` | Admin | Single reconciliation record |
| POST | `/admin/reconciliation/{id}/resolve` | Admin | Manually resolve unmatched event |
| GET | `/admin/webhook-events` | Admin | Raw webhook audit log |
| POST | `/admin/webhook-events/{id}/retry` | Admin | Retry failed webhook processing |
| GET | `/admin/users` | Admin | List platform users |
| GET | `/admin/goals` | Admin | List all goals |
| GET | `/admin/transactions` | Admin | List all transactions |

## Health

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/health` | Public | Service health check |
| GET | `/health/ready` | Public | Readiness (DB + Nomba connectivity) |

**Total: 58 endpoints**

See [endpoints.md](./endpoints.md) for full request/response schemas.
