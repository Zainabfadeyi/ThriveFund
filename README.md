# ThriveFund

ThriveFund is a live payment collection and reconciliation platform for Nigerian organizers. It gives each campaign a dedicated Nomba virtual account, reconciles incoming bank transfers automatically, tracks contributors, produces audit-ready reports, and supports payout to verified organizer bank accounts.

## Live Project

- App: https://thrivefund.live
- API: https://api.thrivefund.live/api/v1/health

---

## What It Does

- Organizer signup with automatic organization creation and email verification.
- Campaign collections with dedicated Nomba virtual accounts per campaign.
- Public campaign pages with account details, progress bar, and live payment activity.
- Nomba webhook verification, idempotent reconciliation, and transaction recording.
- Auto-detected contributors from successful uninvited payer names.
- Contributor rollups where repeat payments count once as a payer and sum total contribution.
- Expected-payer tracking with outstanding balance calculation and invitation emails.
- Campaign CSV/PDF exports and per-payment proof PDFs.
- Verified payout accounts with withdrawal timeline: Collected → Settled → Requested → Paid out.
- Admin recovery tools: webhook health, reconciliation retry, and Nomba sync.

---

## Infrastructure & Services

| Layer | Service | Purpose |
|---|---|---|
| **Frontend hosting** | Cloudflare Workers (Static Assets) | Serves the Next.js static export globally via CDN |
| **Backend hosting** | AWS EC2 (Amazon Linux 2023) | Runs the Node.js API server managed by PM2 |
| **Database** | AWS RDS (MySQL 8) | Persistent relational store for all platform data |
| **Domain** | GoDaddy | `thrivefund.live` and `api.thrivefund.live` DNS management |
| **Email** | Brevo (Sendinblue) | Transactional emails — verification, payment receipts, invitations |
| **Payments** | Nomba | Virtual accounts, webhook events, bank lookup, and bank transfers |
| **CI/CD** | GitHub Actions | Type-check, test, build, and deploy on every push to `main` |

---

## Architecture

```
                         ┌─────────────────────────────────────────────────┐
                         │               Contributor (Public)               │
                         └───────────────────────┬─────────────────────────┘
                                                 │ bank transfer
                                                 ▼
                         ┌─────────────────────────────────────────────────┐
                         │         Nomba Virtual Account (per campaign)     │
                         └───────────────────────┬─────────────────────────┘
                                                 │ webhook event
                                                 ▼
┌──────────────┐         ┌─────────────────────────────────────────────────┐
│  GoDaddy DNS │────────▶│          AWS EC2  —  Node.js API (PM2)          │
│  thrivefund  │         │                                                  │
│    .live     │         │  ┌─────────────┐   ┌──────────────────────────┐ │
└──────────────┘         │  │ Reconcile   │──▶│  AWS RDS  MySQL 8        │ │
                         │  │ & Record    │   │  goals · transactions    │ │
┌──────────────┐         │  └─────────────┘   │  contributors · payouts  │ │
│  Cloudflare  │         │  ┌─────────────┐   └──────────────────────────┘ │
│  Workers     │────────▶│  │ Brevo Email │                                 │
│  (frontend)  │         │  │ receipts /  │                                 │
└──────────────┘         │  │ invitations │                                 │
                         │  └─────────────┘                                 │
                         └─────────────────────────────────────────────────┘
                                                 │
                         ┌───────────────────────▼─────────────────────────┐
                         │      Organizer Dashboard  (Next.js 15 on        │
                         │      Cloudflare Workers static export)           │
                         │  campaigns · contributors · reports · payouts    │
                         └─────────────────────────────────────────────────┘
```

### Payment Reconciliation Flow

```
Contributor pays → Nomba virtual account
  → Nomba fires webhook → EC2 API verifies signature
    → Reconciliation service matches payment to goal
      → Transaction recorded → Campaign balance updated
        → Contributor auto-detected → Email receipt sent (Brevo)
          → Campaign marks complete when target reached
            → Organizer requests payout → Nomba bank transfer
```

---

## Project Structure

