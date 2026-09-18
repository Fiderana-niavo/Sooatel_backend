import { Router } from "express";
import { hrSettingsController } from "../controllers/hr-settings.controller";
import { authMiddleware } from "../../../shared/middlewares/auth.middleware";
import { authorize } from "../../../shared/middlewares/authorize.middleware";

const settingsRouter = Router();

settingsRouter.use(authMiddleware);

settingsRouter.get("/hr", hrSettingsController.getSettings);
settingsRouter.put("/hr", authorize("settings.access"), hrSettingsController.updateSettings);

export default settingsRouter;
