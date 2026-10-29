import { Router } from "express";
import { generateCrudRoutes } from "../../../shared/crud/routes/crudRoutes";
import { employeeRequirementController } from "../controllers/employee-requirement.controller";
import { authMiddleware } from "../../../shared/middlewares/auth.middleware";
import { authorize } from "../../../shared/middlewares/authorize.middleware";

const employeeRequirementRouter = Router();

employeeRequirementRouter.use(authMiddleware);
employeeRequirementRouter.use(authorize("hr.access"));

// Custom routes before CRUD
employeeRequirementRouter.post(
  "/bulk",
  employeeRequirementController.bulkCreate,
);

// Generic CRUD routes
generateCrudRoutes(employeeRequirementRouter, employeeRequirementController);

export default employeeRequirementRouter;
