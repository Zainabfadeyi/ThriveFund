# Frontend ↔ Backend Integration

## Run locally

### Backend (port 3001)

```bash
cd backend
# Ensure MySQL database exists and is seeded
mysql -u root -e "CREATE DATABASE IF NOT EXISTS thrivefund;"
mysql -u root thrivefund < database/schema.sql
mysql -u root thrivefund < database/seed.sql

cp .env.example .env   # set DB_PASS= if no MySQL password
npm install
npm run dev
```

### Frontend (port 3000)

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

Open http://localhost:3000

## Seed accounts

All demo accounts use password **`DemoPass123!`**

| Role | Email | Password | Where to go |
|------|-------|----------|-------------|
| **Admin** | admin@thrivefund.ng | DemoPass123! | http://localhost:3000/admin |
| Organization owner | adebayo@thrivefund.ng | DemoPass123! | http://localhost:3000/dashboard |
| Organization owner | chidi@thrivefund.ng | DemoPass123! | http://localhost:3000/dashboard |
| Organization owner | fatima@thrivefund.ng | DemoPass123! | http://localhost:3000/dashboard |

Seed the database:

```bash
cd backend
npm run seed
# or manually:
mysql -u root thrivefund < database/seed.sql
```

After logging in as **admin@thrivefund.ng**, open **Platform Admin** in the sidebar or go directly to `/admin`. You can view users, organizations, campaigns, transactions, webhooks, and reconciliation.

## Environment variables

**Frontend** (`.env.local`):
```
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api/v1
```

**Backend** (`.env`):
```
CORS_ORIGIN=http://localhost:3000
FRONTEND_URL=http://localhost:3000
PAYMENT_PROVIDER=nomba
NOMBA_ACCOUNT_ID=...
NOMBA_SUB_ACCOUNT_ID=...
NOMBA_CLIENT_ID=...
NOMBA_PRIVATE_KEY=...
NOMBA_WEBHOOK_SECRET=...
```

## Connected frontend pages

| Page | Backend endpoints |
|------|-------------------|
| Login / Signup | POST /auth/login, POST /auth/register |
| Dashboard | GET /dashboard/overview, GET /reconciliation/overview, GET /analytics/monthly-contributions |
| Organizations | GET/POST /organizations |
| Campaigns | GET/POST /goals, GET /organizations |
| Campaign detail | GET /goals/:id, POST/GET /goals/:id/virtual-account, GET /goals/:id/transactions, GET /goals/:id/contributors, GET /goals/:id/share |
| Virtual Accounts | GET /virtual-accounts |
| Transactions | GET /transactions |
| Reconciliation | GET /reconciliation/overview, GET /reconciliation |
| Contributors | GET /contributors |
| Reports | GET /reports/financial-summary, GET /reports/transactions/export, GET /analytics/* |
| Invitations | GET /goals, GET /goals/:id/share, POST/GET /goals/:id/invitations |
| Analytics | GET /analytics/* |
| Notifications | GET /notifications, POST /notifications/read-all |
| Settings | GET/PATCH /users/me, PATCH /users/me/password |
| Admin | GET /admin/overview (admin role) |
| Public campaign | GET /public/goals/:slug, GET /public/goals/:slug/virtual-account |

## Payment Flows

- Campaign creation requires an organization, then sends `organization_id` to POST /goals
- Virtual account creation → Nomba (POST /goals/:id/virtual-account)
- Payment notifications → signed Nomba webhooks (POST /api/webhooks/nomba)
- Campaign close-out → Nomba transfer and virtual account expiry (POST /goals/:id/close-out)

## Missing backend endpoints (frontend gaps)

- Aggregated organization stats (campaigns count, volume) on org list
- Per-contributor outstanding balance tracking
- On-demand PDF report generation
- Global invitations list (must select a collection — uses GET /goals/:id/invitations)

## Validation Flow

1. Sign in as an organization owner
2. Create an organization, then create a campaign under it
3. Campaign detail → **Generate Virtual Account**
4. Configure the deployed webhook URL in the Nomba dashboard
5. Check Dashboard, Transactions, and Reconciliation after Nomba sends payment events

## Known issues

- Share links from API use `FRONTEND_URL/c/[slug]`; set `FRONTEND_URL` to the deployed frontend origin.
- Admin overview `total_organizations` may be undefined depending on admin repository
- Email invitations require valid Brevo API key in backend `.env`
- Rate limit: 100 requests / 15 min on backend

## API contract

See `frontend/lib/api/contract.ts` for full endpoint list.

Response format: `{ success: true, data: T, meta?: { page, per_page, total } }`  
Errors: `{ success: false, error: { code, message, details? } }`

Auth: `Authorization: Bearer <access_token>` — tokens stored in localStorage for local dev.
