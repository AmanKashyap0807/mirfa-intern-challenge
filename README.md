# Mirfa Secure Transactions

Secure envelope-encryption demo built as a TurboRepo monorepo with Fastify API, Next.js frontend, and a shared crypto library using AES-256-GCM.

## Tech Stack
- Monorepo: TurboRepo + pnpm workspaces
- API: Fastify (Node.js) with MongoDB Atlas persistence
- Web: Next.js (React)
- Crypto: Node.js `crypto` (AES-256-GCM, envelope encryption)
- Tests: Vitest

## Project Structure
- apps/api – Fastify server exposing transaction endpoints
- apps/web – Next.js app consuming the API
- packages/crypto – Shared encryption library (AES-256-GCM), untouched by DB logic

## Environment Variables
### API (apps/api)
- MASTER_KEY – 64 hex chars (32 bytes) master key
- MONGODB_URI – MongoDB Atlas connection string
- MONGODB_DB_NAME – Database name (e.g., `mirfa_secure_tx`)

### Web (apps/web)
- NEXT_PUBLIC_API_BASE_URL – URL of the deployed API (e.g., https://mirfa-intern-challenge-api-wl5g.vercel.app)

## Setup
1) Install dependencies
```
pnpm install
```
2) Set environment variables (apps/api/.env is gitignored)
```
MASTER_KEY=<64_hex_chars>
MONGODB_URI=<atlas_connection_string>
MONGODB_DB_NAME=mirfa_secure_tx
```
3) Run tests
```
pnpm test
```
4) Run locally (API + Web)
```
pnpm dev
```

## Running Individually
- API only: `pnpm --filter api dev`
- Web only: `pnpm --filter web dev`

## Build
```
pnpm build
```

## Database Persistence
- Persistence is handled in apps/api using MongoDB Atlas via the official driver.
- Connection is lazily established and cached in `globalThis` for Vercel serverless friendliness.
- Repository pattern (`transaction.repository.ts`) keeps DB concerns isolated from routing and crypto logic.

## Deployment Notes
- Vercel build command: `pnpm build`
- API: uses serverless handler export in `apps/api/src/index.ts`; requires all API env vars in Vercel project settings.
- Web: deploy from `apps/web`, set `NEXT_PUBLIC_API_BASE_URL` to the deployed API URL.

## Loom
Record a short Loom showing: encrypt → fetch → decrypt roundtrip against the deployed API + web UI, and briefly explain the envelope encryption flow (master key wraps per-record DEKs).
