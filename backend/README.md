# ThriveFund Backend

Node.js + TypeScript + Express modular monolith for payment collection and reconciliation using **Dedicated Virtual Accounts**.

Live Nomba credentials are required for payment-provider operations.

## Stack

| Layer | Technology |
|-------|------------|
| Runtime | Node.js 20+ |
| Language | TypeScript |
| Framework | Express.js |
| Database | MySQL 8 (AWS RDS) |
| Email | Brevo |
| Auth | JWT |
| Deployment | AWS EC2 |

## Folder Structure

```
backend/
├── database/
│   ├── schema.sql          # Full schema
│   └── seed.sql            # Initial seed data
├── src/
│   ├── app.ts              # Express app + route mounting
│   ├── server.ts           # Entry point
│   ├── config/             # env, database
│   ├── lib/                # errors, response, email, audit
│   ├── middleware/         # auth, admin, error handler
│   ├── providers/
│   │   └── payment/        # PaymentProvider abstraction
│   │       ├── payment-provider.interface.ts
│   │       └── nomba.provider.ts
│   ├── shared/
│   │   ├── types/enums.ts
│   │   └── utils/pagination.ts
│   └── modules/              # Feature modules (see below)
└── ThriveFund.postman_collection.json
```

## Modules

Each module follows: `controller` · `service` · `repository` · `routes` · `validators` · `types` · `README.md`

| Module | Responsibility |
|--------|----------------|
| **auth** | Register, login, JWT, password reset |
| **users** | Profile, password, notification prefs |
| **organizations** | Schools, mosques, NGOs, businesses |
| **organization-members** | Team roles (owner, admin, treasurer, viewer) |
| **goals** | Campaigns / collection goals |
| **virtual-accounts** | Dedicated VA generation via PaymentProvider |
| **webhooks** | Receive + validate webhook events only |
| **payments** | Provider verification, payment records |
| **reconciliation** | Match payments → goals → transactions |
| **transactions** | Immutable payment records |
| **contributors** | Payer profiles |
| **invitations** | Brevo email invitations |
| **notifications** | In-app notifications |
| **analytics** | Dashboard stats and charts |
| **reports** | CSV exports, financial summaries |
| **community** | Community project listings |
| **public** | Public campaign pages |
| **content** | FAQs, categories, banks |
| **admin** | Platform admin dashboard |
| **audit-logs** | Security audit trail |
| **health** | Liveness / readiness probes |

## Payment Flow

```
Contributor transfer
       ↓
POST /api/webhooks/nomba
       ↓
webhooks module     → store webhook_events
       ↓
payments module     → PaymentProvider.verifyPayment() → payments table
       ↓
reconciliation      → match VA → goal → create transaction
       ↓
notifications       → in-app + Brevo email
```

## Environment Variables

```env
NODE_ENV=development
PORT=3001
DB_HOST=...
DB_PORT=3306
DB_USER=...
DB_PASS=...
DB_NAME=thrivefund
JWT_SECRET=...
JWT_REFRESH_SECRET=...
BREVO_API_KEY=...
BREVO_SENDER_EMAIL=...
FRONTEND_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3000

PAYMENT_PROVIDER=nomba
NOMBA_WEBHOOK_SECRET=...
NOMBA_ENVIRONMENT=sandbox
NOMBA_CLIENT_ID=...
NOMBA_PRIVATE_KEY=...
NOMBA_PARENT_ACCOUNT_ID=...
NOMBA_SUB_ACCOUNT_ID=...
NOMBA_VIRTUAL_ACCOUNT_SCOPE=sub_account
```

## Setup

```bash
cd backend
npm install
cp .env.example .env   # fill in values
mysql ... < database/schema.sql
mysql ... < database/seed.sql
npm run dev
```

## API Documentation

See [../docs/api/endpoints.md](../docs/api/endpoints.md)

## Nomba Integration

1. Use `NOMBA_ENVIRONMENT=sandbox` with TEST credentials, or `production` with LIVE credentials.
2. Authenticate with the parent account ID in `NOMBA_PARENT_ACCOUNT_ID`.
3. Use `NOMBA_VIRTUAL_ACCOUNT_SCOPE=sub_account` for `POST /v1/accounts/virtual/{subAccountId}` so collections settle into the configured sub-account.
4. Register webhook URL: `https://api.thrivefund.ng/api/webhooks/nomba`.
