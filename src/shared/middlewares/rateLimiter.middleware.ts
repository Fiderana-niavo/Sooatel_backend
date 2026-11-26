import { Request, Response, NextFunction } from "express";
import { TooManyRequestsError } from "../errors/AppError";

interface ClientRecord {
  timestamps: number[];
}

const BURST_LIMIT = 5;
const BURST_WINDOW = 5 * 60 * 1000; // 5 minutes

const TOTAL_LIMIT = 15;
const TOTAL_WINDOW = 30 * 60 * 1000; // 30 minutes

const attempts = new Map<string, ClientRecord>();

// Cleanup stale records periodically every 10 minutes
setInterval(() => {
  const cutoff = Date.now() - TOTAL_WINDOW;
  for (const [key, record] of attempts.entries()) {
    const fresh = record.timestamps.filter((time) => time > cutoff);
    if (fresh.length === 0) {
      attempts.delete(key);
    } else {
      record.timestamps = fresh;
    }
  }
}, 10 * 60 * 1000);

/**
 * Login rate limiter:
 * - Tier 1: Max 5 attempts per 5 minutes
 * - Tier 2: Max 15 attempts per 30 minutes
 */
export const loginLimiter = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  const forwarded = req.headers["x-forwarded-for"];
  const rawIp = typeof forwarded === "string" ? forwarded.split(",")[0] : undefined;
  const ip = rawIp ? rawIp.trim() : req.ip || "unknown";

  const body = req.body as { username?: string } | undefined;
  const username = body?.username?.trim();
  const key = username ? `${ip}:${username}` : ip;

  const now = Date.now();
  const record = attempts.get(key) ?? { timestamps: [] };

  // Retain only timestamps from the last 30 minutes
  const recent = record.timestamps.filter((time) => time > now - TOTAL_WINDOW);

  // Check 30-minute limit (15 attempts)
  if (recent.length >= TOTAL_LIMIT) {
    const oldest = recent[0] ?? now;
    const remaining = Math.max(1, Math.ceil((oldest + TOTAL_WINDOW - now) / 60000));
    return next(
      new TooManyRequestsError(
        `Limite de 15 tentatives de connexion atteinte. Veuillez réessayer dans ${remaining} minute(s).`,
      ),
    );
  }

  // Check 5-minute limit (5 attempts)
  const burstRecent = recent.filter((time) => time > now - BURST_WINDOW);
  if (burstRecent.length >= BURST_LIMIT) {
    const burstOldest = burstRecent[0] ?? now;
    const remaining = Math.max(1, Math.ceil((burstOldest + BURST_WINDOW - now) / 60000));
    return next(
      new TooManyRequestsError(
        `Trop de tentatives de connexion (5 essais). Veuillez patienter ${remaining} minute(s).`,
      ),
    );
  }

  recent.push(now);
  record.timestamps = recent;
  attempts.set(key, record);

  next();
};
