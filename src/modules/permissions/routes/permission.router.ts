import { Router } from "express";
import { generateCrudRoutes } from "../../../shared/crud/routes/crudRoutes";
import { permissionController } from "../controllers/permission.controller";
import { permissionCategoryController } from "../controllers/permissionCategory.controller";
import { authMiddleware } from "../../../shared/middlewares/auth.middleware";
import { authorize } from "../../../shared/middlewares/authorize.middleware";
import { invalidateAllCache } from "../../../shared/services/UserPermissionCache";

const permissionRouter = Router();
const permissionCategoryRouter = Router();

permissionRouter.use(authMiddleware);
permissionCategoryRouter.use(authMiddleware);

// Permissions CRUD with cache invalidation on writes
permissionRouter.get("/", authorize("security.access"), permissionController.findAll);
permissionRouter.get("/:id", authorize("security.access"), permissionController.getOne);
permissionRouter.post("/", authorize("security.access"), (req, res, next) => { invalidateAllCache(); next(); }, permissionController.save);
permissionRouter.put("/:id", authorize("security.access"), (req, res, next) => { invalidateAllCache(); next(); }, permissionController.update);
permissionRouter.delete("/:id", authorize("security.access"), (req, res, next) => { invalidateAllCache(); next(); }, permissionController.remove);

// Permission categories CRUD
generateCrudRoutes(permissionCategoryRouter, permissionCategoryController);

export { permissionRouter, permissionCategoryRouter };
