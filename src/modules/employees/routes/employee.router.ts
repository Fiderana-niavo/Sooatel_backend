import { Router } from "express";
import { employeeController } from "../controllers/employee.controller";
import { generateCrudRoutes } from "../../../shared/crud/routes/crudRoutes";
import { authMiddleware } from "../../../shared/middlewares/auth.middleware";
import { authorize } from "../../../shared/middlewares/authorize.middleware";

const employeeRouter = Router();

// All employee routes require authentication
employeeRouter.use(authMiddleware);

employeeRouter.get("/", authorize("employee.read"), employeeController.getAllEmployees);
employeeRouter.get("/:id", authorize("employee.read"), employeeController.getById);

employeeRouter.post("/:id/change-job", authorize("employee.update"), employeeController.changeJob);
employeeRouter.post("/:id/renew-contract", authorize("employee.update"), employeeController.renewContract);
employeeRouter.post("/:id/end-job", authorize("employee.update"), employeeController.endJob);
employeeRouter.post("/:id/team", authorize("employee.update"), employeeController.setTeam);
employeeRouter.post("/:id/availabilities", authorize("employee.update"), employeeController.setAvailabilities);

generateCrudRoutes(employeeRouter, employeeController);

export default employeeRouter;
