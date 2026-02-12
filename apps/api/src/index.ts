import "dotenv/config";

import cors from "@fastify/cors";
import fastify, { type FastifyInstance, type FastifyReply } from "fastify";

import { decryptPayload, encryptPayload, type TxSecureRecord } from "@mirfa/crypto";
import {
  createMongoTransactionRepository,
  type TransactionRepository,
} from "./repositories/transaction.repository.js";
import { ensureMongoEnv } from "./lib/mongo.js";

type ErrorResponse = { error: string };
type EncryptBody = { clientId: string; payload: unknown };
type DecryptResponse = { payload: unknown };

class AppError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    this.name = "AppError";
  }
}

function assertEncryptBody(body: unknown): EncryptBody {
  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    throw new AppError(400, "Body must be an object");
  }

  const { clientId, payload } = body as Record<string, unknown>;

  if (typeof clientId !== "string" || clientId.trim().length === 0) {
    throw new AppError(400, "clientId must be a non-empty string");
  }

  if (payload === null || typeof payload !== "object" || Array.isArray(payload)) {
    throw new AppError(400, "payload must be an object");
  }

  return { clientId: clientId.trim(), payload };
}

function handleError(reply: FastifyReply, error: unknown) {
  if (error instanceof AppError) {
    return reply.status(error.statusCode).send({ error: error.message } satisfies ErrorResponse);
  }

  if (error instanceof Error) {
    reply.log.error(error);
  }

  return reply.status(500).send({ error: "Internal server error" } satisfies ErrorResponse);
}

type AppDeps = {
  repository?: TransactionRepository;
};

// Application factory pattern allows dependency injection for better testing
// and clean separation of concerns.
export function createApp({ repository }: AppDeps = {}): {
  app: FastifyInstance;
  repository: TransactionRepository;
} {
  const app = fastify({ logger: true });
  const repo = repository ?? createMongoTransactionRepository();

  if (!repository) {
    ensureMongoEnv();
  }

  // CORS Configuration: In production, we restrict access deeply to prevent
  // unauthorized domains from invoking our API from the browser.
  const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? "http://localhost:3000")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  void app.register(cors, {
    origin: allowedOrigins,
    methods: ["GET", "POST", "OPTIONS"],
    credentials: false,
  });

  app.setErrorHandler((error, request, reply) => {
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({ error: error.message } satisfies ErrorResponse);
    }

    request.log.error(error);
    return reply.status(500).send({ error: "Internal server error" } satisfies ErrorResponse);
  });

  app.post<{
    Body: unknown;
    Reply: TxSecureRecord | ErrorResponse;
  }>("/tx/encrypt", async (request, reply) => {
    try {
      // Validate input strictly before passing to any crypto functions
      // to avoid potential denial-of-service or injection vectors.
      const { clientId, payload } = assertEncryptBody(request.body);
      const record = encryptPayload(clientId, payload);
      await repo.save(record);
      return reply.status(200).send(record);
    } catch (error) {
      return handleError(reply, error);
    }
  });

  app.get<{
    Reply: TxSecureRecord[] | ErrorResponse;
  }>("/tx/history", async (request, reply) => {
    try {
      const records = await repo.findAll(); // Assuming findAll exists in repo
      return reply.status(200).send(records);
    } catch (error) {
      return handleError(reply, error);
    }
  });

  app.get<{
    Params: { id: string };
    Reply: TxSecureRecord | ErrorResponse;
  }>("/tx/:id", async (request, reply) => {
    try {
      const record = await repo.findById(request.params.id);
      if (!record) {
        throw new AppError(404, "Record not found");
      }
      return reply.status(200).send(record);
    } catch (error) {
      return handleError(reply, error);
    }
  });

  app.post<{
    Params: { id: string };
    Reply: DecryptResponse | ErrorResponse;
  }>("/tx/:id/decrypt", async (request, reply) => {
    try {
      const record = await repo.findById(request.params.id);
      if (!record) {
        throw new AppError(404, "Record not found");
      }

      const payload = decryptPayload(record);
      return reply.status(200).send({ payload });
    } catch (error) {
      if (error instanceof Error) {
        return handleError(reply, new AppError(400, error.message));
      }
      return handleError(reply, error);
    }
  });

  app.get("/", async (request, reply) => {
    return reply.status(200).send({
      status: "ok",
      message: "Mirfa Secure Transactions API",
      endpoints: [
        "POST /tx/encrypt",
        "GET /tx/history",
        "GET /tx/:id",
        "POST /tx/:id/decrypt"
      ]
    });
  });

  return { app, repository: repo };
}

const port = Number(process.env.PORT) || 3001;
const host = process.env.HOST || "0.0.0.0";
const isTest = process.env.NODE_ENV === "test";

// Create app instance once (shared across invocations in serverless) unless tests
const defaultContext = isTest ? null : createApp();
const defaultApp = defaultContext?.app;

// Export default handler for Vercel serverless
export default async (req: any, res: any) => {
  const app = defaultApp ?? createApp().app;
  await app.ready();
  app.server.emit("request", req, res);
};

// For local development: listen on port if not Vercel
if (!isTest && !process.env.VERCEL && defaultApp) {
  defaultApp
    .listen({ port, host })
    .then(() => {
      defaultApp.log.info(`API ready at http://${host}:${port}`);
    })
    .catch((error) => {
      defaultApp.log.error(error);
      process.exit(1);
    });
}
