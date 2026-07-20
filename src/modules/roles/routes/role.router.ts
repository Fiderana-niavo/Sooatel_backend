import { Router } from "express";
import { generateCrudRoutes } from "../../../shared/crud/routes/crudRoutes";
import { roleController } from "../controllers/role.controller";
import { authMiddleware } from "../../../shared/middlewares/auth.middleware";
import { authorize } from "../../../shared/middlewares/authorize.middleware";
import { invalidateAllCache } from "../../../shared/services/UserPermissionCache";

const roleRouter = Router();

roleRouter.use(authMiddleware);

// Override /:id with role + permissions detail
roleRouter.get("/", authorize("security.access"), roleController.findAll);
roleRouter.get("/:id", authorize("security.access"), roleController.getOne);

// On write: invalidate all users' caches since role changes affect everyone holding that role
roleRouter.post("/", authorize("security.access"), (req, res, next) => { invalidateAllCache(); next(); }, roleController.save);
roleRouter.put("/:id", authorize("security.access"), (req, res, next) => { invalidateAllCache(); next(); }, roleController.update);
roleRouter.delete("/:id", authorize("security.access"), (req, res, next) => { invalidateAllCache(); next(); }, roleController.remove);

export default roleRouter;
