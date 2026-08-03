import { NextFunction, Request, Response } from "express";
import { CashMovement } from "../../../../database/Entities/CashMovement";
import { CrudController } from "../../../../shared/crud/controllers/CrudController";
import { ApiResponse } from "../../../../shared/types/ApiResponse";
import { cashMovementDto } from "../type/cash-movement.type";
import { CashMovementService } from "../services/cash-movement.service";

export class CashMovementController extends CrudController<CashMovement, cashMovementDto, cashMovementDto> {
  constructor(service: CashMovementService) {
    super(service);
  }

  findAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await (this.service as CashMovementService).findAll({
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

export const cashMovementController = new CashMovementController(new CashMovementService());
