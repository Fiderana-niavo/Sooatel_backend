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
}

export const teamController = new TeamController(new TeamService());
