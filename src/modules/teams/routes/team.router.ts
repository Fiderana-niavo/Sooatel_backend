import { Router } from "express";
import { generateCrudRoutes } from "../../../shared/crud/routes/crudRoutes";
import { teamController } from "../controllers/team.controller";
import { authMiddleware } from "../../../shared/middlewares/auth.middleware";

const teamRouter = Router();

teamRouter.use(authMiddleware);
generateCrudRoutes(teamRouter, teamController);

export default teamRouter;
