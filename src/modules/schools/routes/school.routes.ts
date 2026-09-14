import { Router } from "express";
import { schoolController } from "../controllers/school.controller";
import { generateCrudRoutes } from "../../../shared/crud/routes/crudRoutes";
import { authMiddleware } from "../../../shared/middlewares/auth.middleware";
import { authorize } from "../../../shared/middlewares/authorize.middleware";

const schoolRouter = Router();

schoolRouter.use(authMiddleware);

schoolRouter.get("/", authorize("employee.read"), schoolController.findAll);
schoolRouter.get("/:id", authorize("employee.read"), schoolController.getOne);
schoolRouter.post("/", authorize("employee.update"), schoolController.save); // assuming employee.update handles creation
schoolRouter.put("/:id", authorize("employee.update"), schoolController.update);
schoolRouter.delete("/:id", authorize("security.access"), schoolController.remove);

export default schoolRouter;
