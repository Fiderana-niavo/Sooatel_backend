import { NextFunction, Request, Response } from "express";
import { Event } from "../../../database/Entities/Event";
import { CrudController } from "../../../shared/crud/controllers/CrudController";
import { ApiResponse } from "../../../shared/types/ApiResponse";
import { EventDto } from "../type/event.type";
import { EventService } from "../services/event.service";

export class EventController extends CrudController<Event, EventDto, EventDto> {
  constructor(service: EventService) {
    super(service);
  }

  findAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await (this.service as EventService).findAll({
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

export const eventController = new EventController(new EventService());
