# Architecture Overview

## Product Summary

ThriveFund helps individuals, communities, schools, small businesses, and cooperatives collect money through **dedicated virtual accounts**. Each goal or customer receives a unique account number, and every incoming transfer is automatically matched to the correct goal, contributor, and transaction record.

## Track & Scope

| Item | Decision |
|------|----------|
| Track | Dedicated Virtual Accounts |
| Primary use case | Goal-based savings, group contributions, payment reconciliation |
| Build style | Web platform — backend API, React dashboard, Nomba virtual accounts, webhook processing |

### MVP (Must-have)

- User signup/login
- Create and manage goals
- Generate dedicated virtual account per goal or contributor
- Receive and verify Nomba payment webhooks
- Auto-update goal balance and transaction history
- Dashboard: progress, totals, transactions
- Admin dashboard: accounts, goals, payments, reconciliation logs

### Nice-to-have

- Email / WhatsApp payment notifications
- Public contribution page
- CSV export
- Role-based access (owner, admin, viewer)
- Transaction status badges: successful, pending review, failed, duplicate

### Current Exclusions

- Mobile app, complex KYC, full accounting/lending/wallet, multi-currency

## High-Level Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌──────────────────┐
│  Frontend       │────▶│  Backend API    │────▶│  PostgreSQL      │
│  React+Tailwind │     │  Express / TS   │     │  Users, goals,   │
│                 │     │                 │     │  accounts, txns  │
└─────────────────┘     └────────┬────────┘     └──────────────────┘
                                 │
                    ┌────────────┼────────────┐
                    ▼            ▼            ▼
              ┌──────────┐ ┌──────────┐ ┌─────────────┐
              │ Nomba API│ │ Webhook  │ │ Notification│
              │ Virtual  │ │ /nomba   │ │ Email/WA    │
              │ accounts │ │          │ │ Brevo       │
              └──────────┘ └──────────┘ └─────────────┘
```

## Payment Flow

1. User signs up and creates a goal (e.g. “NYSC Relocation Fund”, ₦300,000 target).
2. Backend requests Nomba to create a dedicated virtual account for the goal.
3. Nomba returns bank name, account number, account name, and reference.
4. User shares account details; contributor makes a bank transfer.
5. Nomba sends a webhook on payment received.
6. Backend validates webhook, checks idempotency, stores transaction.
7. Backend updates goal `current_amount` and marks reconciliation successful.
8. Frontend dashboard reflects updated progress and history.

## Data Model

| Model | Key fields | Purpose |
|-------|------------|---------|
| **User** | `id`, `name`, `email`, `password_hash`, `role`, `created_at` | Platform user or org admin |
| **Goal** | `id`, `user_id`, `title`, `description`, `target_amount`, `current_amount`, `deadline`, `status` | Savings/contribution target |
| **VirtualAccount** | `id`, `goal_id`, `nomba_account_id`, `account_number`, `account_name`, `bank_name`, `provider_reference`, `status` | Dedicated account linked to goal |
| **Contributor** | `id`, `goal_id`, `name`, `email`, `phone_number`, `unique_reference` | Optional payer profile |
| **Transaction** | `id`, `goal_id`, `virtual_account_id`, `amount`, `payer_name`, `reference`, `provider_reference`, `status`, `paid_at` | Incoming payment record |
| **WebhookEvent** | `id`, `event_type`, `provider_reference`, `payload`, `processed`, `processed_at` | Raw webhook audit log |

## Tech Stack

| Layer | Choice |
|-------|--------|
| Frontend | React + Tailwind CSS |
| Backend | Node.js + TypeScript + Express (modular monolith) |
| Database | MySQL 8 (AWS RDS) |
| Auth | JWT |
| Email | Brevo |
| Payments | Nomba virtual accounts, transfers, and webhooks |
| Hosting | AWS EC2 |
| API docs | OpenAPI |

## Reconciliation Rules

1. Store every webhook payload in `WebhookEvent` before business logic.
2. Use provider/transaction reference for **idempotency** (no duplicate transactions).
3. Validate webhook signature/secret per Nomba integration guide.
4. Map webhook → `VirtualAccount` via account number, Nomba account ID, or provider reference.
5. Update goal balance only after transaction is confirmed successful.
6. Retain failed/unmatched events for admin review.
