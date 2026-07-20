import { NextFunction, Request, Response } from "express";
import { Item } from "../../../database/Entities/Item";
import { CrudController } from "../../../shared/crud/controllers/CrudController";
import { ApiResponse } from "../../../shared/types/ApiResponse";
import { ItemDto } from "../type/item.type";
import { ItemService } from "../services/item.service";

export class ItemController extends CrudController<Item, ItemDto, ItemDto> {
  constructor(service: ItemService) {
    super(service);
  }

  findAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await (this.service as ItemService).findAll({
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

export const itemController = new ItemController(new ItemService());
