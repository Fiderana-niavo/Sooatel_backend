import { Router } from "express";
import { employeeController } from "../controllers/employee.controller";
import { authMiddleware } from "../../../shared/middlewares/auth.middleware";
import { authorize } from "../../../shared/middlewares/authorize.middleware";

const employeeRouter = Router();

// All employee routes require authentication
employeeRouter.use(authMiddleware);

employeeRouter.get(
  "/salers",
  authorize("sales.pos"),
  employeeController.getSalers,
);
employeeRouter.get(
  "/recent-deactivations",
  authorize("employee.manage"),
  employeeController.recentDeactivations,
);

employeeRouter.get("/", authorize("employee.manage"), employeeController.getAllEmployees);

employeeRouter.get("/me/profile", employeeController.getMyProfile);
employeeRouter.put("/me/profile", employeeController.updateMyProfile);

employeeRouter.get("/:id", authorize("employee.manage"), employeeController.getById);

employeeRouter.post("/:id/change-job", authorize("employee.manage"), employeeController.changeJob);
employeeRouter.post(
  "/:id/renew-contract",
  authorize("employee.manage"),
  employeeController.renewContract,
);
employeeRouter.post("/:id/end-job", authorize("employee.manage"), employeeController.endJob);
employeeRouter.post("/:id/team", authorize("employee.manage"), employeeController.setTeam);
employeeRouter.post(
  "/:id/availabilities",
  authorize("employee.manage"),
  employeeController.setAvailabilities,
);
employeeRouter.post(
  "/:id/confirm",
  authorize("hr.access"),
  employeeController.confirmJob,
);

employeeRouter.post("/", authorize("employee.manage"), employeeController.save);
employeeRouter.put("/:id", authorize("employee.manage"), employeeController.update);
employeeRouter.delete("/:id", authorize("employee.manage"), employeeController.remove);

export default employeeRouter;
