import { NextFunction, Request, Response } from "express";
import { SuppliedItem } from "../../../database/Entities/SuppliedItem";
import { CrudController } from "../../../shared/crud/controllers/CrudController";
import { ApiResponse } from "../../../shared/types/ApiResponse";
import { SuppliedItemDto } from "../type/supplier.type";
import { SuppliedItemService } from "../services/supplied-item.service";

export class SuppliedItemController extends CrudController<SuppliedItem, SuppliedItemDto, SuppliedItemDto> {
  constructor(service: SuppliedItemService) {
    super(service);
  }

  findAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await (this.service as SuppliedItemService).findAll({
        page: Number(req.query.page ?? 1),
        limit: Number(req.query.limit ?? 10),
        idSupplierProduct: req.query.idSupplierProduct as string | undefined,
        idItem: req.query.idItem as string | undefined,
      });

      res.json(ApiResponse.success(result));
    } catch (err: unknown) {
      next(err);
    }
  };
}

export const suppliedItemController = new SuppliedItemController(new SuppliedItemService());
