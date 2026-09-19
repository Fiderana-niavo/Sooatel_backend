import { Router } from "express";
import { generateCrudRoutes } from "../../../shared/crud/routes/crudRoutes";
import { teamController } from "../controllers/team.controller";
import { authMiddleware } from "../../../shared/middlewares/auth.middleware";

const teamRouter = Router();

teamRouter.use(authMiddleware);

teamRouter.get("/available-members", teamController.getAvailableEmployees);
teamRouter.get("/:id/members", teamController.getMembers);
teamRouter.post("/:id/members", teamController.addMembers);
teamRouter.delete("/:id/members/:idEmployee", teamController.removeMember);

generateCrudRoutes(teamRouter, teamController);

export default teamRouter;
