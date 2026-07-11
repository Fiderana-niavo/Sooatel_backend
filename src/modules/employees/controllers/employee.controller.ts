import { Request, Response } from "express";
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

  findAll = async (req: Request, res: Response): Promise<void> => {
    try {
      console.log("QUERY PARAMS =>", req.query);

      const result = await (this.service as EmployeeService).findAll({
        page: Number(req.query.page ?? 1),
        limit: Number(req.query.limit ?? 10),
        search: req.query.search as string | undefined,
        // we say that only value in EmployeeSearchOptions can be in the sortBy
        sortBy: req.query.sortBy as NonNullable<EmployeeSearchOptions["sortBy"]> | undefined,
        sortOrder: req.query.sortOrder as
          NonNullable<EmployeeSearchOptions["sortOrder"]> | undefined,
        idJobTitle: req.query.idJobTitle as string | undefined,
        hasUserAccount: req.query.hasUserAccount as
          NonNullable<EmployeeSearchOptions["hasUserAccount"]> | undefined,
        isInternship: req.query.isInternship as
          NonNullable<EmployeeSearchOptions["isInternship"]> | undefined,
      });

      res.json(ApiResponse.success(result));
    } catch (err: unknown) {
      console.error("findAll error:", err);
      if (err instanceof Error) {
        res.status(500).json(ApiResponse.error(err.message));
      } else {
        res.status(500).json(ApiResponse.error("Une erreur inconnue est survenue"));
      }
    }
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params["id"] as string;
      const result = await (this.service as EmployeeService).getById(id);
      if (!result) {
        res.status(404).json(ApiResponse.error("Employé introuvable"));
        return;
      }
      res.json(ApiResponse.success(result));
    } catch (err: unknown) {
      console.error("getById error:", err);
      if (err instanceof Error) {
        res.status(500).json(ApiResponse.error(err.message));
      } else {
        res.status(500).json(ApiResponse.error("Une erreur inconnue est survenue"));
      }
    }
  };

  changeJob = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params["id"] as string;
      const dto = req.body as ChangeJobDto;
      await (this.service as EmployeeService).changeJob(id, dto);
      res.json(ApiResponse.success(null));
    } catch (err: unknown) {
      console.error("changeJob error:", err);
      if (err instanceof Error) {
        res.status(500).json(ApiResponse.error(err.message));
      } else {
        res.status(500).json(ApiResponse.error("Une erreur inconnue est survenue"));
      }
    }
  };

  setTeam = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params["id"] as string;
      const dto = req.body as EmployeeTeamDto;
      await (this.service as EmployeeService).setTeam(id, dto.idTeam);
      res.json(ApiResponse.success(null));
    } catch (err: unknown) {
      console.error("setTeam error:", err);
      if (err instanceof Error) {
        res.status(500).json(ApiResponse.error(err.message));
      } else {
        res.status(500).json(ApiResponse.error("Une erreur inconnue est survenue"));
      }
    }
  };

  deleteTeam = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params["id"] as string;
      await (this.service as EmployeeService).deleteTeam(id);
      res.json(ApiResponse.success(null));
    } catch (err: unknown) {
      console.error("deleteTeam error:", err);
      if (err instanceof Error) {
        res.status(500).json(ApiResponse.error(err.message));
      } else {
        res.status(500).json(ApiResponse.error("Une erreur inconnue est survenue"));
      }
    }
  };

  setAvailabilities = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params["id"] as string;
      const dtos = req.body as EmployeeAvailabilityDto[];
      await (this.service as EmployeeService).setAvailabilities(id, dtos);
      res.json(ApiResponse.success(null));
    } catch (err: unknown) {
      console.error("setAvailabilities error:", err);
      if (err instanceof Error) {
        res.status(500).json(ApiResponse.error(err.message));
      } else {
        res.status(500).json(ApiResponse.error("Une erreur inconnue est survenue"));
      }
    }
  };

  deleteAvailabilities = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params["id"] as string;
      await (this.service as EmployeeService).deleteAvailabilities(id);
      res.json(ApiResponse.success(null));
    } catch (err: unknown) {
      console.error("deleteAvailabilities error:", err);
      if (err instanceof Error) {
        res.status(500).json(ApiResponse.error(err.message));
      } else {
        res.status(500).json(ApiResponse.error("Une erreur inconnue est survenue"));
      }
    }
  };
}

export const employeeController = new EmployeeController(new EmployeeService());
