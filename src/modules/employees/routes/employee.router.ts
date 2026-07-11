import { Router } from "express";
import { generateCrudRoutes } from "../../../shared/crud/routes/crudRoutes";
import { employeeController } from "../controllers/employee.controller";

const employeeRouter = Router();

employeeRouter.get("/:id", employeeController.getById);
employeeRouter.post("/:id/change-job", employeeController.changeJob);
generateCrudRoutes(employeeRouter, employeeController);

export default employeeRouter;
