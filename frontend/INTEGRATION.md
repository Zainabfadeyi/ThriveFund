# Frontend Backend Integration

The frontend is connected to the production API contract used by the ThriveFund dashboard, public campaign pages, and admin console.

## API Base

```env
NEXT_PUBLIC_API_BASE_URL=https://api.thrivefund.live/api/v1
```

Local development uses:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api/v1
```

## Connected Areas

| Area | Backend coverage |
|------|------------------|
| Auth | Login, signup, refresh, logout, email verification |
| Dashboard | Bootstrap overview, campaign stats, analytics, notifications |
| Campaigns | Create, list, detail overview, close, export, share link |
| Virtual accounts | Campaign account provisioning, active account lookup, public account display |
| Payments | Payment activity, transaction filters, payment proof PDF download |
| Contributors | Manual contributors, auto-detected contributors, contribution summaries |
| Invitations | Contributor invites, reminders, invitation overview |
| Reports | Financial summaries, campaign CSV/PDF exports, transaction exports |
| Payouts | Payout account verification, withdrawal availability, payout requests, payout history |
| Public pages | Campaign details, progress, virtual account details, recent payment activity |
| Admin | Overview, users, organizations, campaigns, payments, payouts, webhooks, reconciliation, Nomba sync |

## Payment Flow

```text
Campaign created
  -> Nomba virtual account provisioned
  -> Contributor sends bank transfer
  -> Nomba webhook received
  -> Payment verified and reconciled
  -> Transaction recorded
  -> Contributor summary updated
  -> Reports and proof PDFs available
  -> Payout requested to verified bank account
```

## Runtime Behavior

- Auth tokens are stored in localStorage and refreshed through the backend refresh endpoint.
- React Query powers dashboard caching, polling, and mutation invalidation.
- Public campaign pages stop polling after completion.
- Completed or inactive campaigns hide payment account details from public pages.
- Admin webhook retries and Nomba sync provide recovery paths for reconciliation issues.
