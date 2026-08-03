import { NextFunction, Request, Response } from "express";
import { CashMovementCategory } from "../../../../database/Entities/CashMovementCategory";
import { CrudController } from "../../../../shared/crud/controllers/CrudController";
import { ApiResponse } from "../../../../shared/types/ApiResponse";
import { CashMovementCategoryDto } from "../type/cash-movement-category.type";
import { CashMovementCategoryService } from "../services/cash-movement-category.service";

export class CashMovementCategoryController extends CrudController<CashMovementCategory, CashMovementCategoryDto, CashMovementCategoryDto> {
  constructor(service: CashMovementCategoryService) {
    super(service);
  }

  findAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await (this.service as CashMovementCategoryService).findAll({
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

export const cashMovementCategoryController = new CashMovementCategoryController(new CashMovementCategoryService());
