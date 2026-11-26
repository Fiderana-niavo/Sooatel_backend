import { Router } from "express";
import { generateCrudRoutes } from "../../../shared/crud/routes/crudRoutes";
import { roomController } from "../controllers/room.controller";
import { authMiddleware } from "../../../shared/middlewares/auth.middleware";
import { authorize } from "../../../shared/middlewares/authorize.middleware";

const roomRouter = Router();

roomRouter.use(authMiddleware);
roomRouter.use(authorize("hotel.access"));
generateCrudRoutes(roomRouter, roomController, { valueField: "idRoom", labelField: "roomNumber" });

export default roomRouter;
