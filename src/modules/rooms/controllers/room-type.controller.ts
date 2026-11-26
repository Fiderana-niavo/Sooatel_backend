import { NextFunction, Request, Response } from "express";
import { RoomType } from "../../../database/Entities/RoomType";
import { CrudController } from "../../../shared/crud/controllers/CrudController";
import { ApiResponse } from "../../../shared/types/ApiResponse";
import { RoomTypeDto } from "../type/room-type.type";
import { RoomTypeService } from "../services/room-type.service";

export class RoomTypeController extends CrudController<RoomType, RoomTypeDto, RoomTypeDto> {
  constructor(service: RoomTypeService) {
    super(service);
  }

  findAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await (this.service as RoomTypeService).findAll({
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

export const roomTypeController = new RoomTypeController(new RoomTypeService());
