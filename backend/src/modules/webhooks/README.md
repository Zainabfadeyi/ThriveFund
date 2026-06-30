# Webhooks Module

Receives and validates payment webhook events. **Does not** create transactions directly — delegates to payments and reconciliation modules.

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/webhooks/nomba` | Signature | Receive Nomba payment webhook |

## Processing Pipeline

1. Validate signature (via PaymentProvider)
2. Store raw payload in `webhook_events`
3. Idempotency check on `provider_reference`
4. Call `paymentsService.ingestFromWebhook()`
5. Call `reconciliationService.reconcilePayment()`

## Webhook Event Statuses

`received`, `processed`, `failed`, `duplicate`
