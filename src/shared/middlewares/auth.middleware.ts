import { Request, Response, NextFunction } from "express";
import { jwtVerify } from "jose";
import { UnauthorizedError } from "../errors/AppError";

const SECRET = new TextEncoder().encode(
  process.env["JWT_SECRET"] ?? "sooatel_secret_key",
);

// Extend Express Request to carry the authenticated user identity
declare global {
  namespace Express {
    interface Request {
      userId: string;
      username: string;
    }
  }
}

/**
 * Verifies the Bearer JWT from the Authorization header.
 * Attaches userId and username to the request object on success.
 * Returns 401 Unauthorized if the token is missing or invalid.
 */
export const authMiddleware = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const header = req.headers["authorization"];
    if (!header || !header.startsWith("Bearer ")) {
      return next(new UnauthorizedError("Authentication token is missing."));
    }

    const token = header.slice(7);
    const { payload } = await jwtVerify(token, SECRET);

    req.userId = payload["idUser"] as string;
    req.username = payload["username"] as string;

    next();
  } catch {
    next(new UnauthorizedError("Invalid or expired token."));
  }
};
