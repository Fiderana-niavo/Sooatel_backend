import { Request, Response, NextFunction } from "express";
import { jwtVerify } from "jose";
import { UnauthorizedError } from "../errors/AppError";

const SECRET = new TextEncoder().encode(
  process.env["JWT_SECRET"] ?? "sooatel_secret_key",
);

import AppDataSource from "../../database/data-source";
import { User } from "../../database/Entities/User";

// Extend Express Request to carry the authenticated user identity
declare global {
  namespace Express {
    interface Request {
      userId: string;
      username: string;
      idEmployee: string;
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
    req.idEmployee = payload["idEmployee"] as string;

    // Check if the user is still active in the database
    // This immediately disconnects deactivated accounts
    if (req.userId) {
      const user = await AppDataSource.getRepository(User).findOne({
        where: { idUser: req.userId },
        relations: { employee: true },
      });

      if (!user || user.activeStatus === -1 || (user.employee && user.employee.activeStatus === -1)) {
        return next(new UnauthorizedError("Ce compte a été désactivé."));
      }
    }

    next();
  } catch {
    next(new UnauthorizedError("Invalid or expired token."));
  }
};
