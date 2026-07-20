import { NextFunction, Request, Response } from "express";
import { Employee } from "../../../database/Entities/Employee";
import { CrudController } from "../../../shared/crud/controllers/CrudController";
import { ApiResponse } from "../../../shared/types/ApiResponse";
import {
  ChangeJobDto,
  EmployeeCreateOrUpdateDto,
  EmployeeDto,
  EmployeeSearchOptions,
  EmployeeTeamDto,
  EmployeeAvailabilityDto,
  EndJobDto,
} from "../type/employee.type";
import { EmployeeService } from "../services/employee.service";

export class EmployeeController extends CrudController<
  Employee,
  EmployeeCreateOrUpdateDto,
  EmployeeCreateOrUpdateDto
> {
  constructor(service: EmployeeService) {
    super(service);
  }

  getAllEmployees = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await (this.service as EmployeeService).findAll({
        page: Number(req.query.page ?? 1),
        limit: Number(req.query.limit ?? 10),
        search: req.query.search as string | undefined,
        sortBy: req.query.sortBy as NonNullable<EmployeeSearchOptions["sortBy"]> | undefined,
        sortOrder: req.query.sortOrder as NonNullable<EmployeeSearchOptions["sortOrder"]> | undefined,
        idJobTitle: req.query.idJobTitle as string | undefined,
        hasUserAccount: req.query.hasUserAccount as NonNullable<EmployeeSearchOptions["hasUserAccount"]> | undefined,
        isInternship: req.query.isInternship as NonNullable<EmployeeSearchOptions["isInternship"]> | undefined,
        status: req.query.status as NonNullable<EmployeeSearchOptions["status"]> | undefined,
      });
      res.json(ApiResponse.success(result));
    } catch (err: unknown) {
      next(err);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params["id"] as string;
      const result = await (this.service as EmployeeService).getById(id);
      if (!result) {
        res.status(404).json(ApiResponse.error("Employé introuvable"));
        return;
      }
      res.json(ApiResponse.success(result));
    } catch (err: unknown) {
      next(err);
    }
  };

  changeJob = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params["id"] as string;
      const dto = req.body as ChangeJobDto;
      await (this.service as EmployeeService).changeJob(id, dto);
      res.json(ApiResponse.success(null));
    } catch (err: unknown) {
      next(err);
    }
  };

  setTeam = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params["id"] as string;
      const dto = req.body as EmployeeTeamDto;
      await (this.service as EmployeeService).setTeam(id, dto.idTeam);
      res.json(ApiResponse.success(null));
    } catch (err: unknown) {
      next(err);
    }
  };

  endJob = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params["id"] as string;
      const dto = req.body as EndJobDto;

      if (!dto || !dto.endDate) {
        res.status(400).json(ApiResponse.error("La date de fin de contrat est requise."));
        return;
      }

      await (this.service as EmployeeService).endJob(id, dto);
      res.json(ApiResponse.success(null));
    } catch (err: unknown) {
      next(err);
    }
  };

  renewContract = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params["id"] as string;
      const dto = req.body as ChangeJobDto;
      await (this.service as EmployeeService).renewContract(id, dto);
      res.json(ApiResponse.success(null));
    } catch (err: unknown) {
      next(err);
    }
  };

  setAvailabilities = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params["id"] as string;
      const dtos = req.body as EmployeeAvailabilityDto[];
      await (this.service as EmployeeService).setAvailabilities(id, dtos);
      res.json(ApiResponse.success(null));
    } catch (err: unknown) {
      next(err);
    }
  };
}

export const employeeController = new EmployeeController(new EmployeeService());
