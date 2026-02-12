import type { TxSecureRecord } from "@mirfa/crypto";
import { getDb } from "../lib/mongo.js";

// Repository Interface:
// Decouples the business logic (router/handlers) from the persistence layer.
// Allows us to easily swap databases (e.g., InMemory for tests, Mongo for prod).
export type TransactionRepository = {
  save(record: TxSecureRecord): Promise<void>;
  findById(id: string): Promise<TxSecureRecord | null>;
  findAll(): Promise<TxSecureRecord[]>;
};

const COLLECTION = "transactions";

async function save(record: TxSecureRecord): Promise<void> {
  const db = await getDb();
  await db.collection<TxSecureRecord>(COLLECTION).insertOne(record);
}

async function findById(id: string): Promise<TxSecureRecord | null> {
  const db = await getDb();
  const record = await db.collection<TxSecureRecord>(COLLECTION).findOne({ id });
  return record ?? null;
}

async function findAll(): Promise<TxSecureRecord[]> {
  const db = await getDb();
  return db
    .collection<TxSecureRecord>(COLLECTION)
    .find({})
    .sort({ createdAt: -1 })
    .toArray();
}

export function createMongoTransactionRepository(): TransactionRepository {
  return { save, findById, findAll };
}

export const mongoTransactionRepository = createMongoTransactionRepository();
