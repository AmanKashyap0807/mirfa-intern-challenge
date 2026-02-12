## The Goal

This project is a secure transaction vault designed around a simple idea:
even if the database is completely compromised, no sensitive data should be readable.

To achieve this, the system implements Envelope Encryption using AES-256-GCM, ensuring that encrypted payloads and their encryption keys are handled separately and securely.

Rather than treating encryption as an afterthought, it is built into the core data flow of the application.

## What This System Does

At a high level:

The client submits structured transaction data.

The API encrypts the payload using a freshly generated Data Encryption Key (DEK).

The DEK is wrapped using a long-lived Master Key.

Only encrypted data and wrapped keys are persisted.

Decryption is only possible through the API with proper key access.

Plaintext is never stored — not in the database, not in logs, and not in history views.

## Tech Stack Choices
MongoDB

MongoDB was selected because the encrypted record (TxSecureRecord) is stored as a structured JSON object.

A relational schema would have introduced unnecessary rigidity for this structure. Since encrypted payloads are already opaque blobs, MongoDB’s flexible document model aligns naturally with the storage format.

Additionally, MongoDB Atlas integrates cleanly with Vercel deployments, which simplified production configuration