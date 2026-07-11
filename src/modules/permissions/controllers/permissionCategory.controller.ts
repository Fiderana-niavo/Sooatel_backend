import { Request, Response } from "express";
import { PermissionCategory } from "../../../database/Entities/PermissionCategory";
import { CrudController } from "../../../shared/crud/controllers/CrudController";
import { ApiResponse } from "../../../shared/types/ApiResponse";
import { PermissionCategoryDto, PermissionCategorySearchOptions } from "../type/permission.type";
import { PermissionCategoryService } from "../services/permissionCategory.service";

export class PermissionCategoryController extends CrudController<
  PermissionCategory,
  PermissionCategoryDto,
  PermissionCategoryDto
> {
  constructor(service: PermissionCategoryService) {
    super(service);
  }

  findAll = async (req: Request, res: Response): Promise<void> => {
    try {
      console.log("QUERY PARAMS =>", req.query);

      const result = await (this.service as PermissionCategoryService).findAll({
        page: Number(req.query.page ?? 1),
        limit: Number(req.query.limit ?? 100),
        search: req.query.search as string | undefined,
        sortBy: req.query.sortBy as
          NonNullable<PermissionCategorySearchOptions["sortBy"]> | undefined,
        sortOrder: req.query.sortOrder as
          NonNullable<PermissionCategorySearchOptions["sortOrder"]> | undefined,
      });

      res.json(ApiResponse.success(result));
    } catch (err: unknown) {
      console.error(" findAll error:", err);
      if (err instanceof Error) {
        res.status(500).json(ApiResponse.error(err.message));
      } else {
        res.status(500).json(ApiResponse.error("Une erreur inconnue est survenue"));
      }
    }
  };
}

export const permissionCategoryController = new PermissionCategoryController(
  new PermissionCategoryService(),
);
