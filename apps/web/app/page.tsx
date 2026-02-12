"use client";

import { useMemo, useState, useEffect } from "react";
import type { TxSecureRecord } from "@mirfa/crypto";

type ApiError = { error: string };

const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001";

// Helper for relative time (e.g., "2 mins ago")
function timeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " years ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " months ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " days ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " hours ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " mins ago";
  return Math.floor(seconds) + " seconds ago";
}

export default function HomePage() {
  const [clientId, setClientId] = useState("");
  const [payloadText, setPayloadText] = useState("{\n  \"message\": \"Hello\"\n}");
  const [recordId, setRecordId] = useState("");
  const [encryptedRecord, setEncryptedRecord] = useState<TxSecureRecord | null>(null);
  const [decryptedPayload, setDecryptedPayload] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<TxSecureRecord[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Fetch history on mount
  useEffect(() => {
    fetchHistory();
  }, []);

  async function fetchHistory() {
    try {
      const res = await fetch(`${apiBase}/tx/history`);
      const data = await res.json();
      if (res.ok) {
        setHistory(data);
      }
    } catch (err) {
      console.error("Failed to fetch history", err);
    }
  }

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

  async function handleEncrypt() {
    setError(null);
    setDecryptedPayload(null);
    setLoading(true);
    try {
      if (!clientId.trim()) {
        throw new Error("Client ID is required");
      }
      const payload = parsePayload();

      const res = await fetch(`${apiBase}/tx/encrypt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: clientId.trim(), payload }),
      });

      const data = (await res.json()) as TxSecureRecord | ApiError;
      if (!res.ok) {
        throw new Error((data as ApiError).error ?? "Encryption failed");
      }

      setEncryptedRecord(data as TxSecureRecord);
      setRecordId((data as TxSecureRecord).id);
      fetchHistory(); // Refresh history
    } catch (err) {
      setEncryptedRecord(null);
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  }

  async function handleFetch() {
    setError(null);
    setLoading(true);
    setDecryptedPayload(null);
    try {
      if (!recordId.trim()) throw new Error("Record ID is required");

      const res = await fetch(`${apiBase}/tx/${recordId.trim()}`);
      const data = (await res.json()) as TxSecureRecord | ApiError;
      if (!res.ok) {
        throw new Error((data as ApiError).error ?? "Fetch failed");
      }
      setEncryptedRecord(data as TxSecureRecord);
    } catch (err) {
      setEncryptedRecord(null);
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  }

  async function handleDecrypt() {
    setError(null);
    setLoading(true);
    try {
      if (!recordId.trim()) throw new Error("Record ID is required");

      const res = await fetch(`${apiBase}/tx/${recordId.trim()}/decrypt`, { method: "POST" });
      const data = (await res.json()) as { payload?: unknown } & ApiError;
      if (!res.ok) {
        throw new Error(data.error ?? "Decrypt failed");
      }
      setDecryptedPayload(data.payload ?? null);
    } catch (err) {
      setDecryptedPayload(null);
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
  }

  return (
    <div className="layout">
      {/* Sidebar */}
      <aside className={`sidebar ${!isSidebarOpen ? "closed" : ""}`}>
        <div className="sidebar-header">
          <h2 className="sidebar-title">Transaction History</h2>
          <p className="sidebar-helper">
            Recent encrypted transactions are listed below. Copy a Record ID to fetch and decrypt.
          </p>
        </div>
        <div className="history-list">
          {history.length === 0 && <div className="empty-state">No transactions yet</div>}
          {history.map((tx) => (
            <div key={tx.id} className="history-item">
              <div className="history-info">
                <span className="history-id" title={tx.id}>
                  {tx.id.substring(0, 8)}...
                </span>
                <span className="history-time">{timeAgo(tx.createdAt)}</span>
              </div>
              <button
                className="copy-btn"
                onClick={() => copyToClipboard(tx.id)}
                title="Copy Record ID"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
              </button>
            </div>
          ))}
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="header">
          <div className="header-left">
            <h1>Mirfa Secure Transactions Dashboard</h1>
            <p>Envelope Encryption Demo</p>
          </div>
          <div className="header-right">
            <button className="toggle-btn" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
              {isSidebarOpen ? "Hide History" : "Show History"}
            </button>
            <span className="badge">AES-256-GCM</span>
          </div>
        </header>

        <div className="content-body">
          {error && <div className="alert-info" style={{ borderColor: '#fca5a5', background: '#fef2f2', color: '#b91c1c' }}>{error}</div>}

          <div className="grid-cols-2">

            {/* Encryption Section */}
            <div className="card">
              <div className="stack">
                <label className="label">Client ID</label>
                <input
                  className="input"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  placeholder="e.g. client-001"
                />

                <label className="label">JSON Payload</label>
                <textarea
                  className="textarea"
                  value={payloadText}
                  onChange={(e) => setPayloadText(e.target.value)}
                  placeholder="{ ... }"
                />

                <div className="alert-info">
                  <strong>Security Note:</strong> Data is encrypted using AES-256-GCM with envelope key wrapping.
                </div>

                <button className="btn-primary" onClick={handleEncrypt} disabled={loading}>
                  {loading ? "Processing..." : "Encrypt & Save"}
                </button>
              </div>
            </div>

            {/* Decryption Section */}
            <div className="card">
              <div className="stack">
                <label className="label">Record ID</label>
                <input
                  className="input"
                  value={recordId}
                  onChange={(e) => setRecordId(e.target.value)}
                  placeholder="Paste Record ID here"
                />

                <div className="row">
                  <button className="btn-secondary" onClick={handleFetch} disabled={loading}>
                    Fetch
                  </button>
                  <button className="btn-secondary" onClick={handleDecrypt} disabled={loading}>
                    Decrypt
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Section: Encrypted vs Decrypted */}
          <div className="panels-container">
            <div className="panel">
              <div className="panel-header">Encrypted Record</div>
              <div className="panel-content">
                {prettyEncryptedRecord ? (
                  <pre className="code-block">{prettyEncryptedRecord}</pre>
                ) : (
                  <div className="empty-state">No record fetched</div>
                )}
              </div>
            </div>
            <div className="panel">
              <div className="panel-header">Decrypted Payload</div>
              <div className="panel-content">
                {prettyDecryptedPayload ? (
                  <pre className="code-block">{prettyDecryptedPayload}</pre>
                ) : (
                  <div className="empty-state">No payload decrypted</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
