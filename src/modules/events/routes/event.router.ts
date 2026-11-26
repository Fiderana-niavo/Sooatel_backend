import { Router } from "express";
import { generateCrudRoutes } from "../../../shared/crud/routes/crudRoutes";
import { eventController } from "../controllers/event.controller";
import { authMiddleware } from "../../../shared/middlewares/auth.middleware";

import { authorize } from "../../../shared/middlewares/authorize.middleware";

const eventRouter = Router();

eventRouter.use(authMiddleware);
eventRouter.use(authorize("hotel.access"));
generateCrudRoutes(eventRouter, eventController);

export default eventRouter;
