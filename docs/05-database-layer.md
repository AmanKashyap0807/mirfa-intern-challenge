# 05. Database Layer

## MongoDB
I'm using MongoDB with the native Node.js driver (wrapped in a simple helper in `apps/api/src/lib/mongo.ts`).

## The Schema
The documents in the `transactions` collection look like this:

```json
{
  "_id": "...",
  "clientId": "client-abc",
  "dek_wrapped": "deadbeef...", 
  "payload_ct": "cafebabe...",
  "payload_nonce": "..."
}
```

## Critical Decision: No Decrypted Data
I made a hard rule: **The database never stores plaintext.**
I also decided **not to store the DEK in plaintext**.

*   *Alternative Considered*: I could have just stored the DEK next to the ciphertext.
*   *Why I rejected it*: If I did that, the Encryption is useless. Anyone with DB access reads the key and the data. By wrapping the DEK with the environment-based `MASTER_KEY`, I enforcing that you need *both* the DB *and* the App Server to read data.

## Challenges
Authentication with Mongo locally vs. Atlas can be annoying. I set the connection string to be purely redundant (`env.MONGODB_URI`) so it works regardless of whether you have user/pass auth or just a local socket.
