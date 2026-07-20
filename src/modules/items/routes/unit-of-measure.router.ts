import { Router } from "express";
import { generateCrudRoutes } from "../../../shared/crud/routes/crudRoutes";
import { unitOfMeasureController } from "../controllers/unit-of-measure.controller";
import { authMiddleware } from "../../../shared/middlewares/auth.middleware";

const unitOfMeasureRouter = Router();

unitOfMeasureRouter.use(authMiddleware);
generateCrudRoutes(unitOfMeasureRouter, unitOfMeasureController);

export default unitOfMeasureRouter;
