import { Router } from "express";
import { generateCrudRoutes } from "../../../shared/crud/routes/crudRoutes";
import { roomTypeController } from "../controllers/room-type.controller";
import { authMiddleware } from "../../../shared/middlewares/auth.middleware";

import { authorize } from "../../../shared/middlewares/authorize.middleware";

const roomTypeRouter = Router();

roomTypeRouter.use(authMiddleware);
roomTypeRouter.use(authorize("hotel.access"));
generateCrudRoutes(roomTypeRouter, roomTypeController, {
  valueField: "idRoomType",
  labelField: "label",
});

export default roomTypeRouter;
