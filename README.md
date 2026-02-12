# Mirfa Secure Transactions

Secure envelope-encryption demo built as a TurboRepo monorepo with Fastify API, Next.js frontend, and a shared crypto library using AES-256-GCM.

## Tech Stack
- Monorepo: TurboRepo + pnpm workspaces
- API: Fastify (Node.js) with MongoDB Atlas DB persistence
- Web: Next.js (React), typescript
- Crypto: Node.js `crypto` (AES-256-GCM, envelope encryption)
- Tests: Vitest

## Project Structure
- apps/api – Fastify server for encryption
- apps/web – Next.js app 
- packages/crypto – encryption library made of Node.js `crypto` (AES-256-GCM)
- docs - Documentation

## Environment Variables
### API (apps/api)
- MASTER_KEY – 64 hex chars (32 bytes) master key
- MONGODB_URI – MongoDB Atlas connection string
- MONGODB_DB_NAME – Database name (e.g., `mirfa_secure_tx`)
- ALLOWED_ORIGINS - Default set for local

### Web (apps/web)
-  URL of the deployed API
  
## Online Access to deployed website 
[Secure envelope-encryption demo](https://mirfa-intern-challenge-web.vercel.app/)

## Local Setup
1) Install dependencies
```
pnpm install
```
2) Set environment variables

    apps/api/.env
```
MASTER_KEY=<64_hex_chars>
MONGODB_URI=<atlas_connection_string>
MONGODB_DB_NAME=mirfa_secure_tx
```
1) Run tests
```
pnpm test
```
1) Run locally (API + Web)
```
pnpm dev
```

## Loom Videos
[Youtube Link](https://youtu.be/B_iF9VZfk8o)


***Check docs/ for detailed documentation***