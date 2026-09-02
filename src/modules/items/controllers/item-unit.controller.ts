import { Request, Response, NextFunction } from "express";
import { CrudController } from "../../../shared/crud/controllers/CrudController";
import { ItemUnit } from "../../../database/Entities/ItemUnit";
import { ItemUnitService, itemUnitService } from "../services/item-unit.service";
import { CreateItemUnitDto, UpdateItemUnitDto } from "../type/item-unit.type";
import { ApiResponse } from "../../../shared/types/ApiResponse";

export class ItemUnitController extends CrudController<ItemUnit, CreateItemUnitDto, UpdateItemUnitDto> {
  public itemUnitService: ItemUnitService;

  constructor(service: ItemUnitService = itemUnitService) {
    super(service);
    this.itemUnitService = service;
  }

  findAll = async (req: Request, res: Response, _next: NextFunction) => {
    try {
      const page = req.query["page"] ? parseInt(req.query["page"] as string, 10) : undefined;
      const limit = req.query["limit"] ? parseInt(req.query["limit"] as string, 10) : undefined;
      const idItem = req.query["idItem"] as string | undefined;
      
      const entities = await this.itemUnitService.findAll({ page, limit, idItem });
      res.json(ApiResponse.success(entities));
    } catch (error: unknown) {
      if (_next) _next(error);
    }
  };
}

export const itemUnitController = new ItemUnitController();
