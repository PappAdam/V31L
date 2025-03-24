import * as crypto from "crypto";

const AUTH_LENGHT = 16;

export type EncryptedData = {
  encrypted: Uint8Array;
  iv: Uint8Array;
  authTag: Uint8Array;
};

export const PRIVATE_KEY = crypto.createSecretKey(
  process.env.PRIVATE_KEY as string,
  "utf8"
);

export function encryptData(
  data: crypto.BinaryLike,
  key?: crypto.KeyLike
): EncryptedData {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(
    "chacha20-poly1305",
    key ? key : PRIVATE_KEY,
    iv,
    {
      authTagLength: AUTH_LENGHT,
    }
  );

  const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return { encrypted, iv, authTag };
}

export function decryptData(
  encryptedData: EncryptedData,
  key?: crypto.KeyLike
) {
  const decipher = crypto.createDecipheriv(
    "chacha20-poly1305",
    key ? key : PRIVATE_KEY,

    encryptedData.iv,
    {
      authTagLength: AUTH_LENGHT,
    }
  );

  decipher.setAuthTag(encryptedData.authTag);
  const decrypted = Buffer.concat([
    decipher.update(encryptedData.encrypted),
    decipher.final(),
  ]);

  return decrypted;
}
