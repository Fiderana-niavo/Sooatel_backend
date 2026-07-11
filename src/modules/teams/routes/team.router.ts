import { Router } from "express";
import { generateCrudRoutes } from "../../../shared/crud/routes/crudRoutes";
import { teamController } from "../controllers/team.controller";

const teamRouter = Router();

generateCrudRoutes(teamRouter, teamController);

export default teamRouter;
