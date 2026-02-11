"use client";

import { useMemo, useState } from "react";
import type { TxSecureRecord } from "@mirfa/crypto";

type ApiError = { error: string };

const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001";

export default function HomePage() {
  const [partyId, setPartyId] = useState("");
  const [payloadText, setPayloadText] = useState("{\n  \"message\": \"Hello\"\n}");
  const [recordId, setRecordId] = useState("");
  const [encryptedRecord, setEncryptedRecord] = useState<TxSecureRecord | null>(null);
  const [decryptedPayload, setDecryptedPayload] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const [encrypting, setEncrypting] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [decrypting, setDecrypting] = useState(false);

  const prettyEncryptedRecord = useMemo(
    () => (encryptedRecord ? JSON.stringify(encryptedRecord, null, 2) : ""),
    [encryptedRecord]
  );

  const prettyDecryptedPayload = useMemo(
    () => (decryptedPayload !== null ? JSON.stringify(decryptedPayload, null, 2) : ""),
    [decryptedPayload]
  );

  function parsePayload(): unknown {
    try {
      return JSON.parse(payloadText);
    } catch (err) {
      throw new Error("Payload must be valid JSON");
    }
  }

  function requireRecordId(): string {
    if (!recordId.trim()) {
      throw new Error("Record ID is required");
    }
    return recordId.trim();
  }

  async function handleEncrypt() {
    setError(null);
    setDecryptedPayload(null);
    setEncrypting(true);
    try {
      if (!partyId.trim()) {
        throw new Error("partyId is required");
      }
      const payload = parsePayload();

      const res = await fetch(`${apiBase}/tx/encrypt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ partyId: partyId.trim(), payload }),
      });

      const data = (await res.json()) as TxSecureRecord | ApiError;
      if (!res.ok) {
        throw new Error((data as ApiError).error ?? "Encryption failed");
      }

      setEncryptedRecord(data as TxSecureRecord);
      setRecordId((data as TxSecureRecord).id);
    } catch (err) {
      setEncryptedRecord(null);
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setEncrypting(false);
    }
  }

  async function handleFetch() {
    setError(null);
    setFetching(true);
    setDecryptedPayload(null);
    try {
      const id = requireRecordId();
      const res = await fetch(`${apiBase}/tx/${id}`);
      const data = (await res.json()) as TxSecureRecord | ApiError;
      if (!res.ok) {
        throw new Error((data as ApiError).error ?? "Fetch failed");
      }
      setEncryptedRecord(data as TxSecureRecord);
    } catch (err) {
      setEncryptedRecord(null);
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setFetching(false);
    }
  }

  async function handleDecrypt() {
    setError(null);
    setDecrypting(true);
    try {
      const id = requireRecordId();
      const res = await fetch(`${apiBase}/tx/${id}/decrypt`, { method: "POST" });
      const data = (await res.json()) as { payload?: unknown } & ApiError;
      if (!res.ok) {
        throw new Error(data.error ?? "Decrypt failed");
      }
      setDecryptedPayload(data.payload ?? null);
    } catch (err) {
      setDecryptedPayload(null);
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setDecrypting(false);
    }
  }

  return (
    <main className="page">
      <section className="card">
        <header className="card__header">
          <div>
            <p className="eyebrow">Mirfa Secure Transactions</p>
            <h1>Envelope Encryption Demo</h1>
          </div>
          <p className="hint">API base: {apiBase}</p>
        </header>

        <div className="grid">
          <div className="stack">
            <label className="label">Party ID</label>
            <input
              className="input"
              value={partyId}
              onChange={(e) => setPartyId(e.target.value)}
              placeholder="party-123"
            />

            <label className="label">Payload (JSON)</label>
            <textarea
              className="textarea"
              value={payloadText}
              onChange={(e) => setPayloadText(e.target.value)}
              rows={6}
            />

            <button className="button" onClick={handleEncrypt} disabled={encrypting}>
              {encrypting ? "Encrypting..." : "Encrypt & Save"}
            </button>
          </div>

          <div className="stack">
            <label className="label">Record ID</label>
            <input
              className="input"
              value={recordId}
              onChange={(e) => setRecordId(e.target.value)}
              placeholder="returned id"
            />

            <div className="row">
              <button className="button" onClick={handleFetch} disabled={fetching}>
                {fetching ? "Fetching..." : "Fetch"}
              </button>
              <button className="button" onClick={handleDecrypt} disabled={decrypting}>
                {decrypting ? "Decrypting..." : "Decrypt"}
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="alert alert--error">
            <strong>Error:</strong> {error}
          </div>
        )}

        <div className="columns">
          <div className="panel">
            <div className="panel__header">Encrypted Record</div>
            <pre className="code-block">{prettyEncryptedRecord || "—"}</pre>
          </div>
          <div className="panel">
            <div className="panel__header">Decrypted Payload</div>
            <pre className="code-block">{prettyDecryptedPayload || "—"}</pre>
          </div>
        </div>
      </section>
    </main>
  );
}
