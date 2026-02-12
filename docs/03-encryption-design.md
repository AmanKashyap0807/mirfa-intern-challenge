# 03. Encryption Design


The design philosophy here is simple: **If I paste the contents of the database onto Reddit, nobody should be able to read a single user message.**

## Why AES-256-GCM?
    I was researching on it and found there is another way CBC but still GCM is better
**GCM (Galois/Counter Mode)** over CBC.
*   **Reason**: CBC is malleable. If an attacker flips a bit in the ciphertext, it decrypts to garbage but *it still decrypts*. This can lead to Padding Oracle attacks.
*   **GCM**: It includes an authentication tag (`payload_tag`). If you flip *one bit* of the ciphertext, the decryption function in `packages/crypto/src/index.ts` will throw an error immediately because the tag verification fails.

## Key Management
This was the trickiest part to get right.

1.  **DEK (Data Encryption Key)**: I generate a fresh 32-byte key for *every* transaction using `crypto.randomBytes(32)`.
    *   *Why?* If I used one key for all users, and that key leaked, the entire database is toasted.
2.  **KEK (Key Encryption Key)**: The `MASTER_KEY` in `.env`.
    *   I wrap the DEK with the KEK.

## The Code
In `packages/crypto/src/index.ts`:

```typescript
// I deliberately force the master key check at runtime, not module load time.
// This prevents the app from silently starting with a bad configuration.
const masterKey = requireMasterKey();
```

I also enforce strict nonce sizes:
```typescript
const NONCE_LENGTH_BYTES = 12; // NIST recommended for GCM
```

## Security Tradeoff
The `MASTER_KEY` is a single point of failure. If an attacker gets access to the running container's environment variables, they can decrypt everything.
*   *Mitigation*: In a real production setup, I'd use AWS KMS or HashiCorp Vault to sign the DEKs, so the app *never* actually sees the Master Key plaintext. For this challenge, environment variables are the acceptable standard.
