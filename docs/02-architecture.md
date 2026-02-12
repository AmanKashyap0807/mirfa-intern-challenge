# 02. Architecture

## The Monorepo
I structured this as a standard Turbo monorepo.

```text
├── apps/
│   ├── api/        # Fastify server
│   └── web/        # Next.js frontend
├── packages/
│   └── crypto/     # Shared logic
└── turbo.json
```

### The Build Pipeline
I set up `turbo.json` to handle the dependencies. The critical part is this:

```json
"build": {
  "dependsOn": ["^build"],
  "outputs": ["dist/**", ".next/**"]
}
```

This ensures that `packages/crypto` is compiled *before* `apps/api` tries to build. If I didn't do this, the API would fail complaining it can't find `@mirfa/crypto` definitions.

## Project Boundaries

### `packages/crypto`
This is where the math happens. I kept it extremely isolated. It doesn't know about MongoDB, it doesn't know about HTTP.
*   **Why?** If I want to swap the API framework later, or move to AWS Lambda functions without Fastify, this logical core remains untouched.
*   **File**: `packages/crypto/src/index.ts`

### `apps/api`
This is the "glue". It takes the raw HTTP request, validates that `clientId` is a string (so we don't pass garbage to the crypto functions), and handles the database connection.

### `apps/web`
I built the frontend to be "dumb". It doesn't know any encryption keys. It just POSTs JSON to the API.
*   **Tradeoff**: I considered doing client-side encryption. That would be *more* secure, but it would make "key recovery" impossible if the user lost their key. Given the requirements, server-side encryption with a managed Master Key was the pragmatic choice.
