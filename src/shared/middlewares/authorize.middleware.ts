import { Request, Response, NextFunction } from "express";
import { ForbiddenError } from "../errors/AppError";
import { checkPermission } from "../permissions/permission.checker";


export const authorize =
  (permission: string) =>
    async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
      try {
        const granted = await checkPermission(req.userId, permission);

        if (!granted) {
          return next(new ForbiddenError(`Access denied: missing permission "${permission}".`));
        }

        next();
      } catch (err) {
        next(err);
      }
    };
