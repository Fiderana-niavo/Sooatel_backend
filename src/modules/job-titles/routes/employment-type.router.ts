import { Request, Response, Router } from "express";
import AppDataSource from "../../../database/data-source";
import { EmploymentType } from "../../../database/Entities/EmploymentType";
import { ApiResponse } from "../../../shared/types/ApiResponse";

const employmentTypeRouter = Router();

employmentTypeRouter.get("/", async (req: Request, res: Response) => {
  try {
    const repository = AppDataSource.getRepository(EmploymentType);
    const types = await repository.find();
    res.json(ApiResponse.success(types));
  } catch (error: unknown) {
    res.status(500).json(ApiResponse.error("Erreur lors de la récupération des types de contrat"));
  }
});

export default employmentTypeRouter;
