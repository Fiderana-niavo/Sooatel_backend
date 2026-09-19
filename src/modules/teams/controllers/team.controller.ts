import { NextFunction, Request, Response } from "express";
import { Team } from "../../../database/Entities/Team";
import { CrudController } from "../../../shared/crud/controllers/CrudController";
import { ApiResponse } from "../../../shared/types/ApiResponse";
import { TeamDto } from "../type/team.type";
import { TeamService } from "../services/team.service";

export class TeamController extends CrudController<Team, TeamDto, TeamDto> {
  constructor(service: TeamService) {
    super(service);
  }

  findAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await (this.service as TeamService).findAll({
        page: Number(req.query.page ?? 1),
        limit: Number(req.query.limit ?? 20),
        search: req.query.search as string | undefined,
      });

      res.json(ApiResponse.success(result));
    } catch (err: unknown) {
      next(err);
    }
  };

  getMembers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const members = await (this.service as TeamService).getMembers(id);
      res.json(ApiResponse.success(members));
    } catch (err) {
      next(err);
    }
  };

  getAvailableEmployees = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const employees = await (this.service as TeamService).getAvailableEmployees();
      res.json(ApiResponse.success(employees));
    } catch (err) {
      next(err);
    }
  };

  addMembers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const { employeeIds } = req.body;
      if (!employeeIds || !Array.isArray(employeeIds) || employeeIds.length === 0) {
        throw new Error("employeeIds (array) est requis.");
      }
      await (this.service as TeamService).addMembers(id, employeeIds);
      res.json(ApiResponse.success({ success: true }));
    } catch (err) {
      next(err);
    }
  };

  removeMember = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const idEmployee = req.params.idEmployee as string;
      await (this.service as TeamService).removeMember(id, idEmployee);
      res.json(ApiResponse.success({ success: true }));
    } catch (err) {
      next(err);
    }
  };

}


export const teamController = new TeamController(new TeamService());
