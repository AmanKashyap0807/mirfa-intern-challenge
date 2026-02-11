import { MongoClient, type Db } from "mongodb";

const MONGODB_URI_ENV = "MONGODB_URI";
const MONGODB_DB_NAME_ENV = "MONGODB_DB_NAME";

type MongoCache = {
  client?: MongoClient;
};

declare global {
  // eslint-disable-next-line no-var
  var __mongoCache: MongoCache | undefined;
}

const globalCache: MongoCache = globalThis.__mongoCache ?? {};
if (!globalThis.__mongoCache) {
  globalThis.__mongoCache = globalCache;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

async function connectClient(): Promise<MongoClient> {
  if (globalCache.client) {
    return globalCache.client;
  }

  const uri = requireEnv(MONGODB_URI_ENV);
  const client = new MongoClient(uri);

  try {
    await client.connect();
    globalCache.client = client;
    return client;
  } catch (error) {
    console.error("Failed to connect to MongoDB", error);
    await client.close().catch(() => undefined);
    throw new Error("Database connection failed");
  }
}

export async function getDb(): Promise<Db> {
  const client = await connectClient();
  const dbName = requireEnv(MONGODB_DB_NAME_ENV);
  return client.db(dbName);
}

export function ensureMongoEnv(): void {
  requireEnv(MONGODB_URI_ENV);
  requireEnv(MONGODB_DB_NAME_ENV);
}
