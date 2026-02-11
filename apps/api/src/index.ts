import "dotenv/config";

import cors from "@fastify/cors";
import fastify, { type FastifyInstance, type FastifyReply } from "fastify";

import { decryptPayload, encryptPayload, type TxSecureRecord } from "@mirfa/crypto";

type ErrorResponse = { error: string };
type EncryptBody = { partyId: string; payload: unknown };
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

  const { partyId, payload } = body as Record<string, unknown>;

  if (typeof partyId !== "string" || partyId.trim().length === 0) {
    throw new AppError(400, "partyId must be a non-empty string");
  }

  if (payload === null || typeof payload !== "object" || Array.isArray(payload)) {
    throw new AppError(400, "payload must be an object");
  }

  return { partyId: partyId.trim(), payload };
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

export function createApp(): { app: FastifyInstance; records: Map<string, TxSecureRecord> } {
  const app = fastify({ logger: true });
  const records = new Map<string, TxSecureRecord>();

  void app.register(cors, { origin: true });

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
      const { partyId, payload } = assertEncryptBody(request.body);
      const record = encryptPayload(partyId, payload);
      records.set(record.id, record);
      return reply.status(200).send(record);
    } catch (error) {
      return handleError(reply, error);
    }
  });

  app.get<{
    Params: { id: string };
    Reply: TxSecureRecord | ErrorResponse;
  }>("/tx/:id", async (request, reply) => {
    try {
      const record = records.get(request.params.id);
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
      const record = records.get(request.params.id);
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

  return { app, records };
}

const port = Number(process.env.PORT) || 3001;
const host = process.env.HOST || "0.0.0.0";

// Create app instance once (shared across invocations in serverless)
const { app } = createApp();

// Export default handler for Vercel serverless
export default async (req: any, res: any) => {
  await app.ready();
  app.server.emit("request", req, res);
};

// For local development: listen on port if not Vercel
if (process.env.NODE_ENV !== "test" && !process.env.VERCEL) {
  app.listen({ port, host }).then(() => {
    app.log.info(`API ready at http://${host}:${port}`);
  }).catch((error) => {
    app.log.error(error);
    process.exit(1);
  });
}
