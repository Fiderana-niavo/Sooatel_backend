import { Router } from "express";
import { generateCrudRoutes } from "../../../shared/crud/routes/crudRoutes";
import { shiftTypeController } from "../controllers/shift-type.controller";
import { authMiddleware } from "../../../shared/middlewares/auth.middleware";

const shiftTypeRouter = Router();

shiftTypeRouter.use(authMiddleware);
generateCrudRoutes(shiftTypeRouter, shiftTypeController);

export default shiftTypeRouter;
