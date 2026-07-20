import { NextFunction, Request, Response } from "express";
import { ItemType } from "../../../database/Entities/ItemType";
import { CrudController } from "../../../shared/crud/controllers/CrudController";
import { ApiResponse } from "../../../shared/types/ApiResponse";
import { ItemTypeDto } from "../type/item-type.type";
import { ItemTypeService } from "../services/item-type.service";

export class ItemTypeController extends CrudController<ItemType, ItemTypeDto, ItemTypeDto> {
  constructor(service: ItemTypeService) {
    super(service);
  }

  findAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await (this.service as ItemTypeService).findAll({
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

export const itemTypeController = new ItemTypeController(new ItemTypeService());
