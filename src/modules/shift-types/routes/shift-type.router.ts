import { Router } from "express";
import { generateCrudRoutes } from "../../../shared/crud/routes/crudRoutes";
import { shiftTypeController } from "../controllers/shift-type.controller";

const shiftTypeRouter = Router();

generateCrudRoutes(shiftTypeRouter, shiftTypeController);

export default shiftTypeRouter;
