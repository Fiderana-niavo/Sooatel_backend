import { NextFunction, Request, Response } from "express";
import { BaseEntity } from "typeorm";
import { ApiResponse } from "../../types/ApiResponse";
import { Paginated } from "../../types/Paginated";
import { CrudService } from "../services/CrudService";

export class CrudController<T extends BaseEntity, CreateDto = Partial<T>, UpdateDto = Partial<T>> {
  constructor(public service: CrudService<T, CreateDto, UpdateDto>) { }

  findAll = async (req: Request, res: Response, _next: NextFunction) => {
    try {
      const page = req.query["page"] ? parseInt(req.query["page"] as string, 10) : undefined;
      const limit = req.query["limit"] ? parseInt(req.query["limit"] as string, 10) : undefined;
      const entities = await this.service.findAll({ page, limit });
      res.json({ message: "CRUD CONTROLLER CALLED", payload: entities });
    } catch (error: unknown) {
      if (_next) _next(error);
    }
  };

  getOne = async (req: Request, res: Response, _next: NextFunction) => {
    try {
      const id = req.params["id"] as string;
      const data = await this.service.findOne(id);
      if (data !== null) {
        res.json(ApiResponse.success<T>(data as T));
      } else {
        res.status(404).json(ApiResponse.error("Entity not found"));
      }
    } catch (error: unknown) {
      if (_next) _next(error);
    }
  };

  save = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const entity = req.body as CreateDto;
      const saved = await this.service.create(entity);
      res.status(201).json(ApiResponse.success<T>(saved));
    } catch (error: unknown) {
      if (next) next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params["id"] as string;
      const entity = req.body as UpdateDto;
      await this.service.update(id, entity);
      res.json(ApiResponse.success<null>(null, "Entity updated successfully"));
    } catch (error: unknown) {
      if (next) next(error);
    }
  };

  remove = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params["id"] as string;
      await this.service.delete(id);
      res.json(ApiResponse.success<null>(null, "Entity deleted successfully"));
    } catch (error: unknown) {
      if (next) next(error);
    }
  };
}
