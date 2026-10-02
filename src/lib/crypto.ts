import crypto from "crypto";

// AES-256-GCM encryption utility for platform OAuth tokens
// Key must be 32 bytes (256 bits). Uses process.env.ENCRYPTION_KEY or a secure fallback.
const ALGORITHM = "aes-256-gcm";
const SECRET_KEY = Buffer.from(
  (process.env.ENCRYPTION_KEY || "reviewmitra-aes-256-secure-key-32b!").padEnd(32, "0").slice(0, 32)
);

export interface EncryptedData {
  encryptedText: string;
  iv: string;
  authTag: string;
}

export function encryptToken(text: string): EncryptedData {
  const iv = crypto.randomBytes(12); // 96-bit IV recommended for GCM
  const cipher = crypto.createCipheriv(ALGORITHM, SECRET_KEY, iv);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag().toString("hex");

  return {
    encryptedText: encrypted,
    iv: iv.toString("hex"),
    authTag,
  };
}

export function decryptToken(encryptedText: string, ivHex: string, authTagHex: string): string {
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const decipher = crypto.createDecipheriv(ALGORITHM, SECRET_KEY, iv);

  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedText, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}
