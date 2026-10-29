import { NextFunction, Request, Response } from "express";
import { ApiResponse } from "../../../shared/types/ApiResponse";
import { EmploymentTypeService, employmentTypeService } from "../services/employment-type.service";

export class EmploymentTypeController {
  constructor(private service: EmploymentTypeService = employmentTypeService) {}

  findAll = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const records = await this.service.findAll();
      res.json(ApiResponse.success(records));
    } catch (err: unknown) {
      next(err);
    }
  };
}

export const employmentTypeController = new EmploymentTypeController();
