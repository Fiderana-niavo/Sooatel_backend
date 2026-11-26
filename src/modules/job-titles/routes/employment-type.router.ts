import { Router } from "express";
import { authMiddleware } from "../../../shared/middlewares/auth.middleware";
import { authorize } from "../../../shared/middlewares/authorize.middleware";
import { employmentTypeController } from "../controllers/employment-type.controller";

const employmentTypeRouter = Router();

employmentTypeRouter.use(authMiddleware);

employmentTypeRouter.get(
  "/",
  authorize("employee.manage"),
  employmentTypeController.findAll,
);

export default employmentTypeRouter;
