import { Request, Response, NextFunction } from "express";
import { ForbiddenError } from "../errors/AppError";
import { getUserPermissions } from "../services/UserPermissionCache";

/**
 * Authorization middleware factory.
 * Must be placed AFTER authMiddleware in the route chain.
 *
 * Checks the in-memory permission cache (with DB fallback) to verify
 * the authenticated user holds the required permission.
 *
 * Returns 403 Forbidden if the permission is not present.
 *
 * Usage:
 *   router.delete("/:id", authMiddleware, authorize("employee.delete"), controller.delete);
 */
export const authorize =
  (permission: string) =>
  async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const permissions = await getUserPermissions(req.userId);

      if (!permissions.includes(permission)) {
        return next(
          new ForbiddenError(
            `Access denied: missing permission "${permission}".`,
          ),
        );
      }

      next();
    } catch (err) {
      next(err);
    }
  };
