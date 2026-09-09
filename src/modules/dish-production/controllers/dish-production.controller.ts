import { NextFunction, Request, Response } from "express";
import { ApiResponse } from "../../../shared/types/ApiResponse";
import { dishProductionService } from "../services/dish-production.service";
import type { DishProductionDto, DishProductionSearchOptions } from "../type/dish-production.type";

export class DishProductionController {
  findAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const options: DishProductionSearchOptions = {
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 20,
        idItem: req.query.idItem as string | undefined,
        startDate: req.query.startDate as string | undefined,
        endDate: req.query.endDate as string | undefined,
        status: req.query.status !== undefined ? Number(req.query.status) : undefined,
      };
      const result = await dishProductionService.findAll(options);
      res.json(ApiResponse.success(result));
    } catch (err) {
      next(err);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = req.body as DishProductionDto;
      const idOperator = (req as Request & { idEmployee?: string }).idEmployee;
      if (!idOperator) {
        res.status(400).json(ApiResponse.error("Votre compte n'est pas lié à un employé. Action impossible."));
        return;
      }
      const result = await dishProductionService.create(dto, idOperator);
      res.status(201).json(ApiResponse.success(result));
    } catch (err) {
      next(err);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = req.body as DishProductionDto;
      await dishProductionService.update(req.params.id as string, dto);
      res.json(ApiResponse.success({ message: "Production mise à jour." }));
    } catch (err) {
      next(err);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await dishProductionService.delete(req.params.id as string);
      res.json(ApiResponse.success({ message: "Production supprimée." }));
    } catch (err) {
      next(err);
    }
  };

  validate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const idOperator = (req as Request & { idEmployee?: string }).idEmployee;
      if (!idOperator) {
        res.status(400).json(ApiResponse.error("Votre compte n'est pas lié à un employé. Action impossible."));
        return;
      }
      await dishProductionService.validate(req.params.id as string, idOperator);
      res.json(ApiResponse.success({ message: "Production validée. Stocks mis à jour." }));
    } catch (err) {
      next(err);
    }
  };
}

export const dishProductionController = new DishProductionController();
