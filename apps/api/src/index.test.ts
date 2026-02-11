import { beforeEach, describe, expect, it } from "vitest";
import type { TxSecureRecord } from "@mirfa/crypto";
import { createApp } from "./index.js";
import type { TransactionRepository } from "./repositories/transaction.repository";

const MASTER_KEY = "ab".repeat(32);

beforeEach(() => {
  process.env.MASTER_KEY = MASTER_KEY;
});

class InMemoryTransactionRepository implements TransactionRepository {
  private readonly records = new Map<string, TxSecureRecord>();

  async save(record: TxSecureRecord): Promise<void> {
    this.records.set(record.id, record);
  }

  async findById(id: string): Promise<TxSecureRecord | null> {
    return this.records.get(id) ?? null;
  }

  set(id: string, record: TxSecureRecord): void {
    this.records.set(id, record);
  }
}

function flipHexChar(value: string): string {
  const first = value[0];
  const replacement = first === "a" ? "b" : "a";
  return `${replacement}${value.slice(1)}`;
}

describe("API integration", () => {
  it("POST /tx/encrypt succeeds", async () => {
    const repository = new InMemoryTransactionRepository();
    const { app } = createApp({ repository });
    await app.ready();

    const res = await app.inject({
      method: "POST",
      url: "/tx/encrypt",
      payload: { partyId: "p1", payload: { foo: "bar" } },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json() as any;
    expect(body.id).toBeTruthy();
    expect(body.payload_nonce).toHaveLength(24);
    expect(body.payload_tag).toHaveLength(32);
  });

  it("GET /tx/:id returns stored record", async () => {
    const repository = new InMemoryTransactionRepository();
    const { app } = createApp({ repository });
    await app.ready();

    const created = await app.inject({
      method: "POST",
      url: "/tx/encrypt",
      payload: { partyId: "p1", payload: { foo: "bar" } },
    });
    const record = created.json() as any;

    const res = await app.inject({ method: "GET", url: `/tx/${record.id}` });
    expect(res.statusCode).toBe(200);
    expect((res.json() as any).id).toBe(record.id);
  });

  it("POST /tx/:id/decrypt returns payload", async () => {
    const repository = new InMemoryTransactionRepository();
    const { app } = createApp({ repository });
    await app.ready();

    const created = await app.inject({
      method: "POST",
      url: "/tx/encrypt",
      payload: { partyId: "p1", payload: { foo: "bar" } },
    });
    const record = created.json() as any;

    const res = await app.inject({ method: "POST", url: `/tx/${record.id}/decrypt` });
    expect(res.statusCode).toBe(200);
    expect((res.json() as any).payload).toEqual({ foo: "bar" });
  });

  it("GET /tx/:id returns 404 for missing id", async () => {
    const repository = new InMemoryTransactionRepository();
    const { app } = createApp({ repository });
    await app.ready();

    const res = await app.inject({ method: "GET", url: "/tx/nonexistent" });
    expect(res.statusCode).toBe(404);
  });

  it("Decrypt tampered record fails", async () => {
    const repository = new InMemoryTransactionRepository();
    const { app } = createApp({ repository });
    await app.ready();

    const created = await app.inject({
      method: "POST",
      url: "/tx/encrypt",
      payload: { partyId: "p1", payload: { foo: "bar" } },
    });
    const record = created.json() as any;

    repository.set(record.id, { ...record, payload_ct: flipHexChar(record.payload_ct) });

    const res = await app.inject({ method: "POST", url: `/tx/${record.id}/decrypt` });
    expect(res.statusCode).toBe(400);
  });

  it("Decrypt with wrong master key fails", async () => {
    const repository = new InMemoryTransactionRepository();
    const { app } = createApp({ repository });
    await app.ready();

    const created = await app.inject({
      method: "POST",
      url: "/tx/encrypt",
      payload: { partyId: "p1", payload: { foo: "bar" } },
    });
    const record = created.json() as any;

    process.env.MASTER_KEY = "cd".repeat(32); // wrong key

    const res = await app.inject({ method: "POST", url: `/tx/${record.id}/decrypt` });
    expect(res.statusCode).toBe(400);
  });
});
