import { NextFunction, Request, Response } from "express";
import { Room } from "../../../database/Entities/Room";
import { CrudController } from "../../../shared/crud/controllers/CrudController";
import { ApiResponse } from "../../../shared/types/ApiResponse";
import { RoomDto } from "../type/room.type";
import { RoomService } from "../services/room.service";

export class RoomController extends CrudController<Room, RoomDto, RoomDto> {
  constructor(service: RoomService) {
    super(service);
  }

  findAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await (this.service as RoomService).findAll({
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

export const roomController = new RoomController(new RoomService());
