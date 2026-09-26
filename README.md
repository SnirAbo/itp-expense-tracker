# ITP Expense Tracker Monorepo

A full-stack expense tracker built from Jira tasks (project ITP). Monorepo with pnpm workspaces containing:

- apps/api: NestJS + Prisma API
- apps/web: React + Vite frontend
- packages/ui: Shared UI components
- packages/config: Shared ESLint/TS configs

Includes:
- Docker Compose for local Postgres + API + optional pgAdmin
- GitHub Actions CI (lint, typecheck, unit, build, e2e)
- Testcontainers for API e2e
- OpenAPI generation and typed client
- Pino logging, request IDs, Helmet/CORS, rate limiting, Prometheus metrics
- Optional Redis caching for category totals

Quickstart

1) Prereqs
- Node 20+
- pnpm 9+
- Docker 24+

2) Install

pnpm install

3) Environment

cp .env.local.example .env.local
# Edit secrets as needed

4) Start dev (API + Web)

pnpm dev

API: http://localhost:3000
Web: http://localhost:5173

5) Local DB via Docker

# Starts Postgres, API and optional pgAdmin
docker compose up --build
# pgAdmin: http://localhost:5050 (see creds in .env.local)

6) Prisma

# Create DB schema locally
pnpm -F api prisma:migrate

# Seed demo data
pnpm -F api prisma:seed

7) CI locally (optional)

pnpm -w lint
pnpm -w typecheck
pnpm -w test
pnpm -w build

Workspaces

- Root scripts apply to all packages with -w or -r flags
- API-specific commands: pnpm -F api <script>
- Web-specific commands: pnpm -F web <script>

OpenAPI & Typed Client

- API emits OpenAPI spec during build (non-prod serves /docs)
- Generate typed client for web:

pnpm generate:openapi

Security

- JWT access + rotating refresh tokens in HttpOnly cookies
- Rate limiting on /auth/*
- Helmet, CORS allowlist, secure cookies

Observability

- JSON logs via pino (with requestId)
- /metrics Prometheus endpoint
- /healthz (and /ready) endpoints

Repository Tasks Coverage

Implements all ITP tasks including mono-repo setup, Docker, CI, Prisma schema, auth (signup/login/logout/refresh + rotation), rate limiting, CRUD for categories/expenses, filtered listing, reports, frontend pages for auth/categories/expenses/dashboard, accessibility pass foundations, analytics (Plausible), URL state sync, metrics, docs, and runbooks.

See apps/api and apps/web READMEs and code comments for details.

