import { configDotenv } from "dotenv";

configDotenv();

let secretBytes: Uint8Array | null = null;

/**
 * Returns encoded JWT secret key from environment variables.
 * Throws a critical error if JWT_SECRET is not configured.
 */
export function getJwtSecret(): Uint8Array {
  if (secretBytes) {
    return secretBytes;
  }

  const secret = process.env["JWT_SECRET"];
  if (!secret) {
    throw new Error(
      "CRITICAL SECURITY ERROR: JWT_SECRET environment variable is missing. The server cannot safely sign or verify tokens.",
    );
  }

  secretBytes = new TextEncoder().encode(secret);
  return secretBytes;
}
