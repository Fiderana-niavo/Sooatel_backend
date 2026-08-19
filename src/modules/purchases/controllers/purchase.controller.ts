import { NextFunction, Request, Response } from "express";
import { PurchaseService } from "../services/purchase.service";
import { ApiResponse } from "../../../shared/types/ApiResponse";

export class PurchaseController {
  constructor(private service: PurchaseService) { }

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Access user ID from token payload
      const userId = req.userId;
      if (!userId) {
        res.status(401).json(ApiResponse.error("Non authentifié"));
        return;
      }
      const result = await this.service.createPurchase(req.body, userId);
      res.status(201).json(ApiResponse.success(result));
    } catch (err: unknown) {
      next(err);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.userId;
      if (!userId) {
        res.status(401).json(ApiResponse.error("Non authentifié"));
        return;
      }
      const result = await this.service.updatePurchase(req.params.id as string, req.body, userId);
      res.status(200).json(ApiResponse.success(result));
    } catch (err: unknown) {
      next(err);
    }
  };

  confirm = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.userId;
      if (!userId) {
        res.status(401).json(ApiResponse.error("Non authentifié"));
        return;
      }
      const result = await this.service.confirmPurchase(req.params.id as string, userId);
      res.status(200).json(ApiResponse.success(result));
    } catch (err: unknown) {
      next(err);
    }
  };

  cancel = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.userId;
      if (!userId) {
        res.status(401).json(ApiResponse.error("Non authentifié"));
        return;
      }
      const result = await this.service.cancelPurchase(req.params.id as string, userId);
      res.status(200).json(ApiResponse.success(result));
    } catch (err: unknown) {
      next(err);
    }
  };

  findAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { page, limit, status, lifecycleStatus, idSupplier, startDate, endDate } = req.query;
      const options = {
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 10,
        status: status ? parseInt(status as string, 10) : undefined,
        lifecycleStatus: lifecycleStatus ? parseInt(lifecycleStatus as string, 10) : undefined,
        idSupplier: idSupplier as string,
        startDate: startDate as string,
        endDate: endDate as string,
      };
      const result = await this.service.findAll(options);
      res.json(ApiResponse.success(result));
    } catch (err: unknown) {
      next(err);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.service.getPurchaseById(req.params.id as string);
      if (!result) {
        res.status(404).json(ApiResponse.error("Commande introuvable", "NOT_FOUND"));
        return;
      }
      res.json(ApiResponse.success(result));
    } catch (err: unknown) {
      next(err);
    }
  };

  getDetails = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.service.getPurchaseDetails(req.params.id as string);
      res.json(ApiResponse.success(result));
    } catch (err: unknown) {
      next(err);
    }
  };

  getDeliveries = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.service.getPurchaseDeliveries(req.params.id as string);
      res.json(ApiResponse.success(result));
    } catch (err: unknown) {
      next(err);
    }
  };
}

export const purchaseController = new PurchaseController(new PurchaseService());
