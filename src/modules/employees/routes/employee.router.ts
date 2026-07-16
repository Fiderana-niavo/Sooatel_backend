import { Router } from "express";
import { employeeController } from "../controllers/employee.controller";

import { generateCrudRoutes } from "../../../shared/crud/routes/crudRoutes";

const employeeRouter = Router();

employeeRouter.get('/', employeeController.getAllEmployees);
employeeRouter.get('/:id', employeeController.getById);

employeeRouter.post("/:id/change-job", employeeController.changeJob);
employeeRouter.post("/:id/renew-contract", employeeController.renewContract);
employeeRouter.post("/:id/end-job", employeeController.endJob);
employeeRouter.post("/:id/team", employeeController.setTeam);
employeeRouter.post("/:id/availabilities", employeeController.setAvailabilities);

generateCrudRoutes(employeeRouter, employeeController);

export default employeeRouter;
