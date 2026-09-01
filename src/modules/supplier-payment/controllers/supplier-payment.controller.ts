import { Request, Response, NextFunction } from "express";
import { SupplierPaymentService } from "../services/supplier-payment.service";
import { ApiResponse } from "../../../shared/types/ApiResponse";
import { BadRequestError } from "../../../shared/errors/AppError";

const service = new SupplierPaymentService();

export class SupplierPaymentController {

  // POST /supplier-payments  — créer un paiement avec allocations
  createPayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const idEmployee = req.idEmployee || req.userId;
      if (!idEmployee) throw new BadRequestError("Non authentifié.");
      const { idSupplier, ...dto } = req.body;
      const result = await service.createPayment(idSupplier, idEmployee, dto);
      res.status(201).json(ApiResponse.success(result));
    } catch (err) { next(err); }
  };

  // GET /supplier-payments/delivery/:id/summary
  getDeliverySummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await service.getDeliveryPaymentSummary(req.params.id as string);
      res.json(ApiResponse.success(result));
    } catch (err) { next(err); }
  };

  // GET /supplier-payments/supplier/:id/destinations
  getAvailableDestinations = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await service.getAvailableDestinations(req.params.id as string);
      res.json(ApiResponse.success(result));
    } catch (err) { next(err); }
  };

  // GET /supplier-payments/supplier/:id/balance
  getBalance = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const row = await service.getSupplierBalanceRow(req.params.id as string);
      res.json(ApiResponse.success(row));
    } catch (err) { next(err); }
  };

  // POST /supplier-payments/supplier/:id/apply-credit
  applyCredit = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await service.applySupplierCredit(req.params.id as string, req.body);
      res.json(ApiResponse.success(null));
    } catch (err) { next(err); }
  };

  getPaymentById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const payment = await service.getPaymentById(id as string);
      res.status(200).json(ApiResponse.success(payment, "Paiement récupéré avec succès"));
    } catch (error) {
      next(error);
    }
  };

  updatePayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const idEmployee = (req as any).user?.idEmployee || "unknown";
      const dto = req.body;
      const result = await service.updatePayment(id as string, idEmployee, dto);
      res.status(200).json(ApiResponse.success(result, "Paiement modifié avec succès"));
    } catch (error) {
      next(error);
    }
  };

  // GET /supplier-payments/purchase/:id/summary
  getPurchaseSummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await service.getPurchasePaymentSummary(req.params.id as string);
      res.json(ApiResponse.success(result));
    } catch (err) { next(err); }
  };
}

export const supplierPaymentController = new SupplierPaymentController();
