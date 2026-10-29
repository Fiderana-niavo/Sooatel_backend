import { Router } from "express";
import { generateCrudRoutes } from "../../../shared/crud/routes/crudRoutes";
import { shiftTypeController } from "../controllers/shift-type.controller";
import { authMiddleware } from "../../../shared/middlewares/auth.middleware";

import { authorize } from "../../../shared/middlewares/authorize.middleware";

const shiftTypeRouter = Router();

shiftTypeRouter.use(authMiddleware);
shiftTypeRouter.use(authorize("hr.manage"));
generateCrudRoutes(shiftTypeRouter, shiftTypeController);

export default shiftTypeRouter;
