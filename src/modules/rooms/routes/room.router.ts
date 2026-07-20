import { Router } from "express";
import { generateCrudRoutes } from "../../../shared/crud/routes/crudRoutes";
import { roomController } from "../controllers/room.controller";
import { authMiddleware } from "../../../shared/middlewares/auth.middleware";

const roomRouter = Router();

roomRouter.use(authMiddleware);
generateCrudRoutes(roomRouter, roomController);

export default roomRouter;
