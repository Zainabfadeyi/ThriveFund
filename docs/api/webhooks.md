# Webhook Specification — Nomba

## Endpoint

```
POST /api/webhooks/nomba
```

| Property | Value |
|----------|-------|
| Auth | Nomba webhook signature (header per Nomba docs) |
| Content-Type | `application/json` |
| Idempotency | Required via `provider_reference` / transaction reference |

> **Important:** Consult [Nomba API documentation](https://docs.nomba.com) during integration for exact header names, signature algorithm, and payload schema.

## Processing Rules

Per the architecture document, every webhook must follow this pipeline:

```
1. Receive POST
2. Validate signature/secret
3. Store raw payload → WebhookEvent (processed=false)
4. Check idempotency (provider_reference)
5. Map to VirtualAccount
6. Create/update Transaction
7. Update Goal.current_amount (if successful)
8. Mark WebhookEvent processed=true
9. Trigger notification (optional)
10. Return 200 OK
```

### Idempotency

- If `provider_reference` already exists on a `Transaction`, return `200` without creating a duplicate.
- Log duplicate attempts in `WebhookEvent` for audit.

### Status Mapping

| Nomba status | ThriveFund `Transaction.status` |
|--------------|--------------------------------|
| Success / completed | `successful` |
| Pending | `pending` |
| Failed | `failed` |

Unmatched webhooks (no virtual account found) remain in `WebhookEvent` with `processed=false` for admin review via `GET /api/v1/admin/reconciliation`.

## Example Payload (Illustrative)

```json
{
  "event": "payment.received",
  "data": {
    "account_number": "0123456789",
    "account_name": "ThriveFund / NYSC Relocation Fund",
    "amount": 50000,
    "currency": "NGN",
    "payer_name": "Babatunde Adeyemi",
    "reference": "REF-2401230001",
    "provider_reference": "NOMBA-TXN-abc123",
    "status": "successful",
    "paid_at": "2024-01-23T14:32:00Z",
    "bank_name": "First Bank"
  }
}
```

## Response

| Status | Body | When |
|--------|------|------|
| `200` | `{ "received": true }` | Processed or duplicate (idempotent) |
| `400` | `{ "error": "invalid_payload" }` | Malformed JSON |
| `401` | `{ "error": "invalid_signature" }` | Signature validation failed |
| `500` | `{ "error": "processing_failed" }` | Stored for retry; Nomba may resend |

## Admin Retry

Failed processing can be retried:

```
POST /api/v1/admin/webhook-events/{id}/retry
Authorization: Bearer <admin_token>
```

## Security Checklist

- [ ] Validate Nomba webhook signature on every request
- [ ] Store raw payload before business logic
- [ ] Never update goal balance on failed/pending events
- [ ] Rate-limit webhook endpoint
- [ ] Log all unmatched account numbers for reconciliation dashboard
