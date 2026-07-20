import { NextFunction, Request, Response } from "express";
import { ProductPrice } from "../../../database/Entities/ProductPrice";
import { CrudController } from "../../../shared/crud/controllers/CrudController";
import { ApiResponse } from "../../../shared/types/ApiResponse";
import { ProductPriceDto } from "../type/product-price.type";
import { ProductPriceService } from "../services/product-price.service";

export class ProductPriceController extends CrudController<ProductPrice, ProductPriceDto, ProductPriceDto> {
  constructor(service: ProductPriceService) {
    super(service);
  }

  findAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await (this.service as ProductPriceService).findAll({
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

export const productPriceController = new ProductPriceController(new ProductPriceService());
