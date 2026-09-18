import { Router } from "express";
import { generateCrudRoutes } from "../../../shared/crud/routes/crudRoutes";
import { employeeRequirementController } from "../controllers/employee-requirement.controller";
import { authMiddleware } from "../../../shared/middlewares/auth.middleware";

const employeeRequirementRouter = Router();

employeeRequirementRouter.use(authMiddleware);

// Custom routes before CRUD
employeeRequirementRouter.post("/bulk", employeeRequirementController.bulkCreate);

// Generic CRUD routes
generateCrudRoutes(employeeRequirementRouter, employeeRequirementController);

export default employeeRequirementRouter;
