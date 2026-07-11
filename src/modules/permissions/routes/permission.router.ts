import { Router } from "express";
import { generateCrudRoutes } from "../../../shared/crud/routes/crudRoutes";
import { permissionController } from "../controllers/permission.controller";
import { permissionCategoryController } from "../controllers/permissionCategory.controller";

const permissionRouter = Router();
const permissionCategoryRouter = Router();

generateCrudRoutes(permissionRouter, permissionController);
generateCrudRoutes(permissionCategoryRouter, permissionCategoryController);

export { permissionRouter, permissionCategoryRouter };
