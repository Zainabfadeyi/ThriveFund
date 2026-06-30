# ThriveFund

Collect and reconcile organization payments through dedicated virtual accounts.

## Project Structure

```
ThriveFund/
├── docs/        # Architecture & API documentation
├── backend/     # Node.js + Express + TypeScript (modular monolith)
└── frontend/    # Next.js + TypeScript + Tailwind
```

## Documentation

See the [docs/](./docs/) folder for:

- [Architecture Overview](./docs/architecture-overview.md)
- [API Endpoints (full reference)](./docs/api/endpoints.md)
- [API Quick Reference](./docs/api/quick-reference.md)
- [Webhook Specification](./docs/api/webhooks.md)

## Getting Started

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Backend

```bash
cd backend
npm install
cp .env.example .env
mysql ... < database/schema.sql
mysql ... < database/seed.sql
npm run dev
```

API runs at [http://localhost:3001/api/v1](http://localhost:3001/api/v1).

See [backend/README.md](./backend/README.md) for backend setup and payment configuration.

## Build

```bash
cd frontend
npm run build
npm start
```

## Tech Stack

- Next.js 15 + React 19
- TypeScript
- Tailwind CSS
- Recharts
- Lucide React
