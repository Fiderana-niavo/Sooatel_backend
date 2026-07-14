import { Router } from "express";
import { generateCrudRoutes } from "../../../shared/crud/routes/crudRoutes";
import { jobTitleController } from "../controllers/job-title.controller";

const jobTitleRouter = Router();

generateCrudRoutes(jobTitleRouter, jobTitleController);

export default jobTitleRouter;
