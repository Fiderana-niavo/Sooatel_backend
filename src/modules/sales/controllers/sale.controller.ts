import { Request, Response } from "express";
import { SaleService } from "../services/sale.service";
import { CreateSaleDto, UpdateSaleDto, PaymentStatus } from "../types/sale.type";
import { ApiResponse } from "../../../shared/types/ApiResponse";
import { AppError, BadRequestError } from "../../../shared/errors/AppError";

const saleService = new SaleService();

export const createSale = async (req: Request, res: Response): Promise<void> => {
  try {
    const dto: CreateSaleDto = req.body;
    const userId = (req as any).userId;

    if (!userId) {
      throw new AppError("Unauthorized: Missing user information in request", 401);
    }

    if (!dto.invoiceNumber) {
      throw new BadRequestError("Invoice number is required");
    }
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestError("At least one sale item is required");
    }

    const sale = await saleService.createSale(dto, userId);
    res.status(201).json(ApiResponse.success(sale, "Sale created successfully"));
  } catch (error: any) {
    res.status(error.statusCode || 500).json(ApiResponse.error(error instanceof Error ? error.message : "Unknown error", "Failed to create sale"));
  }
};

export const updateSale = async (req: Request, res: Response): Promise<void> => {
  try {
    const idSale = req.params.id as string;
    const dto: UpdateSaleDto = req.body;
    const userId = (req as any).userId;

    if (!userId) {
      throw new AppError("Unauthorized: Missing user information in request", 401);
    }

    const updatedSale = await saleService.updateSale(idSale, dto, userId);
    res.status(200).json(ApiResponse.success(updatedSale, "Sale updated successfully"));
  } catch (error: any) {
    console.error("[updateSale controller] ERROR:", error);
    res.status(error.statusCode || 500).json(ApiResponse.error(error instanceof Error ? error.message : "Unknown error", "Failed to update sale"));
  }
};

export const findAll = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const idMenu = req.query.idMenu as string;
    const date = req.query.date as string;
    
    const paymentStatus = req.query.paymentStatus as PaymentStatus | undefined;

    let status: number[] | undefined = undefined;
    if (req.query.status) {
      status = (req.query.status as string).split(',').map(Number).filter(n => !isNaN(n));
    }

    const result = await saleService.findAll({ page, limit, idMenu, date, status, paymentStatus });
    res.status(200).json(ApiResponse.success(result, "Sales fetched successfully"));
  } catch (error: any) {
    res.status(500).json(ApiResponse.error(error instanceof Error ? error.message : "Unknown error", "Failed to retrieve sales"));
  }
};

export const getSaleById = async (req: Request, res: Response): Promise<void> => {
  try {
    const sale = await saleService.getSaleById(req.params.id as string);
    if (!sale) {
      res.status(404).json(ApiResponse.error("Sale not found", "Not Found"));
      return;
    }
    res.status(200).json(ApiResponse.success(sale, "Sale retrieved successfully"));
  } catch (error: unknown) {
    res.status(500).json(ApiResponse.error(error instanceof Error ? error.message : "Unknown error", "Failed to retrieve sale"));
  }
};

export const cancelSale = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as Request & { userId: string }).userId;
    if (!userId) {
      throw new AppError("Unauthorized", 401);
    }
    const updated = await saleService.cancelSale(req.params.id as string, userId);
    res.status(200).json(ApiResponse.success(updated, "Sale cancelled successfully"));
  } catch (error: unknown) {
    const err = error as { statusCode?: number; message?: string };
    res.status(err.statusCode || 500).json(ApiResponse.error(err.message || "Unknown error", "Failed to cancel sale"));
  }
};

export const reopenSale = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as Request & { userId: string }).userId;
    if (!userId) {
      throw new AppError("Unauthorized", 401);
    }
    const { reason } = req.body;
    if (!reason) {
      throw new AppError("Un motif est obligatoire pour réouvrir une vente.", 400);
    }
    const updated = await saleService.reopenSale(req.params.id as string, userId, reason);
    res.status(200).json(ApiResponse.success(updated, "Sale reopened successfully"));
  } catch (error: unknown) {
    const err = error as { statusCode?: number; message?: string };
    res.status(err.statusCode || 500).json(ApiResponse.error(err.message || "Unknown error", "Failed to reopen sale"));
  }
};

export const deleteSale = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as Request & { userId: string }).userId;
    if (!userId) {
      throw new AppError("Unauthorized", 401);
    }
    await saleService.deleteSale(req.params.id as string, userId);
    res.status(200).json(ApiResponse.success(null, "Sale deleted successfully"));
  } catch (error: unknown) {
    const err = error as { statusCode?: number; message?: string };
    res.status(err.statusCode || 500).json(ApiResponse.error(err.message || "Unknown error", "Failed to delete sale"));
  }
};

export const paySale = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as Request & { userId: string }).userId;
    if (!userId) {
      throw new AppError("Unauthorized", 401);
    }
    const updated = await saleService.paySale(req.params.id as string, userId, req.body);
    res.status(200).json(ApiResponse.success(updated, "Sale paid successfully"));
  } catch (error: unknown) {
    const err = error as { statusCode?: number; message?: string };
    res.status(err.statusCode || 500).json(ApiResponse.error(err.message || "Unknown error", "Failed to process payment"));
  }
};

export const closeSale = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as Request & { userId: string }).userId;
    if (!userId) throw new AppError("Unauthorized", 401);
    const updated = await saleService.closeSale(req.params.id as string, userId);
    res.status(200).json(ApiResponse.success(updated, "Sale closed successfully"));
  } catch (error: unknown) {
    const err = error as { statusCode?: number; message?: string };
    res.status(err.statusCode || 500).json(ApiResponse.error(err.message || "Unknown error", "Failed to close sale"));
  }
};
