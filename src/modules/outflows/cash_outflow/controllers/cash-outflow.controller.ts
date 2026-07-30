import { NextFunction, Request, Response } from "express";
import { CashOutflow } from "../../../../database/Entities/CashOutflow";
import { CrudController } from "../../../../shared/crud/controllers/CrudController";
import { ApiResponse } from "../../../../shared/types/ApiResponse";
import { CashOutflowDto } from "../type/cash-outflow.type";
import { CashOutflowService } from "../services/cash-outflow.service";

export class CashOutflowController extends CrudController<CashOutflow, CashOutflowDto, CashOutflowDto> {
  constructor(service: CashOutflowService) {
    super(service);
  }

  findAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await (this.service as CashOutflowService).findAll({
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

export const cashOutflowController = new CashOutflowController(new CashOutflowService());
