import { Router } from "express";
import { generateCrudRoutes } from "../../../shared/crud/routes/crudRoutes";
import { jobTitleController } from "../controllers/job-title.controller";
import { authMiddleware } from "../../../shared/middlewares/auth.middleware";

const jobTitleRouter = Router();

jobTitleRouter.use(authMiddleware);
generateCrudRoutes(jobTitleRouter, jobTitleController);

export default jobTitleRouter;
