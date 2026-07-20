import { NextFunction, Request, Response } from "express";
import { Permission } from "../../../database/Entities/Permission";
import { CrudController } from "../../../shared/crud/controllers/CrudController";
import { ApiResponse } from "../../../shared/types/ApiResponse";
import { PermissionDto, PermissionSearchOptions } from "../type/permission.type";
import { PermissionService } from "../services/permission.service";

export class PermissionController extends CrudController<Permission, PermissionDto, PermissionDto> {
  constructor(service: PermissionService) {
    super(service);
  }

  findAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await (this.service as PermissionService).findAll({
        page: Number(req.query.page ?? 1),
        limit: Number(req.query.limit ?? 10),
        search: req.query.search as string | undefined,
        idCategory: req.query.idCategory as string | undefined,
        sortBy: req.query.sortBy as NonNullable<PermissionSearchOptions["sortBy"]> | undefined,
        sortOrder: req.query.sortOrder as
          NonNullable<PermissionSearchOptions["sortOrder"]> | undefined,
      });

      res.json(ApiResponse.success(result));
    } catch (err: unknown) {
      next(err);
    }
  };
}

export const permissionController = new PermissionController(new PermissionService());
