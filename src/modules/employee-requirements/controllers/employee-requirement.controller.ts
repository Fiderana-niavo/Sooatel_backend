import { NextFunction, Request, Response } from "express";
import { EmployeeRequirement } from "../../../database/Entities/EmployeeRequirement";
import { CrudController } from "../../../shared/crud/controllers/CrudController";
import { ApiResponse } from "../../../shared/types/ApiResponse";
import { EmployeeRequirementDto, EmployeeRequirementBulkDto } from "../type/employee-requirement.type";
import { EmployeeRequirementService } from "../services/employee-requirement.service";

export class EmployeeRequirementController extends CrudController<
  EmployeeRequirement,
  EmployeeRequirementDto,
  EmployeeRequirementDto
> {
  constructor(service: EmployeeRequirementService) {
    super(service);
  }

  override findAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await (this.service as EmployeeRequirementService).findRequirements({
        page: req.query["page"] ? Number(req.query["page"]) : undefined,
        limit: req.query["limit"] ? Number(req.query["limit"]) : undefined,
        idJobTitle: req.query["idJobTitle"] as string | undefined,
        idShiftType: req.query["idShiftType"] as string | undefined,
        dayOfWeek: req.query["dayOfWeek"] !== undefined
          ? Number(req.query["dayOfWeek"])
          : undefined,
      });
      res.json(ApiResponse.success(result));
    } catch (err: unknown) {
      if (next) next(err);
    }
  };

  override getOne = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params["id"] as string;
      const result = await (this.service as EmployeeRequirementService).findRequirement(id);
      if (!result) {
        res.status(404).json(ApiResponse.error("Requirement not found"));
        return;
      }
      res.json(ApiResponse.success(result));
    } catch (err: unknown) {
      if (next) next(err);
    }
  };

  override save = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = req.body as EmployeeRequirementDto;
      const result = await (this.service as EmployeeRequirementService).createRequirement(dto);
      res.status(201).json(ApiResponse.success(result));
    } catch (err: unknown) {
      if (next) next(err);
    }
  };

  override update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params["id"] as string;
      const dto = req.body as EmployeeRequirementDto;
      await (this.service as EmployeeRequirementService).updateRequirement(id, dto);
      res.json(ApiResponse.success(null, "Requirement updated successfully"));
    } catch (err: unknown) {
      if (next) next(err);
    }
  };

  override remove = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params["id"] as string;
      await (this.service as EmployeeRequirementService).deleteRequirement(id);
      res.json(ApiResponse.success(null, "Requirement deleted successfully"));
    } catch (err: unknown) {
      if (next) next(err);
    }
  };

  bulkCreate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dtos = req.body as EmployeeRequirementBulkDto[];
      if (!Array.isArray(dtos) || dtos.length === 0) {
        res.status(400).json(ApiResponse.error("La requête ne peut pas être vide"));
        return;
      }
      const result = await (this.service as EmployeeRequirementService).bulkCreate(dtos);
      res.status(201).json(ApiResponse.success(result, `${result.created} besoin(s) créé(s), ${result.skipped} ignoré(s)`));
    } catch (err: unknown) {
      if (next) next(err);
    }
  };
}

export const employeeRequirementController = new EmployeeRequirementController(
  new EmployeeRequirementService(),
);
