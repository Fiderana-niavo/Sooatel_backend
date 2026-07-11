import { Router } from "express";
import { generateCrudRoutes } from "../../../shared/crud/routes/crudRoutes";
import { roleController } from "../controllers/role.controller";

const roleRouter = Router();

// Override /:id with role + permissions detail
roleRouter.get("/:id", roleController.getOne);
generateCrudRoutes(roleRouter, roleController);

export default roleRouter;
