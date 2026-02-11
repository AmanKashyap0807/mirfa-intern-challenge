import { beforeEach, describe, expect, it } from "vitest";
import { encryptPayload, decryptPayload, type TxSecureRecord } from "./index";

const MASTER_KEY = "ab".repeat(32); // 32 bytes hex

beforeEach(() => {
  process.env.MASTER_KEY = MASTER_KEY;
});

function flipHexChar(value: string): string {
  const first = value[0];
  const replacement = first === "a" ? "b" : "a";
  return `${replacement}${value.slice(1)}`;
}

describe("envelope encryption", () => {
  it("encrypts and decrypts payloads (roundtrip)", () => {
    const payload = { hello: "world", amount: 42 };
    const record = encryptPayload("party-1", payload);

    const decrypted = decryptPayload(record);

    expect(decrypted).toEqual(payload);
    expect(record.alg).toBe("AES-256-GCM");
    expect(record.mk_version).toBe(1);
    expect(record.payload_nonce).toHaveLength(24);
    expect(record.payload_tag).toHaveLength(32);
  });

  it("rejects tampered ciphertext", () => {
    const record = encryptPayload("party-1", { value: "secure" });
    const tampered: TxSecureRecord = {
      ...record,
      payload_ct: flipHexChar(record.payload_ct),
    };

    expect(() => decryptPayload(tampered)).toThrow("Failed to decrypt payload");
  });

  it("rejects tampered authentication tag", () => {
    const record = encryptPayload("party-1", { value: "secure" });
    const tampered: TxSecureRecord = {
      ...record,
      payload_tag: flipHexChar(record.payload_tag),
    };

    expect(() => decryptPayload(tampered)).toThrow("Failed to decrypt payload");
  });

  it("rejects wrong nonce length", () => {
    const record = encryptPayload("party-1", { value: "secure" });
    const invalid: TxSecureRecord = {
      ...record,
      payload_nonce: "00", // 1 byte instead of 12
    };

    expect(() => decryptPayload(invalid)).toThrow("payload_nonce must be 12 bytes");
  });

  it("rejects invalid hex inputs", () => {
    const record = encryptPayload("party-1", { value: "secure" });
    const invalid: TxSecureRecord = {
      ...record,
      payload_ct: "zz", // not hex
    };

    expect(() => decryptPayload(invalid)).toThrow("payload_ct must be valid hex");
  });
});
