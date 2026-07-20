import { NextFunction, Request, Response } from "express";
import { UnitOfMeasure } from "../../../database/Entities/UnitOfMeasure";
import { CrudController } from "../../../shared/crud/controllers/CrudController";
import { ApiResponse } from "../../../shared/types/ApiResponse";
import { UnitOfMeasureDto } from "../type/unit-of-measure.type";
import { UnitOfMeasureService } from "../services/unit-of-measure.service";

export class UnitOfMeasureController extends CrudController<UnitOfMeasure, UnitOfMeasureDto, UnitOfMeasureDto> {
  constructor(service: UnitOfMeasureService) {
    super(service);
  }

  findAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await (this.service as UnitOfMeasureService).findAll({
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

export const unitOfMeasureController = new UnitOfMeasureController(new UnitOfMeasureService());
