import { NextFunction, Request, Response } from "express";
import { ShiftType } from "../../../database/Entities/ShiftType";
import { CrudController } from "../../../shared/crud/controllers/CrudController";
import { ApiResponse } from "../../../shared/types/ApiResponse";
import { ShiftTypeDto } from "../type/shift-type.type";
import { ShiftTypeService } from "../services/shift-type.service";

export class ShiftTypeController extends CrudController<ShiftType, ShiftTypeDto, ShiftTypeDto> {
  constructor(service: ShiftTypeService) {
    super(service);
  }

  findAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await (this.service as ShiftTypeService).findAll({
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

export const shiftTypeController = new ShiftTypeController(new ShiftTypeService());
