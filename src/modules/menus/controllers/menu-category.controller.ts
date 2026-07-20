import { NextFunction, Request, Response } from "express";
import { MenuCategory } from "../../../database/Entities/MenuCategory";
import { CrudController } from "../../../shared/crud/controllers/CrudController";
import { ApiResponse } from "../../../shared/types/ApiResponse";
import { MenuCategoryDto } from "../type/menu-category.type";
import { MenuCategoryService } from "../services/menu-category.service";

export class MenuCategoryController extends CrudController<MenuCategory, MenuCategoryDto, MenuCategoryDto> {
  constructor(service: MenuCategoryService) {
    super(service);
  }

  findAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await (this.service as MenuCategoryService).findAll({
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

export const menuCategoryController = new MenuCategoryController(new MenuCategoryService());
