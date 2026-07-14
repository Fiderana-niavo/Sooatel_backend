import { Request, Response } from "express";
import { JobTitle } from "../../../database/Entities/JobTitle";
import { CrudController } from "../../../shared/crud/controllers/CrudController";
import { ApiResponse } from "../../../shared/types/ApiResponse";
import { JobTitleDto } from "../type/job-title.type";
import { JobTitleService } from "../services/job-title.service";

export class JobTitleController extends CrudController<JobTitle, JobTitleDto, JobTitleDto> {
  constructor(service: JobTitleService) {
    super(service);
  }

  findAll = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await (this.service as JobTitleService).findAll({
        page: Number(req.query.page ?? 1),
        limit: Number(req.query.limit ?? 10),
        search: req.query.search as string | undefined,
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
}

export const jobTitleController = new JobTitleController(new JobTitleService());
