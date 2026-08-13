import { NextFunction, Request, Response } from "express";
import { SupplierProduct } from "../../../database/Entities/SupplierProduct";
import { CrudController } from "../../../shared/crud/controllers/CrudController";
import { ApiResponse } from "../../../shared/types/ApiResponse";
import { SupplierProductDto } from "../type/supplier.type";
import { SupplierProductService } from "../services/supplier-product.service";

export class SupplierProductController extends CrudController<SupplierProduct, SupplierProductDto, SupplierProductDto> {
  constructor(service: SupplierProductService) {
    super(service);
  }

  findAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await (this.service as SupplierProductService).findAll({
        page: Number(req.query.page ?? 1),
        limit: Number(req.query.limit ?? 10),
        search: req.query.search as string | undefined,
        idSupplier: req.query.idSupplier as string | undefined,
        unlinkedOnly: req.query.unlinkedOnly === "true",
      });

      res.json(ApiResponse.success(result));
    } catch (err: unknown) {
      next(err);
    }
  };

  changePrice = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params["id"] as string;
      const { price, changeDate } = req.body;
      if (!id || price === undefined) {
        res.status(400).json(ApiResponse.error("Missing id or price"));
        return;
      }
      
      await (this.service as SupplierProductService).changePrice(id, Number(price), changeDate);
      res.json(ApiResponse.success({ message: "Price changed successfully" }));
    } catch (err: unknown) {
      next(err);
    }
  };

  fixPriceError = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params["id"] as string;
      const { price } = req.body;
      if (!id || price === undefined) {
        res.status(400).json(ApiResponse.error("Missing id or price"));
        return;
      }
      
      await (this.service as SupplierProductService).fixPriceError(id, Number(price));
      res.json(ApiResponse.success({ message: "Price error fixed successfully" }));
    } catch (err: unknown) {
      next(err);
    }
  };

  getPriceHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params["id"] as string;
      if (!id) {
        res.status(400).json(ApiResponse.error("Missing id"));
        return;
      }
      
      const history = await (this.service as SupplierProductService).getPriceHistory(id);
      res.json(ApiResponse.success(history));
    } catch (err: unknown) {
      next(err);
    }
  };
}

export const supplierProductController = new SupplierProductController(new SupplierProductService());
