import { NextFunction, Request, Response } from "express";
import { MenuItem } from "../../../database/Entities/MenuItem";
import { CrudController } from "../../../shared/crud/controllers/CrudController";
import { ApiResponse } from "../../../shared/types/ApiResponse";
import { MenuItemDto } from "../type/menu-item.type";
import { MenuItemService } from "../services/menu-item.service";

export class MenuItemController extends CrudController<MenuItem, MenuItemDto, MenuItemDto> {
  constructor(service: MenuItemService) {
    super(service);
  }

  findAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await (this.service as MenuItemService).findAll({
        page: Number(req.query.page ?? 1),
        limit: Number(req.query.limit ?? 10),
        search: req.query.search as string | undefined,
        idCategory: req.query.idCategory as string | undefined,
      });

      res.json(ApiResponse.success(result));
    } catch (err: unknown) {
      next(err);
    }
  };
}

export const menuItemController = new MenuItemController(new MenuItemService());
