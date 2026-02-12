import { createCipheriv, createDecipheriv, randomBytes, randomUUID } from "crypto";

export type TxSecureRecord = {
  id: string;
  clientId: string;
  createdAt: string;

  payload_nonce: string;
  payload_ct: string;
  payload_tag: string;

  dek_wrap_nonce: string;
  dek_wrapped: string;
  dek_wrap_tag: string;

  alg: "AES-256-GCM";
  mk_version: 1;
};

const AES_ALG = "aes-256-gcm";
const MASTER_KEY_ENV = "MASTER_KEY";
const DEK_LENGTH_BYTES = 32;
const NONCE_LENGTH_BYTES = 12;
const TAG_LENGTH_BYTES = 16;
const HEX_REGEX = /^[0-9a-fA-F]+$/;

function requireMasterKey(): Buffer {
  const keyHex = process.env[MASTER_KEY_ENV];
  if (!keyHex) {
    throw new Error("MASTER_KEY environment variable is required");
  }
  if (!HEX_REGEX.test(keyHex) || keyHex.length !== DEK_LENGTH_BYTES * 2) {
    throw new Error("MASTER_KEY must be 32 bytes of hex (64 hex characters)");
  }
  return Buffer.from(keyHex, "hex");
}

function assertHex(value: string, field: string): void {
  if (!HEX_REGEX.test(value) || value.length % 2 !== 0) {
    throw new Error(`${field} must be valid hex`);
  }
}

function toBuffer(value: string, field: string): Buffer {
  assertHex(value, field);
  return Buffer.from(value, "hex");
}

function assertNonce(buf: Buffer, field: string): void {
  if (buf.length !== NONCE_LENGTH_BYTES) {
    throw new Error(`${field} must be ${NONCE_LENGTH_BYTES} bytes`);
  }
}

function assertTag(buf: Buffer, field: string): void {
  if (buf.length !== TAG_LENGTH_BYTES) {
    throw new Error(`${field} must be ${TAG_LENGTH_BYTES} bytes`);
  }
}

export function encryptPayload(clientId: string, payload: unknown): TxSecureRecord {
  const masterKey = requireMasterKey();

  const dek = randomBytes(DEK_LENGTH_BYTES);

  const payloadNonce = randomBytes(NONCE_LENGTH_BYTES);
  const payloadCipher = createCipheriv(AES_ALG, dek, payloadNonce);
  const payloadPlaintext = Buffer.from(JSON.stringify(payload), "utf8");
  const payloadCiphertext = Buffer.concat([
    payloadCipher.update(payloadPlaintext),
    payloadCipher.final(),
  ]);
  const payloadTag = payloadCipher.getAuthTag();

  const wrapNonce = randomBytes(NONCE_LENGTH_BYTES);
  const wrapCipher = createCipheriv(AES_ALG, masterKey, wrapNonce);
  const wrappedDek = Buffer.concat([wrapCipher.update(dek), wrapCipher.final()]);
  const wrapTag = wrapCipher.getAuthTag();

  return {
    id: randomUUID(),
    clientId,
    createdAt: new Date().toISOString(),

    payload_nonce: payloadNonce.toString("hex"),
    payload_ct: payloadCiphertext.toString("hex"),
    payload_tag: payloadTag.toString("hex"),

    dek_wrap_nonce: wrapNonce.toString("hex"),
    dek_wrapped: wrappedDek.toString("hex"),
    dek_wrap_tag: wrapTag.toString("hex"),

    alg: "AES-256-GCM",
    mk_version: 1,
  };
}

export function decryptPayload(record: TxSecureRecord): unknown {
  if (record.alg !== "AES-256-GCM") {
    throw new Error("Unsupported algorithm");
  }
  if (record.mk_version !== 1) {
    throw new Error("Unsupported master key version");
  }

  const masterKey = requireMasterKey();

  const dekWrapNonce = toBuffer(record.dek_wrap_nonce, "dek_wrap_nonce");
  const dekWrapTag = toBuffer(record.dek_wrap_tag, "dek_wrap_tag");
  const dekWrapped = toBuffer(record.dek_wrapped, "dek_wrapped");

  assertNonce(dekWrapNonce, "dek_wrap_nonce");
  assertTag(dekWrapTag, "dek_wrap_tag");

  let dek: Buffer;
  try {
    const wrapDecipher = createDecipheriv(AES_ALG, masterKey, dekWrapNonce);
    wrapDecipher.setAuthTag(dekWrapTag);
    dek = Buffer.concat([wrapDecipher.update(dekWrapped), wrapDecipher.final()]);
  } catch (error) {
    throw new Error("Failed to unwrap DEK");
  }

  const payloadNonce = toBuffer(record.payload_nonce, "payload_nonce");
  const payloadTag = toBuffer(record.payload_tag, "payload_tag");
  const payloadCiphertext = toBuffer(record.payload_ct, "payload_ct");

  assertNonce(payloadNonce, "payload_nonce");
  assertTag(payloadTag, "payload_tag");

  try {
    const payloadDecipher = createDecipheriv(AES_ALG, dek, payloadNonce);
    payloadDecipher.setAuthTag(payloadTag);
    const plaintext = Buffer.concat([
      payloadDecipher.update(payloadCiphertext),
      payloadDecipher.final(),
    ]);
    return JSON.parse(plaintext.toString("utf8"));
  } catch (error) {
    throw new Error("Failed to decrypt payload");
  }
}
