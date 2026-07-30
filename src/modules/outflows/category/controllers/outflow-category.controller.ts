import { NextFunction, Request, Response } from "express";
import { OutflowCategory } from "../../../../database/Entities/OutflowCategory";
import { CrudController } from "../../../../shared/crud/controllers/CrudController";
import { ApiResponse } from "../../../../shared/types/ApiResponse";
import { OutflowCategoryDto } from "../type/outflow-category.type";
import { OutflowCategoryService } from "../services/outflow-category.service";

export class OutflowCategoryController extends CrudController<OutflowCategory, OutflowCategoryDto, OutflowCategoryDto> {
  constructor(service: OutflowCategoryService) {
    super(service);
  }

  findAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await (this.service as OutflowCategoryService).findAll({
        page: Number(req.query.page ?? 1),
        limit: Number(req.query.limit ?? 10),
        search: req.query.search as string | undefined,
      });

      res.json(ApiResponse.success(result));
    } catch (err: unknown) {
      next(err);
    }
  };
}

export const outflowCategoryController = new OutflowCategoryController(new OutflowCategoryService());
