import { NextFunction, Request, Response } from "express";
import { Supplier } from "../../../database/Entities/Supplier";
import { CrudController } from "../../../shared/crud/controllers/CrudController";
import { ApiResponse } from "../../../shared/types/ApiResponse";
import { SupplierDto } from "../type/supplier.type";
import { SupplierService } from "../services/supplier.service";

export class SupplierController extends CrudController<Supplier, SupplierDto, SupplierDto> {
  constructor(service: SupplierService) {
    super(service);
  }

  findAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await (this.service as SupplierService).findAll({
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

export const supplierController = new SupplierController(new SupplierService());
