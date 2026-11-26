import { Router } from "express";
import { jobTitleController } from "../controllers/job-title.controller";
import { generateCrudRoutes } from "../../../shared/crud/routes/crudRoutes";
import { authMiddleware } from "../../../shared/middlewares/auth.middleware";
import { authorize } from "../../../shared/middlewares/authorize.middleware";

const jobTitleRouter = Router();

jobTitleRouter.use(authMiddleware);
jobTitleRouter.use(authorize("hr.manage"));

generateCrudRoutes(jobTitleRouter, jobTitleController, {
  valueField: "idJobTitle",
  labelField: "title",
});

export default jobTitleRouter;