```
ThriveFund/
├── frontend/                        # Next.js 15 static export → Cloudflare Workers
│   ├── app/
│   │   ├── (public)/                # Public campaign pages
│   │   ├── dashboard/               # Organizer dashboard (campaigns, reports, payouts)
│   │   ├── admin/                   # Admin panel
│   │   ├── login/                   # Login with demo credential helper
│   │   ├── signup/                  # Signup with org creation
│   │   ├── check-email/             # Post-signup email confirmation prompt
│   │   └── verify-email/            # Email verification token handler
│   ├── components/
│   │   ├── ui/                      # Shadcn/ui primitives
│   │   └── shared/                  # Logo, nav, layout components
│   ├── contexts/                    # Auth context (JWT token management)
│   ├── lib/api/                     # Typed API client and service methods
│   └── wrangler.toml                # Cloudflare Workers deployment config
│
├── backend/                         # Node.js + Express + TypeScript → AWS EC2
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/                # Registration, login, email verification, JWT
│   │   │   ├── goals/               # Campaign CRUD, lifecycle, exports
│   │   │   ├── contributors/        # Expected payers, invitations, outstanding tracking
│   │   │   ├── transactions/        # Payment records
│   │   │   ├── reconciliation/      # Webhook → payment → goal matching
│   │   │   ├── withdrawals/         # Payout request lifecycle
│   │   │   ├── virtual-accounts/    # Nomba virtual account management
│   │   │   ├── payout-accounts/     # Verified organizer bank accounts
│   │   │   ├── organizations/       # Multi-org support
│   │   │   ├── reports/             # Financial summary and reconciliation reports
│   │   │   ├── notifications/       # In-app notification feed
│   │   │   └── webhooks/            # Nomba webhook ingestion and retry
│   │   ├── providers/               # Nomba payment provider adapter
│   │   ├── lib/                     # Email (Brevo), PDF, audit log, realtime (WebSocket)
│   │   ├── jobs/                    # Background reconciliation jobs
│   │   └── config/                  # Database pool, environment validation
│   ├── database/
│   │   ├── schema.sql               # Full schema (idempotent CREATE TABLE IF NOT EXISTS)
│   │   ├── migrations/              # Incremental ALTER TABLE migrations
│   │   └── seed.sql                 # Demo seed data
│   └── tests/                       # Node built-in test runner — 146 tests
│
├── .github/
│   └── workflows/
│       ├── backend.yml              # Type-check → test → build → SSH deploy to EC2
│       └── deploy-frontend.yml      # Build → wrangler deploy to Cloudflare
│
└── docs/                            # Architecture, API, and webhook documentation
```

---

## Tech Stack

### Frontend
| | |
|---|---|
| **Framework** | Next.js 15 (App Router, static export) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS + Shadcn/ui |
| **Charts** | Recharts |
| **Icons** | Lucide React |
| **Hosting** | Cloudflare Workers |

### Backend
| | |
|---|---|
| **Runtime** | Node.js 20 |
| **Framework** | Express + TypeScript |
| **Database** | MySQL 8 (AWS RDS) |
| **Process manager** | PM2 on AWS EC2 |
| **Validation** | Zod |
| **Email** | Brevo (Sendinblue) transactional API |
| **Payments** | Nomba API (virtual accounts + payouts) |
| **PDF generation** | PDFKit |
| **WebSocket** | ws (real-time balance updates) |

---

## CI/CD

Every push to `main` triggers two independent GitHub Actions pipelines:

**Backend** (`backend.yml`):
1. `npm run type-check` — TypeScript strict mode
2. `npm test` — 146 unit tests (Node built-in runner)
3. `npm run build` — compile to `dist/`
4. SSH into EC2 → `git pull` → `npm ci` → `npm run migrate` → `npm run build` → `pm2 reload`

**Frontend** (`deploy-frontend.yml`):
1. `npm run build` — Next.js static export to `out/`
2. `npx wrangler deploy` — push to Cloudflare Workers

---

## Local Development

**Frontend:**
```bash
cd frontend
npm install
npm run dev          # http://localhost:3000
```

**Backend:**
```bash
cd backend
npm install
cp .env.example .env  # fill in DB credentials, Nomba keys, Brevo key
mysql -u root -p < database/schema.sql
mysql -u root -p < database/seed.sql
npm run dev           # http://localhost:3001
```

**Verify:**
```bash
cd backend
npm run type-check    # TypeScript check
npm test              # run all 146 tests
npm run build         # production build
```
