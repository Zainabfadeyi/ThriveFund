# Payments Module

Handles payment verification via the **PaymentProvider** abstraction. Does not reconcile or create transactions — that is handled by the reconciliation module.

## Provider Abstraction

```
PaymentProvider (interface)
└── NombaProvider
```

Set `PAYMENT_PROVIDER=nomba` with the Nomba credentials for the target environment.

## Flow

1. Webhook module receives raw event → stores `webhook_events`
2. **Payments module** verifies payload via provider → stores `payments`
3. Reconciliation module matches payment → creates `transactions`

## Endpoints (Admin)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/payments` | List verified payments |
| GET | `/api/v1/payments/:id` | Payment detail |

## Statuses

`received`, `verified`, `rejected`, `duplicate`
