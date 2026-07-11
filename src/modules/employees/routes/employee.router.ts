import { Router } from "express";
import { generateCrudRoutes } from "../../../shared/crud/routes/crudRoutes";
import { employeeController } from "../controllers/employee.controller";

const employeeRouter = Router();

employeeRouter.get("/:id", employeeController.getById);
employeeRouter.post("/:id/change-job", employeeController.changeJob);
employeeRouter.post("/:id/team", employeeController.setTeam);
employeeRouter.delete("/:id/team", employeeController.deleteTeam);
employeeRouter.post("/:id/availabilities", employeeController.setAvailabilities);
employeeRouter.delete("/:id/availabilities", employeeController.deleteAvailabilities);
generateCrudRoutes(employeeRouter, employeeController);

export default employeeRouter;
