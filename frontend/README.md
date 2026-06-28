# ThriveFund Frontend

Next.js dashboard for payment collection and reconciliation.

## Stack

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui
- Recharts

## Mock data mode

All data is mocked until July 1 hackathon build phase. No live Nomba integration.

```bash
NEXT_PUBLIC_USE_MOCK_DATA=true
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

## Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Demo flow

1. Landing → **View Demo Dashboard** or Login with seed credentials
2. Dashboard → review stats and reconciliation health
3. Campaigns → open campaign detail → mock virtual account + QR
4. Reconciliation → review matched/unmatched payments
5. Public page → `/c/greenfield-term-2-tuition`

## Routes

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/login` | Sign in |
| `/dashboard` | Organization dashboard |
| `/dashboard/organizations` | Manage organizations |
| `/dashboard/campaigns` | Payment campaigns |
| `/dashboard/campaigns/[id]` | Campaign detail |
| `/dashboard/virtual-accounts` | Virtual accounts |
| `/dashboard/transactions` | Transactions |
| `/dashboard/reconciliation` | Reconciliation dashboard |
| `/dashboard/contributors` | Members |
| `/dashboard/reports` | Reports |
| `/dashboard/invitations` | Invitations |
| `/admin` | Platform admin |
| `/c/[slug]` | Public campaign page |
| `/c/success` | Contribution receipt |

## API integration

See `lib/api/client.ts` for backend endpoint stubs. Replace mock imports with API calls when ready.
