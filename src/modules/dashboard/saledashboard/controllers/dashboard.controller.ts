import { Request, Response } from "express";
import { DashboardService } from "../services/dashboard.service";
import { ApiResponse } from "../../../../shared/types/ApiResponse";
import type { DateFilters } from "../types/dashboard.type";

const service = new DashboardService();

const extractFilters = (req: Request): DateFilters | null => {
  const { startDate, endDate } = req.query as { startDate: string; endDate: string };
  if (!startDate || !endDate) return null;
  return { startDate, endDate };
};

const handle =
  (fn: (filters: DateFilters, req: Request) => Promise<unknown>) =>
    async (req: Request, res: Response): Promise<void> => {
      try {
        const filters = extractFilters(req);
        if (!filters) {
          res.status(400).json(ApiResponse.error("startDate et endDate sont requis"));
          return;
        }
        const result = await fn(filters, req);
        res.json(ApiResponse.success(result));
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : "Erreur serveur";
        console.error("[DashboardController]", error);
        res.status(500).json(ApiResponse.error(msg));
      }
    };

export const getCaSummary = handle((filters) =>
  service.getCaSummary(filters)
);
export const getCaTopProducts = handle((filters) =>
  service.getCaTopProducts(filters)
);
export const getCaProductDetail = handle((filters, req) =>
  service.getCaProductDetail(req.params["idMenu"] as string, filters)
);

export const getBenefitSummary = handle((filters) =>
  service.getBenefitSummary(filters)
);
export const getBenefitTopProducts = handle((filters) =>
  service.getBenefitTopProducts(filters)
);
export const getBenefitProductDetail = handle((filters, req) =>
  service.getBenefitProductDetail(req.params["idMenu"] as string, filters)
);
