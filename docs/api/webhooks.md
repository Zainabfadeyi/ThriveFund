# Webhook Specification — Nomba

## Endpoint

```
POST /api/webhooks/nomba
```

| Property | Value |
|----------|-------|
| Auth | Nomba webhook signature |
| Content-Type | `application/json` |
| Idempotency | Required via `provider_reference` / transaction reference |

Expected Nomba headers:

| Header | Use |
|--------|-----|
| `nomba-signature` / `nomba-sig-value` | Base64 HMAC-SHA256 signature |
| `nomba-timestamp` | Timestamp included in signature payload |
| `nomba-signature-algorithm` | Expected `HmacSHA256` |

Signature verification hashes this colon-joined payload:

```
event_type:requestId:merchant.userId:merchant.walletId:transaction.transactionId:transaction.type:transaction.time:transaction.responseCode:nomba-timestamp
```

## Processing Rules

Per the architecture document, every webhook must follow this pipeline:

```
1. Receive POST
2. Validate signature/secret
3. Store raw payload → WebhookEvent (processed=false)
4. Check idempotency (provider_reference)
5. Acknowledge non-payment payout events after storing them
6. Map payment_success to VirtualAccount
7. Create/update Transaction
8. Update Goal.current_amount (if successful)
9. Mark WebhookEvent processed=true
10. Trigger notification (optional)
11. Return 200 OK
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

## Example Payload

```json
{
  "event_type": "payment_success",
  "requestId": "49e11b44-909b-4f83-82b4-9a83aXXXXXX",
  "data": {
    "merchant": {
      "walletId": "693e907aad9ea59616XXXX",
      "walletBalance": 539.4,
      "userId": "613bb620-c8e5-45f6-9c00-XXXXXXXX"
    },
    "terminal": {},
    "transaction": {
      "aliasAccountNumber": "967913XXXX",
      "fee": 0.6,
      "sessionId": "1000042602061021531516XXXXXX",
      "type": "vact_transfer",
      "transactionId": "API-VACT_TRA-613BB-eeae578a-cdd4-459c-8bd5-XXXXXX",
      "aliasAccountName": "ThriveFund/Campaign",
      "responseCode": "",
      "originatingFrom": "api",
      "transactionAmount": 120,
      "narration": "Transfer from JOHN GRASS",
      "time": "2026-02-06T10:21:56Z",
      "aliasAccountReference": "TF-goal-reference",
      "aliasAccountType": "VIRTUAL"
    },
    "customer": {
      "bankCode": "305",
      "senderName": "JOHN GRASS",
      "bankName": "Paycom (Opay)",
      "accountNumber": "81689XXXX"
    }
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
