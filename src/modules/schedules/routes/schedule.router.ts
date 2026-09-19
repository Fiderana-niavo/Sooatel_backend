import { Router } from "express";
import { scheduleController } from "../controllers/schedule.controller";
import { authMiddleware } from "../../../shared/middlewares/auth.middleware";

const scheduleRouter = Router();

scheduleRouter.use(authMiddleware);

// Specific routes first (before generic /)
scheduleRouter.get("/check-existing", scheduleController.checkExisting);
scheduleRouter.get("/available-employees", scheduleController.getAvailableEmployees);
scheduleRouter.post("/generate/by-team", scheduleController.generateByTeam);

// Generic CRUD
scheduleRouter.get("/", scheduleController.findByRange);
scheduleRouter.post("/", scheduleController.saveSchedules);

export default scheduleRouter;
