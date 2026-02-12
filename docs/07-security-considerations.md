# 07. Security Considerations

## The Threat Model
I assumed the following scenario: **"An attacker has full read-access to our MongoDB Atlas cluster."**

Because of our design, this attacker gets **nothing**. They see:
1.  Garbage ciphertext.
2.  Wrapped keys (which they can't unwrap without the Master Key).
3.  Metadata (Client IDs, timestamps).

**Leak**: They *do* see who is sending money/data (`clientId`) and when.
*   *Tradeoff*: I chose not to encrypt the `clientId`. If I encrypted it, we couldn't query "Show me history for Client A". We'd have to decrypt *everything* to filter.

## CORS
I configured `@fastify/cors` to allow `localhost:3000` by default.
The code explicitly reads `process.env.ALLOWED_ORIGINS`. In the deployment instructions, I emphasize setting this to the real Vercel domain.

## Input Validation
I implemented `assertEncryptBody` in `apps/api/src/index.ts`.
*   It rejects purely empty strings.
*   It rejects non-object payloads.
*   This prevents "Garbage In, Garbage Out" and potential DoS attacks where someone sends a 500MB string to try and choke the encryption CPU.
