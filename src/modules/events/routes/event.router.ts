import { Router } from "express";
import { generateCrudRoutes } from "../../../shared/crud/routes/crudRoutes";
import { eventController } from "../controllers/event.controller";
import { authMiddleware } from "../../../shared/middlewares/auth.middleware";

const eventRouter = Router();

eventRouter.use(authMiddleware);
generateCrudRoutes(eventRouter, eventController);

export default eventRouter;
