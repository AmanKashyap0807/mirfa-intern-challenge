# 08. Local Development

## Getting Started

You need Node 20+ and pnpm.

1.  **Install**: `pnpm install`
2.  **Environment**:
    You need a `.env` file in `apps/api/.env`.
    ```bash
    MONGODB_URI=mongodb://localhost:27017
    MONGODB_DB_NAME=mirfa_local
    # Generate this! Don't use a short string.
    MASTER_KEY=0000000000000000000000000000000000000000000000000000000000000000
    ```
    *Tip*: You can generate a valid key with:
    `node -e "console.log(crypto.randomBytes(32).toString('hex'))"`

3.  **Run**: `pnpm dev`
    *   This fires up the Turbo pipeline.
    *   API: `http://localhost:3001`
    *   Web: `http://localhost:3000`

## Debugging

If you see `Error: MASTER_KEY must be 32 bytes`, you provided a short string. The logic in `packages/crypto` is strict about this. It *must* be 64 hex characters. I purposely added this check to prevent weak keys.

## Tests
I added a full integration test suite in `apps/api/src/index.test.ts`.
Run it with: `pnpm test`
*   Note: It uses an `InMemoryTransactionRepository`. It mocks the database so you don't need Mongo running to check logic.
