# ThriveFund Frontend

Next.js dashboard for payment collection and reconciliation.

## Stack

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui
- Recharts

## API integration

The frontend is wired to the backend API. See **[INTEGRATION.md](./INTEGRATION.md)** for setup and endpoint mapping.

```bash
# frontend/.env.local
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api/v1
```

API client: `lib/api/client.ts` · Contract: `lib/api/contract.ts` · Hooks: `hooks/use-api.ts`

## Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## User Flow

1. Landing → sign in or create an account
2. Dashboard → review stats and reconciliation health
3. Campaigns → open campaign detail → virtual account + QR
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

See `lib/api/client.ts`, `lib/api/services.ts`, and `hooks/use-api.ts` for the active backend integration.
