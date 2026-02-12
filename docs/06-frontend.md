# 06. Frontend

## Code Structure
I kept it simple: `apps/web/app/page.tsx`.
I used a single component with `useState` logic.
*   *Tradeoff*: In a larger app, I'd split `<HistorySidebar>` and `<EncryptionForm>` into separate components. But for a single-view dashboard, creating 5 files just adds jumping-around complexity. I kept it colocated.

## Functional Decisions

### 1. The "Copy ID" Flow

Encrypted records appear in the history sidebar.

Each record includes a Copy ID button. Users must manually paste the ID into the decryption input.

This was intentional.

Decrypting a record is a sensitive operation. Making it a deliberate two-step action (Fetch → Decrypt) prevents accidental disclosure and reinforces that decryption is not automatic.

### 2. No Auto-Decrypt
The sidebar shows metadata only. I **do not** decrypt payloads in the list.
*   *Reason*: Performance and Security. Decrypting 50 items on page load would slam the CPU and network, and it would expose 50 secrets on the screen at once.

## Debugging UI State
I had a small issue where the sidebar wouldn't update immediately after encryption. I fixed this by triggering `fetchHistory()` explicitly in the `finally` block of `handleEncrypt`. Simple, but essential for the "snappy" feel.
