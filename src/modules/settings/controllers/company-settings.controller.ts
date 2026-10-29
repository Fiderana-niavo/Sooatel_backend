import { NextFunction, Request, Response } from "express";
import {
  getCompanyInfo,
  updateCompanyInfo,
  CompanyInfo,
} from "../../../shared/utils/company-info.utils";
import { ApiResponse } from "../../../shared/types/ApiResponse";

export class CompanySettingsController {
  getInfo = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const info = getCompanyInfo();
      res.json(ApiResponse.success(info));
    } catch (error) {
      next(error);
    }
  };

  updateInfo = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const payload = req.body as Partial<CompanyInfo>;
      const updated = updateCompanyInfo(payload);
      res.json(ApiResponse.success(updated));
    } catch (error) {
      next(error);
    }
  };
}

export const companySettingsController = new CompanySettingsController();
