import { NextFunction, Request, Response } from "express";
import { ApiResponse } from "../../../shared/types/ApiResponse";
import { stockMovementService } from "../services/stock-movement.service";
import type { StockMovementDto, StockMovementSearchOptions, LossDto, InventoryLineDto } from "../type/stock-movement.type";

export class StockMovementController {
  findAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const options: StockMovementSearchOptions = {
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 20,
        idItem: req.query.idItem as string | undefined,
        startDate: req.query.startDate as string | undefined,
        endDate: req.query.endDate as string | undefined,
        direction: req.query.direction !== undefined ? Number(req.query.direction) : undefined,
        status: req.query.status !== undefined ? Number(req.query.status) : undefined,
      };
      const result = await stockMovementService.findAll(options);
      res.json(ApiResponse.success(result));
    } catch (err) {
      next(err);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = req.body as StockMovementDto;
      const idOperator = (req as Request & { idEmployee?: string }).idEmployee;
      if (!idOperator) {
        res.status(400).json(ApiResponse.error("Votre compte n'est pas lié à un employé. Action impossible."));
        return;
      }
      const result = await stockMovementService.create(dto, idOperator);
      res.status(201).json(ApiResponse.success(result));
    } catch (err) {
      next(err);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = req.body as StockMovementDto;
      await stockMovementService.update(req.params.id as string, dto);
      res.json(ApiResponse.success({ message: "Mouvement mis à jour." }));
    } catch (err) {
      next(err);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await stockMovementService.delete(req.params.id as string);
      res.json(ApiResponse.success({ message: "Mouvement supprimé." }));
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
      await stockMovementService.validate(req.params.id as string, idOperator);
      res.json(ApiResponse.success({ message: "Mouvement validé. Stock mis à jour." }));
    } catch (err) {
      next(err);
    }
  };

  recordLoss = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = req.body as LossDto;
      const idOperator = (req as Request & { idEmployee?: string }).idEmployee;
      if (!idOperator) {
        res.status(400).json(ApiResponse.error("Votre compte n'est pas lié à un employé. Action impossible."));
        return;
      }
      await stockMovementService.recordLoss(dto, idOperator);
      res.status(201).json(ApiResponse.success({ message: "Perte enregistrée. Stock mis à jour." }));
    } catch (err) {
      next(err);
    }
  };

}

export const stockMovementController = new StockMovementController();
