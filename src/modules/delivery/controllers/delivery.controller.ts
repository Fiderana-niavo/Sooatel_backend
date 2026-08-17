import { NextFunction, Request, Response } from "express";
import { deliveryService } from "../services/delivery.service";
import { ApiResponse } from "../../../shared/types/ApiResponse";

export class DeliveryController {
  findAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { page, limit, status, ref, startDate, endDate } = req.query;
      const options = {
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 10,
        status: status ? parseInt(status as string, 10) : undefined,
        ref: ref as string,
        startDate: startDate as string,
        endDate: endDate as string,
      };
      const result = await deliveryService.findAll(options);
      res.json(ApiResponse.success(result));
    } catch (err: unknown) {
      next(err);
    }
  };

  getPendingBySupplier = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const excludeDeliveryId = req.query.excludeDeliveryId as string | undefined;
      const result = await deliveryService.getPendingBySupplier(req.params.idSupplier as string, excludeDeliveryId);
      res.json(ApiResponse.success(result));
    } catch (err: unknown) {
      next(err);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await deliveryService.createDelivery(req.body);
      res.status(201).json(ApiResponse.success(result));
    } catch (err: unknown) {
      next(err);
    }
  };

  getDetails = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await deliveryService.getDeliveryDetails(req.params.id as string);
      res.json(ApiResponse.success(result));
    } catch (err: unknown) {
      next(err);
    }
  };

  validate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const idOperator = req.idEmployee || req.userId;
      if (!idOperator) throw new Error("Operator ID not found in request");
      await deliveryService.validateDelivery(req.params.id as string, idOperator);
      res.json(ApiResponse.success({ message: "Livraison validée" }));
    } catch (err: unknown) {
      next(err);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await deliveryService.updateDelivery(req.params.id as string, req.body);
      res.json(ApiResponse.success(result));
    } catch (err: unknown) {
      next(err);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await deliveryService.deleteDelivery(req.params.id as string);
      res.json(ApiResponse.success({ message: "Livraison supprimée" }));
    } catch (err: unknown) {
      next(err);
    }
  };
}

export const deliveryController = new DeliveryController();
